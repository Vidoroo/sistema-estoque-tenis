from flask import Blueprint, request
from app.extensions import db
from app.models import Devolucao, Venda, VendaItem, Product, StockHistory
from app.utils.responses import success_response, error_response

devolucoes_bp = Blueprint("devolucoes", __name__)


def calcular_total_tamanhos(tamanhos):
    total = 0
    for valor in tamanhos.values():
        try:
            total += int(valor or 0)
        except (ValueError, TypeError):
            pass
    return total


# ── GET /api/devolucoes/ ───────────────────────────────────────────────────────
@devolucoes_bp.route("/", methods=["GET"])
def listar_devolucoes():
    try:
        devolucoes = Devolucao.query.order_by(Devolucao.created_at.desc()).all()

        data = []
        for d in devolucoes:
            venda = d.venda
            data.append({
                "id":              d.id,
                "venda_id":        d.venda_id,
                "cliente_nome":    venda.cliente.nome if venda and venda.cliente else None,
                "vendedor_nome":   venda.vendedor.nome if venda and venda.vendedor else None,
                "valor_venda":     float(venda.valor_total or 0) if venda else 0,
                "valor_devolvido": float(d.valor_devolvido or 0),
                "motivo":          d.motivo,
                "observacoes":     d.observacoes,
                "created_at":      d.created_at.isoformat() if d.created_at else None,
            })

        return success_response("Devoluções listadas.", data)
    except Exception as e:
        return error_response(str(e), 500)


# ── POST /api/devolucoes/ ──────────────────────────────────────────────────────
# Cria devolução e restaura estoque dos itens devolvidos
@devolucoes_bp.route("/", methods=["POST"])
def criar_devolucao():
    try:
        data = request.get_json()

        venda_id        = data.get("venda_id")
        motivo          = data.get("motivo", "").strip()
        valor_devolvido = data.get("valor_devolvido")
        observacoes     = data.get("observacoes", "").strip() or None
        itens_devolvidos = data.get("itens_devolvidos", [])  # [{venda_item_id, quantity}]

        if not venda_id:
            return error_response("venda_id é obrigatório.", 400)
        if not motivo:
            return error_response("Motivo é obrigatório.", 400)
        if valor_devolvido is None:
            return error_response("valor_devolvido é obrigatório.", 400)

        venda = Venda.query.get(venda_id)
        if not venda:
            return error_response("Venda não encontrada.", 404)

        # Verifica se já existe devolução para essa venda
        ja_existe = Devolucao.query.filter_by(venda_id=venda_id).first()
        if ja_existe:
            return error_response("Já existe uma devolução registrada para esta venda.", 400)

        # Restaurar estoque dos itens devolvidos
        for item_dev in itens_devolvidos:
            venda_item_id = item_dev.get("venda_item_id")
            qtd_devolvida = int(item_dev.get("quantity", 0))

            if not venda_item_id or qtd_devolvida <= 0:
                continue

            venda_item = VendaItem.query.get(venda_item_id)
            if not venda_item or venda_item.venda_id != venda_id:
                continue

            if qtd_devolvida > venda_item.quantity:
                return error_response(
                    f"Quantidade devolvida ({qtd_devolvida}) maior que a vendida ({venda_item.quantity}).",
                    400
                )

            product = Product.query.get(venda_item.product_id)
            if product:
                tamanhos = dict(product.tamanhos or {})
                tam = str(venda_item.size)
                qtd_atual = int(tamanhos.get(tam, "0") or 0)
                tamanhos[tam] = str(qtd_atual + qtd_devolvida)
                product.tamanhos = tamanhos
                product.quantity = calcular_total_tamanhos(tamanhos)

                history = StockHistory(
                    product_id=product.id,
                    movement_type="devolucao",
                    quantity=qtd_devolvida,
                    size=tam,
                    description=f"Devolução da Venda #{venda_id}"
                )
                db.session.add(history)

        devolucao = Devolucao(
            venda_id=venda_id,
            motivo=motivo,
            valor_devolvido=valor_devolvido,
            observacoes=observacoes,
        )

        db.session.add(devolucao)
        db.session.commit()

        return success_response("Devolução registrada com sucesso.", {"id": devolucao.id}, 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── DELETE /api/devolucoes/<id> ────────────────────────────────────────────────
@devolucoes_bp.route("/<int:devolucao_id>", methods=["DELETE"])
def excluir_devolucao(devolucao_id):
    try:
        devolucao = Devolucao.query.get(devolucao_id)
        if not devolucao:
            return error_response("Devolução não encontrada.", 404)

        db.session.delete(devolucao)
        db.session.commit()
        return success_response("Devolução excluída.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)