from flask import Blueprint, request, jsonify
from app.models import Cliente
from app.extensions import db

clientes_bp = Blueprint("clientes", __name__)

@clientes_bp.route("/clientes", methods=["GET"])
def listar_clientes():
    clientes = Cliente.query.order_by(Cliente.id.desc()).all()

    resultado = []
    for c in clientes:
        resultado.append({
            "id": c.id,
            "nome": c.nome,
            "cpf_cnpj": c.cpf_cnpj,
            "telefone": c.telefone,
            "email": c.email,
            "endereco": c.endereco,
            "cidade": c.cidade,
            "observacoes": c.observacoes
        })

    return jsonify(resultado), 200


@clientes_bp.route("/clientes", methods=["POST"])
def criar_cliente():
    data = request.get_json()

    if not data or not data.get("nome"):
        return jsonify({"erro": "Nome é obrigatório"}), 400

    cliente = Cliente(
        nome=data.get("nome"),
        cpf_cnpj=data.get("cpf_cnpj"),
        telefone=data.get("telefone"),
        email=data.get("email"),
        endereco=data.get("endereco"),
        cidade=data.get("cidade"),
        observacoes=data.get("observacoes"),
    )

    db.session.add(cliente)
    db.session.commit()

    return jsonify({"mensagem": "Cliente criado com sucesso"}), 201


@clientes_bp.route("/clientes/<int:id>", methods=["PUT"])
def atualizar_cliente(id):
    cliente = Cliente.query.get(id)

    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404

    data = request.get_json()

    cliente.nome = data.get("nome")
    cliente.cpf_cnpj = data.get("cpf_cnpj")
    cliente.telefone = data.get("telefone")
    cliente.email = data.get("email")
    cliente.endereco = data.get("endereco")
    cliente.cidade = data.get("cidade")
    cliente.observacoes = data.get("observacoes")

    db.session.commit()

    return jsonify({"mensagem": "Cliente atualizado com sucesso"}), 200


@clientes_bp.route("/clientes/<int:id>", methods=["DELETE"])
def deletar_cliente(id):
    cliente = Cliente.query.get(id)

    if not cliente:
        return jsonify({"erro": "Cliente não encontrado"}), 404

    db.session.delete(cliente)
    db.session.commit()

    return jsonify({"mensagem": "Cliente deletado com sucesso"}), 200