from flask import Blueprint, request
from app.extensions import db
from app.models import Product, StockHistory
from app.utils.responses import success_response, error_response

stock_bp = Blueprint("stock", __name__)


def normalizar_tamanhos(tamanhos):
    base = {
        "34": "0",
        "35": "0",
        "36": "0",
        "37": "0",
        "38": "0",
        "39": "0",
        "40": "0",
        "41": "0",
        "42": "0",
        "43": "0",
        "44": "0",
    }

    if isinstance(tamanhos, dict):
        for k, v in tamanhos.items():
            base[str(k)] = str(v)

    return base


def calcular_total_tamanhos(tamanhos):
    total = 0
    for valor in tamanhos.values():
        try:
            total += int(valor or 0)
        except (ValueError, TypeError):
            total += 0
    return total


@stock_bp.route("/", methods=["GET"])
def list_stock():
    products = Product.query.all()

    data = []
    for product in products:
        tamanhos = normalizar_tamanhos(product.tamanhos)

        data.append({
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "quantity": product.quantity,
            "price": product.price,
            "image": product.image,
            "nota_fiscal": product.nota_fiscal,
            "tamanhos": tamanhos,
            "created_at": product.created_at.isoformat() if product.created_at else None
        })

    return success_response("Estoque listado com sucesso.", data)


@stock_bp.route("/movement", methods=["POST"])
def stock_movement():
    data = request.get_json()

    product_id = data.get("product_id")
    movement_type = data.get("movement_type")
    quantity = data.get("quantity")
    size = data.get("size")
    nota_fiscal = data.get("nota_fiscal")
    description = data.get("description")

    if not product_id or not movement_type or quantity is None or not size:
        return error_response(
            "product_id, movement_type, quantity e size são obrigatórios.",
            400
        )

    try:
        quantity = int(quantity)
    except (ValueError, TypeError):
        return error_response("quantity deve ser um número inteiro.", 400)

    if quantity <= 0:
        return error_response("quantity deve ser maior que zero.", 400)

    size = str(size)

    product = Product.query.get(product_id)
    if not product:
        return error_response("Produto não encontrado.", 404)

    if movement_type not in ["entrada", "saida", "venda"]:
        return error_response(
            "movement_type deve ser 'entrada', 'saida' ou 'venda'.",
            400
        )

    tamanhos = normalizar_tamanhos(product.tamanhos)

    if size not in tamanhos:
        return error_response("Tamanho inválido para este sistema.", 400)

    quantidade_atual_tamanho = int(tamanhos.get(size, "0") or 0)

    if movement_type == "entrada":
        quantidade_atual_tamanho += quantity
    else:
        if quantidade_atual_tamanho < quantity:
            return error_response(
                f"Estoque insuficiente no tamanho {size}.",
                400
            )
        quantidade_atual_tamanho -= quantity

    tamanhos[size] = str(quantidade_atual_tamanho)
    product.tamanhos = tamanhos
    product.quantity = calcular_total_tamanhos(tamanhos)

    history = StockHistory(
        product_id=product.id,
        movement_type=movement_type,
        quantity=quantity,
        size=size,
        nota_fiscal=nota_fiscal,
        description=description
    )

    db.session.add(history)
    db.session.commit()

    return success_response("Movimentação registrada com sucesso.", {
        "product_id": product.id,
        "product_name": product.name,
        "movement_type": movement_type,
        "size": size,
        "moved_quantity": quantity,
        "new_size_quantity": quantidade_atual_tamanho,
        "new_total_quantity": product.quantity,
        "tamanhos": tamanhos
    })


@stock_bp.route("/history", methods=["GET"])
def stock_history():
    history = StockHistory.query.order_by(StockHistory.created_at.desc()).all()

    data = []
    for item in history:
        data.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name,
            "movement_type": item.movement_type,
            "quantity": item.quantity,
            "size": item.size,
            "nota_fiscal": item.nota_fiscal,
            "description": item.description,
            "created_at": item.created_at.isoformat()
        })

    return success_response("Histórico listado com sucesso.", data)