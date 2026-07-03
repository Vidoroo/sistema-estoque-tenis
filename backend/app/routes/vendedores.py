import os
import uuid
from flask import Blueprint, request
from werkzeug.security import generate_password_hash
from app.extensions import db
from app.models import Vendedor
from app.utils.responses import success_response, error_response

vendedores_bp = Blueprint("vendedores", __name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://sistema-estoque-tenis-frontend.onrender.com")


def _gerar_token() -> str:
    return str(uuid.uuid4())


def _vendedor_dict(v: Vendedor) -> dict:
    link = f"{FRONTEND_URL}/vendedor/{v.token}" if v.token else None
    return {
        "id":                  v.id,
        "nome":                v.nome,
        "telefone":            v.telefone,
        "email":               v.email,
        "cep":                 v.cep,
        "endereco":            v.endereco,
        "bairro":              v.bairro,
        "cidade":              v.cidade,
        "complemento":         v.complemento,
        "percentual_comissao": float(v.percentual_comissao or 0),
        "meta_mensal":         float(v.meta_mensal or 0),
        "status":              v.status,
        "token":               v.token,
        "login_ativo":         v.login_ativo,
        "senha_configurada":   bool(v.senha_hash),
        "link_portal":         link,
        "created_at":          v.created_at.isoformat() if v.created_at else None,
    }


@vendedores_bp.route("/", methods=["GET"])
def listar_vendedores():
    vendedores = Vendedor.query.order_by(Vendedor.created_at.desc()).all()
    return success_response("Vendedores listados.", [_vendedor_dict(v) for v in vendedores])


@vendedores_bp.route("/", methods=["POST"])
def criar_vendedor():
    try:
        data = request.get_json()
        nome = data.get("nome", "").strip()
        if not nome:
            return error_response("Nome e obrigatorio.", 400)

        token = _gerar_token()
        while Vendedor.query.filter_by(token=token).first():
            token = _gerar_token()

        vendedor = Vendedor(
            nome=nome,
            telefone=data.get("telefone") or None,
            email=data.get("email") or None,
            cep=data.get("cep") or None,
            endereco=data.get("endereco") or None,
            bairro=data.get("bairro") or None,
            cidade=data.get("cidade") or None,
            complemento=data.get("complemento") or None,
            percentual_comissao=data.get("percentual_comissao", 0) or 0,
            meta_mensal=data.get("meta_mensal", 0) or 0,
            status=data.get("status", "Ativo") or "Ativo",
            token=token,
            login_ativo=True,
        )
        db.session.add(vendedor)
        db.session.commit()
        return success_response("Vendedor cadastrado.", _vendedor_dict(vendedor), 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@vendedores_bp.route("/<int:vendedor_id>", methods=["PUT"])
def atualizar_vendedor(vendedor_id):
    try:
        v = Vendedor.query.get(vendedor_id)
        if not v:
            return error_response("Vendedor nao encontrado.", 404)

        data = request.get_json()
        v.nome                = data.get("nome", v.nome)
        v.telefone            = data.get("telefone", v.telefone)
        v.email               = data.get("email", v.email)
        v.cep                 = data.get("cep", v.cep)
        v.endereco            = data.get("endereco", v.endereco)
        v.bairro              = data.get("bairro", v.bairro)
        v.cidade              = data.get("cidade", v.cidade)
        v.complemento         = data.get("complemento", v.complemento)
        v.percentual_comissao = data.get("percentual_comissao", v.percentual_comissao)
        v.meta_mensal         = data.get("meta_mensal", v.meta_mensal)
        v.status              = data.get("status", v.status)
        v.login_ativo         = data.get("login_ativo", v.login_ativo)

        db.session.commit()
        return success_response("Vendedor atualizado.", _vendedor_dict(v))
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@vendedores_bp.route("/<int:vendedor_id>/senha", methods=["POST"])
def definir_senha_vendedor(vendedor_id):
    try:
        v = Vendedor.query.get(vendedor_id)
        if not v:
            return error_response("Vendedor nao encontrado.", 404)

        data  = request.get_json()
        senha = data.get("senha", "").strip()
        if not senha or len(senha) < 4:
            return error_response("Senha deve ter pelo menos 4 caracteres.", 400)

        v.senha_hash = generate_password_hash(senha)
        db.session.commit()
        return success_response("Senha definida com sucesso.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@vendedores_bp.route("/<int:vendedor_id>/regenerar-token", methods=["POST"])
def regenerar_token(vendedor_id):
    try:
        v = Vendedor.query.get(vendedor_id)
        if not v:
            return error_response("Vendedor nao encontrado.", 404)

        novo_token = _gerar_token()
        while Vendedor.query.filter_by(token=novo_token).first():
            novo_token = _gerar_token()

        v.token = novo_token
        db.session.commit()
        return success_response("Token regenerado.", {
            "token":       v.token,
            "link_portal": f"{FRONTEND_URL}/vendedor/{v.token}",
        })
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


@vendedores_bp.route("/<int:vendedor_id>", methods=["DELETE"])
def excluir_vendedor(vendedor_id):
    try:
        v = Vendedor.query.get(vendedor_id)
        if not v:
            return error_response("Vendedor nao encontrado.", 404)
        db.session.delete(v)
        db.session.commit()
        return success_response("Vendedor excluido.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)