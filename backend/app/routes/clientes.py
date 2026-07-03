from flask import Blueprint, request, jsonify
from app.models import Cliente
from app.extensions import db

clientes_bp = Blueprint("clientes", __name__)


def _cliente_dict(c: Cliente) -> dict:
    return {
        "id":          c.id,
        "nome":        c.nome,
        "cpf_cnpj":   c.cpf_cnpj,
        "telefone":    c.telefone,
        "email":       c.email,
        "cep":         c.cep,
        "endereco":    c.endereco,
        "bairro":      c.bairro,
        "cidade":      c.cidade,
        "complemento": c.complemento,
        "observacoes": c.observacoes,
    }


@clientes_bp.route("/clientes", methods=["GET"])
def listar_clientes():
    clientes = Cliente.query.order_by(Cliente.id.desc()).all()
    return jsonify([_cliente_dict(c) for c in clientes]), 200


@clientes_bp.route("/clientes", methods=["POST"])
def criar_cliente():
    data = request.get_json()
    if not data or not data.get("nome"):
        return jsonify({"erro": "Nome e obrigatorio"}), 400

    cliente = Cliente(
        nome=data.get("nome"),
        cpf_cnpj=data.get("cpf_cnpj"),
        telefone=data.get("telefone"),
        email=data.get("email"),
        cep=data.get("cep"),
        endereco=data.get("endereco"),
        bairro=data.get("bairro"),
        cidade=data.get("cidade"),
        complemento=data.get("complemento"),
        observacoes=data.get("observacoes"),
    )
    db.session.add(cliente)
    db.session.commit()
    return jsonify({"mensagem": "Cliente criado com sucesso"}), 201


@clientes_bp.route("/clientes/<int:id>", methods=["PUT"])
def atualizar_cliente(id):
    cliente = Cliente.query.get(id)
    if not cliente:
        return jsonify({"erro": "Cliente nao encontrado"}), 404

    data = request.get_json()
    cliente.nome        = data.get("nome", cliente.nome)
    cliente.cpf_cnpj   = data.get("cpf_cnpj", cliente.cpf_cnpj)
    cliente.telefone    = data.get("telefone", cliente.telefone)
    cliente.email       = data.get("email", cliente.email)
    cliente.cep         = data.get("cep", cliente.cep)
    cliente.endereco    = data.get("endereco", cliente.endereco)
    cliente.bairro      = data.get("bairro", cliente.bairro)
    cliente.cidade      = data.get("cidade", cliente.cidade)
    cliente.complemento = data.get("complemento", cliente.complemento)
    cliente.observacoes = data.get("observacoes", cliente.observacoes)

    db.session.commit()
    return jsonify({"mensagem": "Cliente atualizado com sucesso"}), 200


@clientes_bp.route("/clientes/<int:id>", methods=["DELETE"])
def deletar_cliente(id):
    cliente = Cliente.query.get(id)
    if not cliente:
        return jsonify({"erro": "Cliente nao encontrado"}), 404

    db.session.delete(cliente)
    db.session.commit()
    return jsonify({"mensagem": "Cliente deletado com sucesso"}), 200