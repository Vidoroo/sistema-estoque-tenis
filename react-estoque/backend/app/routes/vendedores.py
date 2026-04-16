from flask import Blueprint, request
from app.extensions import db
from app.models import Vendedor
from app.utils.responses import success_response, error_response

vendedores_bp = Blueprint("vendedores", __name__)


@vendedores_bp.route("/", methods=["GET"])
def listar_vendedores():
    vendedores = Vendedor.query.order_by(Vendedor.created_at.desc()).all()

    data = []
    for vendedor in vendedores:
        data.append({
            "id": vendedor.id,
            "nome": vendedor.nome,
            "telefone": vendedor.telefone,
            "email": vendedor.email,
            "percentual_comissao": float(vendedor.percentual_comissao or 0),
            "meta_mensal": float(vendedor.meta_mensal or 0),
            "status": vendedor.status,
            "created_at": vendedor.created_at.isoformat() if vendedor.created_at else None
        })

    return success_response("Vendedores listados com sucesso.", data)


@vendedores_bp.route("/", methods=["POST"])
def criar_vendedor():
    data = request.get_json()

    nome = data.get("nome")
    telefone = data.get("telefone")
    email = data.get("email")
    percentual_comissao = data.get("percentual_comissao", 0)
    meta_mensal = data.get("meta_mensal", 0)
    status = data.get("status", "Ativo")

    if not nome:
        return error_response("Nome do vendedor é obrigatório.", 400)

    vendedor = Vendedor(
        nome=nome,
        telefone=telefone,
        email=email,
        percentual_comissao=percentual_comissao or 0,
        meta_mensal=meta_mensal or 0,
        status=status or "Ativo"
    )

    db.session.add(vendedor)
    db.session.commit()

    return success_response("Vendedor cadastrado com sucesso.", {
        "id": vendedor.id,
        "nome": vendedor.nome
    }, 201)


@vendedores_bp.route("/<int:vendedor_id>", methods=["PUT"])
def atualizar_vendedor(vendedor_id):
    vendedor = Vendedor.query.get(vendedor_id)

    if not vendedor:
        return error_response("Vendedor não encontrado.", 404)

    data = request.get_json()

    vendedor.nome = data.get("nome", vendedor.nome)
    vendedor.telefone = data.get("telefone", vendedor.telefone)
    vendedor.email = data.get("email", vendedor.email)
    vendedor.percentual_comissao = data.get("percentual_comissao", vendedor.percentual_comissao)
    vendedor.meta_mensal = data.get("meta_mensal", vendedor.meta_mensal)
    vendedor.status = data.get("status", vendedor.status)

    db.session.commit()

    return success_response("Vendedor atualizado com sucesso.")


@vendedores_bp.route("/<int:vendedor_id>", methods=["DELETE"])
def excluir_vendedor(vendedor_id):
    vendedor = Vendedor.query.get(vendedor_id)

    if not vendedor:
        return error_response("Vendedor não encontrado.", 404)

    db.session.delete(vendedor)
    db.session.commit()

    return success_response("Vendedor excluído com sucesso.")