from flask import Blueprint, request
from app.extensions import db
from app.models import Venda, Vendedor, VendaItem, Product
from sqlalchemy import func
from app.utils.responses import success_response, error_response
from datetime import date, datetime, timedelta

relatorios_bp = Blueprint("relatorios", __name__)


def _intervalo_do_request():
    """
    Resolve o periodo a partir dos query params.
    Aceita:  mes + ano   OU   data_inicio + data_fim (YYYY-MM-DD).
    Retorna (inicio_datetime, fim_datetime_exclusivo, rotulo) ou (None, None, erro_str).
    """
    mes = request.args.get("mes", type=int)
    ano = request.args.get("ano", type=int)
    di  = request.args.get("data_inicio")   # "2026-08-01"
    dfim = request.args.get("data_fim")      # "2026-08-31"

    # Prioridade: se veio intervalo de datas, usa ele
    if di and dfim:
        try:
            inicio = datetime.strptime(di, "%Y-%m-%d")
            fim_incl = datetime.strptime(dfim, "%Y-%m-%d")
        except ValueError:
            return None, None, "Datas invalidas. Use o formato AAAA-MM-DD."
        if fim_incl < inicio:
            return None, None, "A data final nao pode ser anterior a inicial."
        # fim exclusivo = dia seguinte ao data_fim (para incluir o dia inteiro)
        fim = fim_incl + timedelta(days=1)
        rotulo = f"{inicio.strftime('%d/%m/%Y')} a {fim_incl.strftime('%d/%m/%Y')}"
        return inicio, fim, rotulo

    # Senao, usa mes+ano
    if mes and ano:
        if mes < 1 or mes > 12:
            return None, None, "Mes deve estar entre 1 e 12."
        inicio = datetime(ano, mes, 1)
        fim = datetime(ano + 1, 1, 1) if mes == 12 else datetime(ano, mes + 1, 1)
        meses_pt = ["", "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
        rotulo = f"{meses_pt[mes]} de {ano}"
        return inicio, fim, rotulo

    return None, None, "Informe mes+ano ou data_inicio+data_fim."


# ── GET /api/relatorios/vendas ────────────────────────────────────────────────
# Query: (mes+ano) | (data_inicio+data_fim) [+ vendedor_id opcional]
@relatorios_bp.route("/vendas", methods=["GET"])
def relatorio_vendas():
    try:
        inicio, fim, rotulo = _intervalo_do_request()
        if inicio is None:
            return error_response(rotulo, 400)  # rotulo carrega a msg de erro

        vendedor_id = request.args.get("vendedor_id", type=int)

        query = Venda.query.filter(
            Venda.created_at >= inicio,
            Venda.created_at < fim,
        )
        if vendedor_id:
            query = query.filter(Venda.vendedor_id == vendedor_id)

        vendas = query.order_by(Venda.created_at.desc()).all()

        # Lista de vendas
        lista = []
        for v in vendas:
            lista.append({
                "id":            v.id,
                "data":          v.created_at.isoformat() if v.created_at else None,
                "cliente_nome":  v.cliente.nome if v.cliente else "-",
                "vendedor_id":   v.vendedor_id,
                "vendedor_nome": v.vendedor.nome if v.vendedor else "-",
                "valor_total":   float(v.valor_total or 0),
                "valor_comissao": float(v.valor_comissao or 0),
                "pedido_id":     getattr(v, "pedido_id", None),
            })

        # Totais gerais
        total_valor = sum(x["valor_total"] for x in lista)
        total_comissao = sum(x["valor_comissao"] for x in lista)
        qtd_vendas = len(lista)

        # Total por vendedor
        por_vendedor = {}
        for x in lista:
            vid = x["vendedor_id"]
            if vid not in por_vendedor:
                por_vendedor[vid] = {
                    "vendedor_id":   vid,
                    "vendedor_nome": x["vendedor_nome"],
                    "qtd_vendas":    0,
                    "valor_total":   0.0,
                    "valor_comissao": 0.0,
                }
            por_vendedor[vid]["qtd_vendas"]    += 1
            por_vendedor[vid]["valor_total"]   += x["valor_total"]
            por_vendedor[vid]["valor_comissao"] += x["valor_comissao"]

        por_vendedor_lista = sorted(
            por_vendedor.values(), key=lambda r: r["valor_total"], reverse=True
        )

        return success_response("Relatorio gerado.", {
            "periodo":       rotulo,
            "vendas":        lista,
            "resumo": {
                "qtd_vendas":     qtd_vendas,
                "total_valor":    total_valor,
                "total_comissao": total_comissao,
            },
            "por_vendedor":  por_vendedor_lista,
        })
    except Exception as e:
        return error_response(str(e), 500)


# ── GET /api/relatorios/produtos ──────────────────────────────────────────────
# Ranking de produtos mais vendidos no periodo.
# Query: (mes+ano) | (data_inicio+data_fim) [+ vendedor_id opcional]
# Agrupa por produto; retorna quantidade e valor, ordenado por quantidade desc.
@relatorios_bp.route("/produtos", methods=["GET"])
def relatorio_produtos():
    try:
        inicio, fim, rotulo = _intervalo_do_request()
        if inicio is None:
            return error_response(rotulo, 400)

        vendedor_id = request.args.get("vendedor_id", type=int)

        # JOIN venda_itens -> vendas p/ filtrar pelo periodo (a data esta na venda)
        q = (
            db.session.query(
                VendaItem.product_id.label("product_id"),
                func.coalesce(func.sum(VendaItem.quantity), 0).label("qtd"),
                func.coalesce(func.sum(VendaItem.subtotal), 0).label("valor"),
            )
            .join(Venda, Venda.id == VendaItem.venda_id)
            .filter(Venda.created_at >= inicio, Venda.created_at < fim)
        )
        if vendedor_id:
            q = q.filter(Venda.vendedor_id == vendedor_id)

        q = q.group_by(VendaItem.product_id)
        linhas = q.all()

        # Busca nome/codigo/categoria dos produtos de uma vez
        ids = [r.product_id for r in linhas]
        produtos = {}
        if ids:
            for p in Product.query.filter(Product.id.in_(ids)).all():
                produtos[p.id] = p

        ranking = []
        for r in linhas:
            prod = produtos.get(r.product_id)
            ranking.append({
                "product_id": r.product_id,
                "produto":    prod.name if prod else f"#{r.product_id}",
                "codigo":     prod.codigo if prod else None,
                "categoria":  prod.category if prod else None,
                "quantidade": int(r.qtd or 0),
                "valor":      float(r.valor or 0),
            })

        # ordena por quantidade desc (o front pode reordenar por valor)
        ranking.sort(key=lambda x: x["quantidade"], reverse=True)

        total_itens = sum(x["quantidade"] for x in ranking)
        total_valor = sum(x["valor"] for x in ranking)

        return success_response("Ranking de produtos gerado.", {
            "periodo":       rotulo,
            "ranking":       ranking,
            "resumo": {
                "produtos_distintos": len(ranking),
                "total_itens":        total_itens,
                "total_valor":        total_valor,
            },
        })
    except Exception as e:
        return error_response(str(e), 500)