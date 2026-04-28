from flask import Blueprint, request
from app.extensions import db
from app.models import (
    Pedido, PedidoItem, ProdutoBarcode, Product,
    Cliente, Vendedor, StockHistory
)
from app.utils.responses import success_response, error_response

pedidos_bp = Blueprint("pedidos", __name__)


def _pedido_to_dict(p: Pedido) -> dict:
    total = sum(
        float(i.product.price or 0) * i.quantity
        for i in p.itens if i.product
    )
    separados = sum(i.quantity_separada for i in p.itens)
    total_itens = sum(i.quantity for i in p.itens)
    return {
        "id":           p.id,
        "cliente_id":   p.cliente_id,
        "cliente_nome": p.cliente.nome if p.cliente else None,
        "vendedor_id":  p.vendedor_id,
        "vendedor_nome": p.vendedor.nome if p.vendedor else None,
        "status":       p.status,
        "observacoes":  p.observacoes,
        "valor_total":  total,
        "total_itens":  total_itens,
        "total_separados": separados,
        "created_at":   p.created_at.isoformat() if p.created_at else None,
        "itens": [
            {
                "id":                i.id,
                "product_id":        i.product_id,
                "product_name":      i.product.name if i.product else None,
                "size":              i.size,
                "quantity":          i.quantity,
                "quantity_separada": i.quantity_separada,
                "concluido":         i.quantity_separada >= i.quantity,
                "unit_price":        float(i.product.price or 0) if i.product else 0,
            }
            for i in p.itens
        ],
    }


def _verificar_conclusao(pedido: Pedido):
    """Marca pedido como Concluído se todos os itens foram separados."""
    if all(i.quantity_separada >= i.quantity for i in pedido.itens):
        pedido.status = "Concluído"
        db.session.commit()


# ── GET /api/pedidos/ ──────────────────────────────────────────────────────────
@pedidos_bp.route("/", methods=["GET"])
def listar_pedidos():
    try:
        status      = request.args.get("status")
        cliente_id  = request.args.get("cliente_id")
        vendedor_id = request.args.get("vendedor_id")

        query = Pedido.query
        if status:
            query = query.filter(Pedido.status == status)
        if cliente_id:
            query = query.filter(Pedido.cliente_id == int(cliente_id))
        if vendedor_id:
            query = query.filter(Pedido.vendedor_id == int(vendedor_id))

        pedidos = query.order_by(Pedido.created_at.desc()).all()
        return success_response("Pedidos listados.", [_pedido_to_dict(p) for p in pedidos])
    except Exception as e:
        return error_response(str(e), 500)


# ── GET /api/pedidos/<id> ──────────────────────────────────────────────────────
@pedidos_bp.route("/<int:pedido_id>", methods=["GET"])
def obter_pedido(pedido_id):
    try:
        p = Pedido.query.get(pedido_id)
        if not p:
            return error_response("Pedido não encontrado.", 404)
        return success_response("Pedido encontrado.", _pedido_to_dict(p))
    except Exception as e:
        return error_response(str(e), 500)


