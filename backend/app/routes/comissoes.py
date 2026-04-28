from flask import Blueprint, request
from app.extensions import db
from app.models import Venda, Vendedor
from app.utils.responses import success_response, error_response
from datetime import datetime, date

comissoes_bp = Blueprint("comissoes", __name__)


# ── GET /api/comissoes/ ────────────────────────────────────────────────────────
# Lista todas as comissões (derivadas das vendas)
# Query params: vendedor_id, status (paga|pendente), mes, ano
@comissoes_bp.route("/", methods=["GET"])
def listar_comissoes():
    try:
        vendedor_id = request.args.get("vendedor_id")
        status      = request.args.get("status")        # "paga" | "pendente"
        mes         = request.args.get("mes", type=int)
        ano         = request.args.get("ano", type=int)

        query = Venda.query.filter(Venda.valor_comissao > 0)

        if vendedor_id:
            query = query.filter(Venda.vendedor_id == int(vendedor_id))

        if status == "paga":
            query = query.filter(Venda.comissao_paga == True)
        elif status == "pendente":
            query = query.filter(Venda.comissao_paga == False)

        if mes and ano:
            inicio = date(ano, mes, 1)
            if mes == 12:
                fim = date(ano + 1, 1, 1)
            else:
                fim = date(ano, mes + 1, 1)
            query = query.filter(
                Venda.created_at >= inicio,
                Venda.created_at < fim
            )

        vendas = query.order_by(Venda.created_at.desc()).all()

        data = []
        for v in vendas:
            data.append({
                "venda_id":            v.id,
                "vendedor_id":         v.vendedor_id,
                "vendedor_nome":       v.vendedor.nome if v.vendedor else None,
                "cliente_nome":        v.cliente.nome if v.cliente else None,
                "valor_venda":         float(v.valor_total or 0),
                "percentual_comissao": float(v.percentual_comissao or 0),
                "valor_comissao":      float(v.valor_comissao or 0),
                "comissao_paga":       bool(v.comissao_paga),
                "data_venda":          v.created_at.isoformat() if v.created_at else None,
            })

        return success_response("Comissões listadas.", data)
    except Exception as e:
        return error_response(str(e), 500)


# ── PATCH /api/comissoes/<venda_id>/pagar ─────────────────────────────────────
# Marca ou desmarca comissão de uma venda como paga
@comissoes_bp.route("/<int:venda_id>/pagar", methods=["PATCH"])
def atualizar_status_comissao(venda_id):
    try:
        venda = Venda.query.get(venda_id)
        if not venda:
            return error_response("Venda não encontrada.", 404)

        data = request.get_json() or {}
        venda.comissao_paga = data.get("comissao_paga", not venda.comissao_paga)
        db.session.commit()

        return success_response(
            "Status da comissão atualizado.",
            {"venda_id": venda.id, "comissao_paga": venda.comissao_paga}
        )
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── GET /api/comissoes/resumo ─────────────────────────────────────────────────
# Resumo agrupado por vendedor
@comissoes_bp.route("/resumo", methods=["GET"])
def resumo_comissoes():
    try:
        vendedores = Vendedor.query.filter_by(status="Ativo").all()

        data = []
        for v in vendedores:
            vendas = Venda.query.filter_by(vendedor_id=v.id).all()
            total_comissao  = sum(float(vn.valor_comissao or 0) for vn in vendas)
            comissao_paga   = sum(float(vn.valor_comissao or 0) for vn in vendas if vn.comissao_paga)
            comissao_pendente = total_comissao - comissao_paga

            data.append({
                "vendedor_id":        v.id,
                "vendedor_nome":      v.nome,
                "total_vendas":       len(vendas),
                "total_comissao":     total_comissao,
                "comissao_paga":      comissao_paga,
                "comissao_pendente":  comissao_pendente,
            })

        return success_response("Resumo de comissões.", data)
    except Exception as e:
        return error_response(str(e), 500)