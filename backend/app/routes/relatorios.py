from flask import Blueprint, request
from app.extensions import db
from app.models import Venda, Vendedor
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