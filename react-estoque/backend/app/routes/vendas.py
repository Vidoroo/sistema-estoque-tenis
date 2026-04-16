from flask import Blueprint, request
from app.extensions import db
from app.models import Venda, VendaItem, Product, Cliente, Vendedor, StockHistory
from app.utils.responses import success_response, error_response

vendas_bp = Blueprint("vendas", __name__)

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


@vendas_bp.route("/", methods=["GET"])
def listar_vendas():
    vendas = Venda.query.order_by(Venda.created_at.desc()).all()

    data = []
    for venda in vendas:
        data.append({
            "id": venda.id,
            "cliente_id": venda.cliente_id,
            "cliente_nome": venda.cliente.nome if venda.cliente else None,
            "vendedor_id": venda.vendedor_id,
            "vendedor_nome": venda.vendedor.nome if venda.vendedor else None,
            "valor_total": float(venda.valor_total or 0),
            "percentual_comissao": float(venda.percentual_comissao or 0),
            "valor_comissao": float(venda.valor_comissao or 0),
            "observacoes": venda.observacoes,
            "created_at": venda.created_at.isoformat(),
            "itens": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "product_name": item.product.name if item.product else None,
                    "size": item.size,
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price or 0),
                    "subtotal": float(item.subtotal or 0),
                }
                for item in venda.itens
            ]
        })

    return success_response("Vendas listadas com sucesso.", data)


@vendas_bp.route("/", methods=["POST"])
def criar_venda():
    data = request.get_json()

    cliente_id = data.get("cliente_id")
    vendedor_id = data.get("vendedor_id")
    observacoes = data.get("observacoes")
    itens = data.get("itens", [])

    if not cliente_id:
        return error_response("cliente_id é obrigatório.", 400)

    if not vendedor_id:
        return error_response("vendedor_id é obrigatório.", 400)

    if not itens or not isinstance(itens, list):
        return error_response("A venda precisa ter pelo menos um item.", 400)

    cliente = Cliente.query.get(cliente_id)
    if not cliente:
        return error_response("Cliente não encontrado.", 404)

    vendedor = Vendedor.query.get(vendedor_id)
    if not vendedor:
        return error_response("Vendedor não encontrado.", 404)

    valor_total = 0
    produtos_atualizados = []
    itens_processados = []

    for item in itens:
        product_id = item.get("product_id")
        size = str(item.get("size"))
        quantity = item.get("quantity")

        if not product_id or not size or not quantity:
            return error_response("Cada item precisa ter product_id, size e quantity.", 400)

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return error_response("quantity inválido.", 400)

        if quantity <= 0:
            return error_response("quantity deve ser maior que zero.", 400)

        product = Product.query.get(product_id)
        if not product:
            return error_response(f"Produto {product_id} não encontrado.", 404)

        tamanhos = normalizar_tamanhos(product.tamanhos)

        if size not in tamanhos:
            return error_response(f"Tamanho {size} inválido para o produto {product.name}.", 400)

        qtd_atual = int(tamanhos.get(size, "0") or 0)

        if qtd_atual < quantity:
            return error_response(
                f"Estoque insuficiente para {product.name} no tamanho {size}.",
                400
            )

        qtd_nova = qtd_atual - quantity
        tamanhos[size] = str(qtd_nova)
        product.tamanhos = tamanhos
        product.quantity = calcular_total_tamanhos(tamanhos)

        subtotal = float(product.price or 0) * quantity
        valor_total += subtotal

        produtos_atualizados.append(product)
        itens_processados.append({
            "product": product,
            "size": size,
            "quantity": quantity,
            "unit_price": float(product.price or 0),
            "subtotal": subtotal
        })

    percentual_comissao = float(vendedor.percentual_comissao or 0)
    valor_comissao = (valor_total * percentual_comissao) / 100

    venda = Venda(
        cliente_id=cliente_id,
        vendedor_id=vendedor_id,
        valor_total=valor_total,
        percentual_comissao=percentual_comissao,
        valor_comissao=valor_comissao,
        observacoes=observacoes
    )

    db.session.add(venda)
    db.session.flush()

    for item in itens_processados:
        venda_item = VendaItem(
            venda_id=venda.id,
            product_id=item["product"].id,
            size=item["size"],
            quantity=item["quantity"],
            unit_price=item["unit_price"],
            subtotal=item["subtotal"]
        )
        db.session.add(venda_item)

        history = StockHistory(
            product_id=item["product"].id,
            movement_type="venda",
            quantity=item["quantity"],
            size=item["size"],
            description=f"Venda #{venda.id}"
        )
        db.session.add(history)

    db.session.commit()

    return success_response("Venda registrada com sucesso.", {
        "id": venda.id,
        "valor_total": float(venda.valor_total or 0),
        "percentual_comissao": float(venda.percentual_comissao or 0),
        "valor_comissao": float(venda.valor_comissao or 0),
    }, 201)