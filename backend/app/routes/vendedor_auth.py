import uuid
from flask import Blueprint, request
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db
from app.models import Vendedor, Product, Cliente
from app.utils.responses import success_response, error_response

vendedor_auth_bp = Blueprint("vendedor_auth", __name__)


def _get_vendedor_by_token(token: str):
    """Valida o token do vendedor e retorna o objeto."""
    return Vendedor.query.filter_by(token=token, login_ativo=True).first()


def _require_vendedor(request) -> tuple:
    """Extrai e valida o token do vendedor do header."""
    token = request.headers.get("X-Vendedor-Token", "").strip()
    if not token:
        return None, error_response("Token do vendedor não fornecido.", 401)
    v = _get_vendedor_by_token(token)
    if not v:
        return None, error_response("Token inválido ou vendedor inativo.", 401)
    return v, None


# ── POST /api/vendedor-auth/login ─────────────────────────────────────────────
@vendedor_auth_bp.route("/login", methods=["POST"])
def login_vendedor():
    try:
        data  = request.get_json()
        token = data.get("token", "").strip()
        senha = data.get("senha", "")

        if not token or not senha:
            return error_response("Token e senha são obrigatórios.", 400)

        vendedor = _get_vendedor_by_token(token)
        if not vendedor:
            return error_response("Link inválido ou vendedor inativo.", 401)

        if not vendedor.senha_hash:
            return error_response("Senha não configurada. Solicite ao administrador.", 403)

        if not check_password_hash(vendedor.senha_hash, senha):
            return error_response("Senha incorreta.", 401)

        return success_response("Login realizado com sucesso.", {
            "vendedor_id":   vendedor.id,
            "vendedor_nome": vendedor.nome,
            "token":         vendedor.token,
        })
    except Exception as e:
        return error_response(str(e), 500)


# ── GET /api/vendedor-auth/produtos ──────────────────────────────────────────
# Retorna todos os produtos ativos (catálogo completo)
@vendedor_auth_bp.route("/produtos", methods=["GET"])
def produtos_vendedor():
    try:
        v, err = _require_vendedor(request)
        if err:
            return err

        busca = request.args.get("busca", "").strip()
        query = Product.query

        if busca:
            query = query.filter(Product.name.ilike(f"%{busca}%"))

        produtos = query.all()
        data = [
            {
                "id":       p.id,
                "name":     p.name,
                "category": p.category,
                "preco_varejo": float(p.preco_varejo or 0),
                "tamanhos": p.tamanhos,
                "quantity": p.quantity,
                "image":    p.image,
            }
            for p in produtos
            if p.quantity and p.quantity > 0
        ]

        return success_response("Produtos listados.", data)
    except Exception as e:
        return error_response(str(e), 500)


# ── GET /api/vendedor-auth/clientes ──────────────────────────────────────────
# Retorna apenas os clientes criados por este vendedor
@vendedor_auth_bp.route("/clientes", methods=["GET"])
def clientes_vendedor():
    try:
        v, err = _require_vendedor(request)
        if err:
            return err

        clientes = Cliente.query.filter_by(vendedor_criador_id=v.id).all()
        data = [
            {
                "id":       c.id,
                "nome":     c.nome,
                "telefone": c.telefone,
                "email":    c.email,
                "cidade":   c.cidade,
            }
            for c in clientes
        ]
        return success_response("Clientes listados.", data)
    except Exception as e:
        return error_response(str(e), 500)


# ── POST /api/vendedor-auth/clientes ─────────────────────────────────────────
# Vendedor cadastra um novo cliente (vinculado a ele)
@vendedor_auth_bp.route("/clientes", methods=["POST"])
def criar_cliente_vendedor():
    try:
        v, err = _require_vendedor(request)
        if err:
            return err

        data = request.get_json()
        if not data or not data.get("nome"):
            return error_response("Nome é obrigatório.", 400)

        cliente = Cliente(
            nome=data["nome"].strip(),
            cpf_cnpj=data.get("cpf_cnpj", "").strip() or None,
            telefone=data.get("telefone", "").strip() or None,
            email=data.get("email", "").strip() or None,
            endereco=data.get("endereco", "").strip() or None,
            cidade=data.get("cidade", "").strip() or None,
            observacoes=data.get("observacoes", "").strip() or None,
            vendedor_criador_id=v.id,
        )
        db.session.add(cliente)
        db.session.commit()

        return success_response("Cliente cadastrado.", {
            "id":   cliente.id,
            "nome": cliente.nome,
        }, 201)
    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# ── GET /api/vendedor-auth/me ─────────────────────────────────────────────────
@vendedor_auth_bp.route("/me", methods=["GET"])
def me_vendedor():
    try:
        v, err = _require_vendedor(request)
        if err:
            return err

        return success_response("Dados do vendedor.", {
            "id":                   v.id,
            "nome":                 v.nome,
            "email":                v.email,
            "percentual_comissao":  float(v.percentual_comissao or 0),
            "meta_mensal":          float(v.meta_mensal or 0),
        })
    except Exception as e:
        return error_response(str(e), 500)