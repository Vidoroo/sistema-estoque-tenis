from datetime import datetime
from app.extensions import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(100))
    quantity = db.Column(db.Integer, default=0, nullable=False)
    price = db.Column(db.Float, default=0.0, nullable=False)
    image = db.Column(db.String(500), nullable=True)

    codigo = db.Column(db.String(4), unique=True, nullable=True)
    preco_atacado = db.Column(db.Numeric(10, 2), nullable=True)
    preco_dropshipping = db.Column(db.Numeric(10, 2), nullable=True)
    preco_varejo = db.Column(db.Numeric(10, 2), nullable=True)

    nota_fiscal = db.Column(db.String(50), nullable=True)
    serie_nf = db.Column(db.String(20), nullable=True)
    data_emissao = db.Column(db.Date, nullable=True)
    fornecedor = db.Column(db.String(150), nullable=True)
    chave_acesso = db.Column(db.String(80), nullable=True)
    observacoes_nf = db.Column(db.Text, nullable=True)
    tamanhos = db.Column(db.JSON, nullable=True)
    

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class StockHistory(db.Model):
    __tablename__ = "stock_history"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    movement_type = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    size = db.Column(db.String(10), nullable=True)
    nota_fiscal = db.Column(db.String(50), nullable=True)
    description = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    product = db.relationship("Product", backref="movements")

class Cliente(db.Model):
    __tablename__ = 'clientes'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    cpf_cnpj = db.Column(db.String(20))
    telefone = db.Column(db.String(20))
    email = db.Column(db.String(150))
    endereco = db.Column(db.String(200))
    cidade = db.Column(db.String(100))
    observacoes = db.Column(db.Text)
    vendedor_criador_id = db.Column(db.Integer, db.ForeignKey("vendedores.id"), nullable=True)

class Vendedor(db.Model):
    __tablename__ = "vendedores"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(150), nullable=False)
    telefone = db.Column(db.String(20))
    email = db.Column(db.String(150))
    percentual_comissao = db.Column(db.Numeric(5, 2), default=0)
    meta_mensal = db.Column(db.Numeric(10, 2), default=0)
    status = db.Column(db.String(30), default="Ativo")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    token       = db.Column(db.String(36),  unique=True, nullable=True)
    senha_hash  = db.Column(db.String(255), nullable=True)
    login_ativo = db.Column(db.Boolean, default=True)


class Venda(db.Model):
    __tablename__ = "vendas"

    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey("clientes.id"), nullable=False)
    vendedor_id = db.Column(db.Integer, db.ForeignKey("vendedores.id"), nullable=False)
    valor_total = db.Column(db.Numeric(10, 2), default=0, nullable=False)
    percentual_comissao = db.Column(db.Numeric(5, 2), default=0)
    valor_comissao = db.Column(db.Numeric(10, 2), default=0)
    observacoes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    comissao_paga = db.Column(db.Boolean, default=False)

    cliente = db.relationship("Cliente", backref="vendas")
    vendedor = db.relationship("Vendedor", backref="vendas")


class VendaItem(db.Model):
    __tablename__ = "venda_itens"

    id = db.Column(db.Integer, primary_key=True)
    venda_id = db.Column(db.Integer, db.ForeignKey("vendas.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    size = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)

    venda = db.relationship("Venda", backref="itens")
    product = db.relationship("Product", backref="venda_itens")

class Devolucao(db.Model):
    __tablename__ = "devolucoes"
 
    id              = db.Column(db.Integer, primary_key=True)
    venda_id        = db.Column(db.Integer, db.ForeignKey("vendas.id"), nullable=False)
    motivo          = db.Column(db.String(255), nullable=False)
    valor_devolvido = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    observacoes     = db.Column(db.Text, nullable=True)
    created_at      = db.Column(db.DateTime, default=datetime.utcnow)
 
    venda = db.relationship("Venda", backref="devolucoes")

class LancamentoCaixa(db.Model):
    __tablename__ = "lancamentos_caixa"
 
    id          = db.Column(db.Integer, primary_key=True)
    tipo        = db.Column(db.String(10), nullable=False)   # "entrada" ou "saida"
    descricao   = db.Column(db.String(255), nullable=False)
    valor       = db.Column(db.Numeric(10, 2), nullable=False)
    categoria   = db.Column(db.String(100), nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

class ProdutoBarcode(db.Model):
    __tablename__ = "produto_barcodes"
    id         = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    size       = db.Column(db.String(10), nullable=False)
    barcode    = db.Column(db.String(13), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    product    = db.relationship("Product", backref="barcodes")
    __table_args__ = (db.UniqueConstraint("product_id", "size", name="uq_product_size"),)


class Pedido(db.Model):
    __tablename__ = "pedidos"
    id          = db.Column(db.Integer, primary_key=True)
    cliente_id  = db.Column(db.Integer, db.ForeignKey("clientes.id"),   nullable=False)
    vendedor_id = db.Column(db.Integer, db.ForeignKey("vendedores.id"), nullable=False)
    status      = db.Column(db.String(30), default="Pendente")
    observacoes = db.Column(db.Text, nullable=True)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)
    cliente     = db.relationship("Cliente",  backref="pedidos_list")
    vendedor    = db.relationship("Vendedor", backref="pedidos_list")


class PedidoItem(db.Model):
    __tablename__ = "pedido_itens"
    id                = db.Column(db.Integer, primary_key=True)
    pedido_id         = db.Column(db.Integer, db.ForeignKey("pedidos.id"),  nullable=False)
    product_id        = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    size              = db.Column(db.String(10), nullable=False)
    quantity          = db.Column(db.Integer, nullable=False)
    quantity_separada = db.Column(db.Integer, default=0)
    pedido            = db.relationship("Pedido",  backref="itens")
    product           = db.relationship("Product", backref="pedido_itens_list")