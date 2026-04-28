from flask import Blueprint, request
from datetime import datetime
import random

from app.extensions import db
from app.models import Product
from app.utils.responses import success_response, error_response

products_bp = Blueprint("products", __name__)


def parse_data_brasileira(valor):
    if not valor:
        return None

    valor = str(valor).strip()

    if not valor:
        return None

    formatos = ["%d/%m/%Y", "%Y-%m-%d"]

    for formato in formatos:
        try:
            return datetime.strptime(valor, formato).date()
        except ValueError:
            continue

    return None


def gerar_codigo_4_digitos():
    for _ in range(100):
        codigo = str(random.randint(1000, 9999))
        existe = Product.query.filter_by(codigo=codigo).first()
        if not existe:
            return codigo
    return None


@products_bp.route("/", methods=["POST"])
def create_product():
    data = request.get_json()

    name = data.get("name")
    category = data.get("category")
    quantity = data.get("quantity", 0)
    price = data.get("price", 0)
    image = data.get("image", "")

    codigo = data.get("codigo")
    preco_atacado = data.get("preco_atacado")
    preco_dropshipping = data.get("preco_dropshipping")
    preco_varejo = data.get("preco_varejo")

    nota_fiscal = data.get("nota_fiscal")
    serie_nf = data.get("serie_nf")
    fornecedor = data.get("fornecedor")
    chave_acesso = data.get("chave_acesso")
    observacoes_nf = data.get("observacoes_nf")
    tamanhos = data.get("tamanhos")

    if not name:
        return error_response("Nome do produto é obrigatório.", 400)

    if not category:
        return error_response("Categoria é obrigatória.", 400)

    valor_data = data.get("data_emissao")
    data_emissao = None

    if valor_data and str(valor_data).strip():
        data_emissao = parse_data_brasileira(valor_data)
        if not data_emissao:
            return error_response(
                "Data de emissão inválida. Use o formato dd/mm/aaaa.",
                400
            )

    if codigo:
        codigo = str(codigo).strip()

        if len(codigo) != 4 or not codigo.isdigit():
            return error_response("O código deve ter exatamente 4 dígitos.", 400)

        produto_existente = Product.query.filter_by(codigo=codigo).first()
        if produto_existente:
            return error_response("Já existe um produto com esse código.", 400)
    else:
        codigo = gerar_codigo_4_digitos()
        if not codigo:
            return error_response("Não foi possível gerar um código único.", 500)

    product = Product(
        codigo=codigo,
        name=name,
        category=category,
        quantity=quantity,
        price=price,
        image=image,
        preco_atacado=preco_atacado,
        preco_dropshipping=preco_dropshipping,
        preco_varejo=preco_varejo,
        nota_fiscal=nota_fiscal,
        serie_nf=serie_nf,
        data_emissao=data_emissao,
        fornecedor=fornecedor,
        chave_acesso=chave_acesso,
        observacoes_nf=observacoes_nf,
        tamanhos=tamanhos
    )

    db.session.add(product)
    db.session.commit()

    return success_response("Produto cadastrado com sucesso.", {
        "id": product.id,
        "codigo": product.codigo,
        "name": product.name,
        "image": product.image,
        "nota_fiscal": product.nota_fiscal,
        "tamanhos": product.tamanhos
    }, 201)


@products_bp.route("/", methods=["GET"])
def list_products():
    products = Product.query.all()

    data = []
    for product in products:
        data.append({
            "id": product.id,
            "codigo": product.codigo,
            "name": product.name,
            "category": product.category,
            "quantity": product.quantity,
            "price": product.price,
            "image": product.image,
            "preco_atacado": float(product.preco_atacado or 0),
            "preco_dropshipping": float(product.preco_dropshipping or 0),
            "preco_varejo": float(product.preco_varejo or 0),
            "nota_fiscal": product.nota_fiscal,
            "serie_nf": product.serie_nf,
            "data_emissao": product.data_emissao.strftime("%d/%m/%Y") if product.data_emissao else None,
            "fornecedor": product.fornecedor,
            "chave_acesso": product.chave_acesso,
            "observacoes_nf": product.observacoes_nf,
            "tamanhos": product.tamanhos,
            "created_at": product.created_at.isoformat()
        })

    return success_response("Produtos listados com sucesso.", data)


@products_bp.route("/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    product = Product.query.get(product_id)

    if not product:
        return error_response("Produto não encontrado.", 404)

    data = request.get_json()

    valor_data = data.get("data_emissao")
    data_emissao = product.data_emissao

    if valor_data is not None:
        if str(valor_data).strip() == "":
            data_emissao = None
        else:
            data_convertida = parse_data_brasileira(valor_data)
            if not data_convertida:
                return error_response(
                    "Data de emissão inválida. Use o formato dd/mm/aaaa.",
                    400
                )
            data_emissao = data_convertida

    novo_codigo = data.get("codigo", product.codigo)
    if novo_codigo:
        novo_codigo = str(novo_codigo).strip()

        if len(novo_codigo) != 4 or not novo_codigo.isdigit():
            return error_response("O código deve ter exatamente 4 dígitos.", 400)

        produto_existente = Product.query.filter(
            Product.codigo == novo_codigo,
            Product.id != product.id
        ).first()

        if produto_existente:
            return error_response("Já existe outro produto com esse código.", 400)

    product.codigo = novo_codigo
    product.name = data.get("name", product.name)
    product.category = data.get("category", product.category)
    product.quantity = data.get("quantity", product.quantity)
    product.price = data.get("price", product.price)
    product.image = data.get("image", product.image)

    product.preco_atacado = data.get("preco_atacado", product.preco_atacado)
    product.preco_dropshipping = data.get("preco_dropshipping", product.preco_dropshipping)
    product.preco_varejo = data.get("preco_varejo", product.preco_varejo)

    product.nota_fiscal = data.get("nota_fiscal", product.nota_fiscal)
    product.serie_nf = data.get("serie_nf", product.serie_nf)
    product.data_emissao = data_emissao
    product.fornecedor = data.get("fornecedor", product.fornecedor)
    product.chave_acesso = data.get("chave_acesso", product.chave_acesso)
    product.observacoes_nf = data.get("observacoes_nf", product.observacoes_nf)
    product.tamanhos = data.get("tamanhos", product.tamanhos)

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