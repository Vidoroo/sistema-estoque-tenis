from flask import Blueprint, request
from app.extensions import db
from app.models import Product
from app.utils.responses import success_response, error_response

products_bp = Blueprint("products", __name__)

@products_bp.route("/", methods=["POST"])
def create_product():
    data = request.get_json()

    name = data.get("name")
    category = data.get("category")
    quantity = data.get("quantity", 0)
    price = data.get("price", 0)

    if not name:
        return error_response("Nome do produto é obrigatório.", 400)

    product = Product(
        name=name,
        category=category,
        quantity=quantity,
        price=price
    )

    db.session.add(product)
    db.session.commit()

    return success_response("Produto cadastrado com sucesso.", {
        "id": product.id,
        "name": product.name
    }, 201)

@products_bp.route("/", methods=["GET"])
def list_products():
    products = Product.query.all()

    data = []
    for product in products:
        data.append({
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "quantity": product.quantity,
            "price": product.price,
            "created_at": product.created_at.isoformat()
        })

    return success_response("Produtos listados com sucesso.", data)

@products_bp.route("/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    product = Product.query.get(product_id)

    if not product:
        return error_response("Produto não encontrado.", 404)

    data = request.get_json()

    product.name = data.get("name", product.name)
    product.category = data.get("category", product.category)
    product.quantity = data.get("quantity", product.quantity)
    product.price = data.get("price", product.price)

    db.session.commit()

    return success_response("Produto atualizado com sucesso.")

@products_bp.route("/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    product = Product.query.get(product_id)

    if not product:
        return error_response("Produto não encontrado.", 404)

    db.session.delete(product)
    db.session.commit()

    return success_response("Produto removido com sucesso.")