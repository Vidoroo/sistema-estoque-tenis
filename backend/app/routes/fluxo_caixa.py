from flask import Blueprint, request
from app.extensions import db
from app.models import LancamentoCaixa, Venda, Devolucao
from app.utils.responses import success_response, error_response
from datetime import datetime, date

fluxo_caixa_bp = Blueprint("fluxo_caixa", __name__)


# ── GET /api/fluxo-caixa/ ─────────────────────────────────────────────────────
# Retorna todas as movimentações (vendas + devoluções + lançamentos manuais)
# Query params: mes, ano
@fluxo_caixa_bp.route("/", methods=["GET"])
def listar_fluxo():
    try:
        mes = request.args.get("mes", type=int)
        ano = request.args.get("ano", type=int)

        movimentacoes = []

        # Filtro de período
        def no_periodo(dt):
            if not mes or not ano or not dt:
                return True
            return dt.year == ano and dt.month == mes

        # 1. Vendas → entradas
        vendas = Venda.query.order_by(Venda.created_at.desc()).all()
        for v in vendas:
            if no_periodo(v.created_at):
                movimentacoes.append({
                    "id":        f"venda-{v.id}",
                    "tipo":      "entrada",
                    "descricao": f"Venda #{v.id} — {v.cliente.nome if v.cliente else ''}",
                    "categoria": "Venda",
                    "valor":     float(v.valor_total or 0),
                    "data":      v.created_at.isoformat() if v.created_at else None,
                    "origem":    "venda",
                    "origem_id": v.id,
                })

        # 2. Devoluções → saídas
        devolucoes = Devolucao.query.order_by(Devolucao.created_at.desc()).all()
        for d in devolucoes:
            if no_periodo(d.created_at):
                cliente_nome = d.venda.cliente.nome if d.venda and d.venda.cliente else ""
                movimentacoes.append({
                    "id":        f"dev-{d.id}",
                    "tipo":      "saida",
                    "descricao": f"Devolução #{d.id} — {cliente_nome}",
                    "categoria": "Devolução",
                    "valor":     float(d.valor_devolvido or 0),
                    "data":      d.created_at.isoformat() if d.created_at else None,
                    "origem":    "devolucao",
                    "origem_id": d.id,
                })

        # 3. Lançamentos manuais
        query_lanc = LancamentoCaixa.query
        if mes and ano:
            inicio = date(ano, mes, 1)
            fim    = date(ano + 1, 1, 1) if mes == 12 else date(ano, mes + 1, 1)
            query_lanc = query_lanc.filter(
                LancamentoCaixa.created_at >= inicio,
                LancamentoCaixa.created_at < fim
            )
        lancamentos = query_lanc.order_by(LancamentoCaixa.created_at.desc()).all()
        for l in lancamentos:
            movimentacoes.append({
                "id":        f"lanc-{l.id}",
                "tipo":      l.tipo,
                "descricao": l.descricao,
                "categoria": l.categoria or "Manual",
                "valor":     float(l.valor or 0),
                "data":      l.created_at.isoformat() if l.created_at else None,
                "origem":    "manual",
                "origem_id": l.id,
            })

        # Ordena por data desc
        movimentacoes.sort(key=lambda x: x["data"] or "", reverse=True)

        # Totais
        total_entradas = sum(m["valor"] for m in movimentacoes if m["tipo"] == "entrada")
        total_saidas   = sum(m["valor"] for m in movimentacoes if m["tipo"] == "saida")
        saldo          = total_entradas - total_saidas

        return success_response("Fluxo de caixa listado.", {
            "movimentacoes": movimentacoes,
            "total_entradas": total_entradas,
            "total_saidas":   total_saidas,
            "saldo":          saldo,
        })
    except Exception as e:
        return error_response(str(e), 500)


# ── POST /api/fluxo-caixa/ ────────────────────────────────────────────────────
# Cria lançamento manual
@fluxo_caixa_bp.route("/", methods=["POST"])
def criar_lancamento():
    try:
        data = request.get_json()

        tipo      = data.get("tipo", "").strip()
        descricao = data.get("descricao", "").strip()
        valor     = data.get("valor")
        categoria = data.get("categoria", "").strip() or None

        if tipo not in ("entrada", "saida"):
            return error_response("tipo deve ser 'entrada' ou 'saida'.", 400)
        if not descricao:
            return error_response("Descrição é obrigatória.", 400)
        if valor is None or float(valor) <= 0:
            return error_response("Valor deve ser maior que zero.", 400)

        lancamento = LancamentoCaixa(
            tipo=tipo,
            descricao=descricao,
            valor=float(valor),
            categoria=categoria,
        )
        db.session.add(lancamento)
        db.session.commit()

        return success_response("Lançamento criado.", {"id": lancamento.id}, 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── DELETE /api/fluxo-caixa/<id> ──────────────────────────────────────────────
# Exclui apenas lançamentos manuais
@fluxo_caixa_bp.route("/<int:lancamento_id>", methods=["DELETE"])
def excluir_lancamento(lancamento_id):
    try:
        lancamento = LancamentoCaixa.query.get(lancamento_id)
        if not lancamento:
            return error_response("Lançamento não encontrado.", 404)

        db.session.delete(lancamento)
        db.session.commit()
        return success_response("Lançamento excluído.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)