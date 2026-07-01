import os
import uuid
from flask import Blueprint, request
from werkzeug.security import generate_password_hash, check_password_hash
from app.extensions import db
from app.models import Vendedor, Product, Cliente, Venda, VendaItem
from app.utils.responses import success_response, error_response

vendedor_auth_bp = Blueprint("vendedor_auth", __name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://sistema-estoque-tenis-frontend.onrender.com")


def _get_vendedor_by_token(token: str):
    return Vendedor.query.filter_by(token=token, login_ativo=True).first()


def _require_vendedor(request) -> tuple:
    token = request.headers.get("X-Vendedor-Token", "").strip()
    if not token:
        return None, error_response("Token do vendedor nao fornecido.", 401)
    v = _get_vendedor_by_token(token)
    if not v:
        return None, error_response("Token invalido ou vendedor inativo.", 401)
    return v, None


# -- POST /api/vendedor-auth/login
@vendedor_auth_bp.route("/login", methods=["POST"])
def login_vendedor():
    try:
        data  = request.get_json()
        token = data.get("token", "").strip()
        senha = data.get("senha", "")

        if not token or not senha:
            return error_response("Token e senha sao obrigatorios.", 400)

        vendedor = _get_vendedor_by_token(token)
        if not vendedor:
            return error_response("Link invalido ou vendedor inativo.", 401)

        if not vendedor.senha_hash:
            return error_response("Senha nao configurada. Solicite ao administrador.", 403)

        if not check_password_hash(vendedor.senha_hash, senha):
            return error_response("Senha incorreta.", 401)

        return success_response("Login realizado com sucesso.", {
            "vendedor_id":   vendedor.id,
            "vendedor_nome": vendedor.nome,
            "token":         vendedor.token,
        })
    except Exception as e:
        return error_response(str(e), 500)


# -- GET /api/vendedor-auth/produtos
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
                "id":                 p.id,
                "name":               p.name,
                "category":           p.category,
                "preco_varejo":       float(p.preco_varejo or 0),
                "preco_atacado":      float(p.preco_atacado or 0),
                "preco_dropshipping": float(p.preco_dropshipping or 0),
                "tamanhos":           p.tamanhos,
                "quantity":           p.quantity,
                "image":              p.image,
            }
            for p in produtos
            if p.quantity and p.quantity > 0
        ]

        return success_response("Produtos listados.", data)
    except Exception as e:
        return error_response(str(e), 500)


# -- GET /api/vendedor-auth/clientes
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


# -- POST /api/vendedor-auth/clientes
@vendedor_auth_bp.route("/clientes", methods=["POST"])
def criar_cliente_vendedor():
    try:
        v, err = _require_vendedor(request)
        if err:
            return err

        data = request.get_json()
        if not data or not data.get("nome"):
            return error_response("Nome e obrigatorio.", 400)

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


# -- GET /api/vendedor-auth/vendas
@vendedor_auth_bp.route("/vendas", methods=["GET"])
def listar_vendas_vendedor():
    try:
        v, err = _require_vendedor(request)
        if err:
            return err

        vendas = Venda.query.filter_by(vendedor_id=v.id).order_by(Venda.created_at.desc()).all()
        data = [
            {
                "id":                  venda.id,
                "cliente_nome":        venda.cliente.nome if venda.cliente else "-",
                "valor_total":         float(venda.valor_total or 0),
                "percentual_comissao": float(venda.percentual_comissao or 0),
                "valor_comissao":      float(venda.valor_comissao or 0),
                "observacoes":         venda.observacoes,
                "created_at":          venda.created_at.isoformat() if venda.created_at else None,
            }
            for venda in vendas
        ]
        return success_response("Vendas listadas.", data)
    except Exception as e:
        return error_response(str(e), 500)


# -- POST /api/vendedor-auth/vendas
@vendedor_auth_bp.route("/vendas", methods=["POST"])
def criar_venda_vendedor():
    try:
        v, err = _require_vendedor(request)
        if err:
            return err

        data       = request.get_json()
        cliente_id = data.get("cliente_id")
        itens      = data.get("itens", [])
        observacoes = data.get("observacoes", "")

        if not cliente_id:
            return error_response("Cliente e obrigatorio.", 400)
        if not itens:
            return error_response("Adicione pelo menos um item.", 400)

        # Valida que o cliente pertence a este vendedor
        cliente = Cliente.query.filter_by(id=cliente_id, vendedor_criador_id=v.id).first()
        if not cliente:
            return error_response("Cliente nao encontrado.", 404)

        # Valida produtos e calcula total
        valor_total = 0.0
        itens_processados = []

        for item in itens:
            produto = Product.query.get(item.get("product_id"))
            if not produto:
                return error_response(f"Produto {item.get('product_id')} nao encontrado.", 404)

            size     = item.get("size", "")
            qty      = int(item.get("quantity", 0))
            tamanhos = produto.tamanhos or {}

            estoque_size = int(tamanhos.get(size, 0))
            if qty <= 0 or qty > estoque_size:
                return error_response(
                    f"Estoque insuficiente para {produto.name} nr {size}. Disponivel: {estoque_size}.", 400
                )

            unit_price = float(produto.preco_varejo or 0)
            subtotal   = unit_price * qty
            valor_total += subtotal

            itens_processados.append({
                "produto":    produto,
                "size":       size,
                "quantity":   qty,
                "unit_price": unit_price,
                "subtotal":   subtotal,
            })

        # Cria a venda
        comissao_pct  = float(v.percentual_comissao or 0)
        valor_comissao = valor_total * (comissao_pct / 100)

        venda = Venda(
            cliente_id=cliente_id,
            vendedor_id=v.id,
            valor_total=valor_total,
            percentual_comissao=comissao_pct,
            valor_comissao=valor_comissao,
            observacoes=observacoes or None,
        )
        db.session.add(venda)
        db.session.flush()

        # Cria itens e desconta estoque
        for item in itens_processados:
            vi = VendaItem(
                venda_id=venda.id,
                product_id=item["produto"].id,
                size=item["size"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                subtotal=item["subtotal"],
            )
            db.session.add(vi)

            # Desconta estoque
            produto  = item["produto"]
            tamanhos = dict(produto.tamanhos or {})
            tamanhos[item["size"]] = str(max(0, int(tamanhos.get(item["size"], 0)) - item["quantity"]))
            produto.tamanhos  = tamanhos
            produto.quantity  = max(0, (produto.quantity or 0) - item["quantity"])

        db.session.commit()
        return success_response("Venda registrada com sucesso.", {"id": venda.id}, 201)

    except Exception as e:
        db.session.rollback()
        return error_response(str(e), 500)


# -- GET /api/vendedor-auth/me
@vendedor_auth_bp.route("/me", methods=["GET"])
def me_vendedor():
    try:
        v, err = _require_vendedor(request)
        if err:
            return err

        return success_response("Dados do vendedor.", {
            "id":                  v.id,
            "nome":                v.nome,
            "email":               v.email,
            "percentual_comissao": float(v.percentual_comissao or 0),
            "meta_mensal":         float(v.meta_mensal or 0),
        })
    except Exception as e:
        return error_response(str(e), 500)