# ── POST /api/pedidos/ ─────────────────────────────────────────────────────────
@pedidos_bp.route("/", methods=["POST"])
def criar_pedido():
    try:
        data        = request.get_json()
        cliente_id  = data.get("cliente_id")
        vendedor_id = data.get("vendedor_id")
        observacoes = data.get("observacoes", "")
        itens       = data.get("itens", [])

        if not cliente_id:
            return error_response("cliente_id é obrigatório.", 400)
        if not vendedor_id:
            return error_response("vendedor_id é obrigatório.", 400)
        if not itens:
            return error_response("Pedido precisa ter pelo menos um item.", 400)

        if not Cliente.query.get(cliente_id):
            return error_response("Cliente não encontrado.", 404)
        if not Vendedor.query.get(vendedor_id):
            return error_response("Vendedor não encontrado.", 404)

        pedido = Pedido(
            cliente_id=cliente_id,
            vendedor_id=vendedor_id,
            status="Pendente",
            observacoes=observacoes or None,
        )
        db.session.add(pedido)
        db.session.flush()

        for item in itens:
            product_id = item.get("product_id")
            size       = str(item.get("size", ""))
            quantity   = int(item.get("quantity", 1))

            if not product_id or not size or quantity <= 0:
                return error_response("Cada item precisa de product_id, size e quantity.", 400)
            if not Product.query.get(product_id):
                return error_response(f"Produto {product_id} não encontrado.", 404)

            pi = PedidoItem(
                pedido_id=pedido.id,
                product_id=product_id,
                size=size,
                quantity=quantity,
                quantity_separada=0,
            )
            db.session.add(pi)

        db.session.commit()
        return success_response("Pedido criado.", _pedido_to_dict(pedido), 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── PUT /api/pedidos/<id> ──────────────────────────────────────────────────────
@pedidos_bp.route("/<int:pedido_id>", methods=["PUT"])
def atualizar_pedido(pedido_id):
    try:
        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            return error_response("Pedido não encontrado.", 404)

        data = request.get_json()
        if "status" in data:
            pedido.status = data["status"]
        if "observacoes" in data:
            pedido.observacoes = data["observacoes"] or None

        db.session.commit()
        return success_response("Pedido atualizado.", _pedido_to_dict(pedido))
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── DELETE /api/pedidos/<id> ───────────────────────────────────────────────────
@pedidos_bp.route("/<int:pedido_id>", methods=["DELETE"])
def excluir_pedido(pedido_id):
    try:
        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            return error_response("Pedido não encontrado.", 404)
        if pedido.status == "Concluído":
            return error_response("Não é possível excluir um pedido concluído.", 400)

        db.session.delete(pedido)
        db.session.commit()
        return success_response("Pedido excluído.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── POST /api/pedidos/<id>/baixa-barcode ──────────────────────────────────────
# Bipa um código → dá baixa no item do pedido e no estoque
@pedidos_bp.route("/<int:pedido_id>/baixa-barcode", methods=["POST"])
def baixa_por_barcode(pedido_id):
    try:
        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            return error_response("Pedido não encontrado.", 404)
        if pedido.status == "Cancelado":
            return error_response("Pedido cancelado.", 400)

        data    = request.get_json()
        barcode = data.get("barcode", "").strip()
        if not barcode:
            return error_response("barcode é obrigatório.", 400)

        # Identifica produto + tamanho pelo barcode
        pb = ProdutoBarcode.query.filter_by(barcode=barcode).first()
        if not pb:
            return error_response("Código de barras não encontrado.", 404)

        # Encontra o item correspondente no pedido
        item = next(
            (i for i in pedido.itens
             if i.product_id == pb.product_id and i.size == pb.size),
            None,
        )
        if not item:
            return error_response(
                f"Produto '{pb.product.name}' tamanho {pb.size} não está neste pedido.", 404
            )
        if item.quantity_separada >= item.quantity:
            return error_response(
                f"Item '{pb.product.name}' tam. {pb.size} já foi totalmente separado.", 400
            )

        # Verifica estoque
        product  = pb.product
        tamanhos = dict(product.tamanhos or {})
        estoque  = int(tamanhos.get(pb.size, 0) or 0)
        if estoque <= 0:
            return error_response(f"Estoque insuficiente para tamanho {pb.size}.", 400)

        # Dá baixa: +1 separado, -1 estoque
        item.quantity_separada += 1
        tamanhos[pb.size]       = str(estoque - 1)
        product.tamanhos        = tamanhos
        product.quantity        = sum(int(v or 0) for v in tamanhos.values())

        history = StockHistory(
            product_id=product.id,
            movement_type="separacao_pedido",
            quantity=1,
            size=pb.size,
            description=f"Separação Pedido #{pedido_id} via barcode",
        )
        db.session.add(history)

        if pedido.status == "Pendente":
            pedido.status = "Em Separação"

        db.session.commit()
        _verificar_conclusao(pedido)

        return success_response("Baixa realizada.", {
            "product_name":      product.name,
            "size":              pb.size,
            "quantity_separada": item.quantity_separada,
            "quantity":          item.quantity,
            "pedido_status":     pedido.status,
        })
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── POST /api/pedidos/<id>/baixa-manual ───────────────────────────────────────
# Dá baixa manual por product_id + size + quantity
@pedidos_bp.route("/<int:pedido_id>/baixa-manual", methods=["POST"])
def baixa_manual(pedido_id):
    try:
        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            return error_response("Pedido não encontrado.", 404)
        if pedido.status == "Cancelado":
            return error_response("Pedido cancelado.", 400)

        data       = request.get_json()
        product_id = data.get("product_id")
        size       = str(data.get("size", ""))
        quantity   = int(data.get("quantity", 1))

        if not product_id or not size or quantity <= 0:
            return error_response("product_id, size e quantity são obrigatórios.", 400)

        item = next(
            (i for i in pedido.itens
             if i.product_id == int(product_id) and i.size == size),
            None,
        )
        if not item:
            return error_response("Item não encontrado neste pedido.", 404)

        restante = item.quantity - item.quantity_separada
        if quantity > restante:
            return error_response(
                f"Quantidade ({quantity}) maior que o restante a separar ({restante}).", 400
            )

        product  = item.product
        tamanhos = dict(product.tamanhos or {})
        estoque  = int(tamanhos.get(size, 0) or 0)
        if estoque < quantity:
            return error_response(f"Estoque insuficiente ({estoque}) para tamanho {size}.", 400)

        item.quantity_separada  += quantity
        tamanhos[size]           = str(estoque - quantity)
        product.tamanhos         = tamanhos
        product.quantity         = sum(int(v or 0) for v in tamanhos.values())

        history = StockHistory(
            product_id=product.id,
            movement_type="separacao_pedido",
            quantity=quantity,
            size=size,
            description=f"Separação Pedido #{pedido_id} manual",
        )
        db.session.add(history)

        if pedido.status == "Pendente":
            pedido.status = "Em Separação"

        db.session.commit()
        _verificar_conclusao(pedido)

        return success_response("Baixa manual realizada.", {
            "product_name":      product.name,
            "size":              size,
            "quantity_separada": item.quantity_separada,
            "quantity":          item.quantity,
            "pedido_status":     pedido.status,
        })
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)