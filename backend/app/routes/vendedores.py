import uuid
from flask import Blueprint, request
from werkzeug.security import generate_password_hash
from app.extensions import db
from app.models import Vendedor
from app.utils.responses import success_response, error_response

vendedores_bp = Blueprint("vendedores", __name__)


def _gerar_token() -> str:
    return str(uuid.uuid4())


def _vendedor_dict(v: Vendedor, base_url: str = "") -> dict:
    link = f"{base_url}/vendedor/{v.token}" if v.token else None
    return {
        "id":                  v.id,
        "nome":                v.nome,
        "telefone":            v.telefone,
        "email":               v.email,
        "percentual_comissao": float(v.percentual_comissao or 0),
        "meta_mensal":         float(v.meta_mensal or 0),
        "status":              v.status,
        "token":               v.token,
        "login_ativo":         v.login_ativo,
        "senha_configurada":   bool(v.senha_hash),
        "link_portal":         link,
        "created_at":          v.created_at.isoformat() if v.created_at else None,
    }


# ── GET /api/vendedores/ ───────────────────────────────────────────────────────
@vendedores_bp.route("/", methods=["GET"])
def listar_vendedores():
    vendedores = Vendedor.query.order_by(Vendedor.created_at.desc()).all()
    base = "http://localhost:5173"  # Aponta pro frontend
    return success_response("Vendedores listados.", [_vendedor_dict(v, base) for v in vendedores])


# ── POST /api/vendedores/ ──────────────────────────────────────────────────────
@vendedores_bp.route("/", methods=["POST"])
def criar_vendedor():
    try:
        data = request.get_json()
        nome = data.get("nome", "").strip()
        if not nome:
            return error_response("Nome é obrigatório.", 400)

        token = _gerar_token()
        # Garante unicidade do token
        while Vendedor.query.filter_by(token=token).first():
            token = _gerar_token()

        vendedor = Vendedor(
            nome=nome,
            telefone=data.get("telefone") or None,
            email=data.get("email") or None,
            percentual_comissao=data.get("percentual_comissao", 0) or 0,
            meta_mensal=data.get("meta_mensal", 0) or 0,
            status=data.get("status", "Ativo") or "Ativo",
            token=token,
            login_ativo=True,
        )
        db.session.add(vendedor)
        db.session.commit()

        base = request.host_url.rstrip("/").replace("5000", "5173")
        return success_response("Vendedor cadastrado.", _vendedor_dict(vendedor, base), 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── PUT /api/vendedores/<id> ──────────────────────────────────────────────────
@vendedores_bp.route("/<int:vendedor_id>", methods=["PUT"])
def atualizar_vendedor(vendedor_id):
    try:
        v = Vendedor.query.get(vendedor_id)
        if not v:
            return error_response("Vendedor não encontrado.", 404)

        data = request.get_json()
        v.nome                = data.get("nome", v.nome)
        v.telefone            = data.get("telefone", v.telefone)
        v.email               = data.get("email", v.email)
        v.percentual_comissao = data.get("percentual_comissao", v.percentual_comissao)
        v.meta_mensal         = data.get("meta_mensal", v.meta_mensal)
        v.status              = data.get("status", v.status)
        v.login_ativo         = data.get("login_ativo", v.login_ativo)

        db.session.commit()
        base = request.host_url.rstrip("/").replace("5000", "5173")
        return success_response("Vendedor atualizado.", _vendedor_dict(v, base))
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── POST /api/vendedores/<id>/senha ──────────────────────────────────────────
# Admin define/redefine a senha do portal do vendedor
@vendedores_bp.route("/<int:vendedor_id>/senha", methods=["POST"])
def definir_senha_vendedor(vendedor_id):
    try:
        v = Vendedor.query.get(vendedor_id)
        if not v:
            return error_response("Vendedor não encontrado.", 404)

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


# ── POST /api/vendedores/<id>/regenerar-token ────────────────────────────────
# Gera um novo token (invalida o link anterior)
@vendedores_bp.route("/<int:vendedor_id>/regenerar-token", methods=["POST"])
def regenerar_token(vendedor_id):
    try:
        v = Vendedor.query.get(vendedor_id)
        if not v:
            return error_response("Vendedor não encontrado.", 404)

        novo_token = _gerar_token()
        while Vendedor.query.filter_by(token=novo_token).first():
            novo_token = _gerar_token()

        v.token = novo_token
        db.session.commit()

        base = request.host_url.rstrip("/").replace("5000", "5173")
        return success_response("Token regenerado.", {
            "token":      v.token,
            "link_portal": f"{base}/vendedor/{v.token}",
        })
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── DELETE /api/vendedores/<id> ───────────────────────────────────────────────
@vendedores_bp.route("/<int:vendedor_id>", methods=["DELETE"])
def excluir_vendedor(vendedor_id):
    try:
        v = Vendedor.query.get(vendedor_id)
        if not v:
            return error_response("Vendedor não encontrado.", 404)
        db.session.delete(v)
        db.session.commit()
        return success_response("Vendedor excluído.")
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)