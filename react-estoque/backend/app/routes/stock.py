from flask import Blueprint, request
from app.extensions import db
from app.models import Product, StockHistory
from app.utils.responses import success_response, error_response

stock_bp = Blueprint("stock", __name__)

@stock_bp.route("/movement", methods=["POST"])
def stock_movement():
    data = request.get_json()

    product_id = data.get("product_id")
    movement_type = data.get("movement_type")
    quantity = data.get("quantity")
    description = data.get("description")

    if not product_id or not movement_type or not quantity:
        return error_response("product_id, movement_type e quantity são obrigatórios.", 400)

    product = Product.query.get(product_id)
    if not product:
        return error_response("Produto não encontrado.", 404)

    if movement_type not in ["entrada", "saida"]:
        return error_response("movement_type deve ser 'entrada' ou 'saida'.", 400)

    if movement_type == "entrada":
        product.quantity += quantity
    elif movement_type == "saida":
        if product.quantity < quantity:
            return error_response("Estoque insuficiente.", 400)
        product.quantity -= quantity

    history = StockHistory(
        product_id=product.id,
        movement_type=movement_type,
        quantity=quantity,
        description=description
    )

    db.session.add(history)
    db.session.commit()

    return success_response("Movimentação registrada com sucesso.", {
        "product_id": product.id,
        "new_quantity": product.quantity
    })

@stock_bp.route("/history", methods=["GET"])
def stock_history():
    history = StockHistory.query.all()

    data = []
    for item in history:
        data.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": item.product.name,
            "movement_type": item.movement_type,
            "quantity": item.quantity,
            "description": item.description,
            "created_at": item.created_at.isoformat()
        })

    return success_response("Histórico listado com sucesso.", data)