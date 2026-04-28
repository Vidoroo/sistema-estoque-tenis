from flask import Flask
from flask_cors import CORS
from config import Config
from app.extensions import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)

    from app.routes.auth          import auth_bp
    from app.routes.users         import users_bp
    from app.routes.products      import products_bp
    from app.routes.stock         import stock_bp
    from app.routes.clientes      import clientes_bp
    from app.routes.vendas        import vendas_bp
    from app.routes.vendedores    import vendedores_bp
    from app.routes.comissoes     import comissoes_bp
    from app.routes.devolucoes    import devolucoes_bp
    from app.routes.fluxo_caixa  import fluxo_caixa_bp
    from app.routes.barcodes      import barcodes_bp
    from app.routes.pedidos       import pedidos_bp
    from app.routes.vendedor_auth import vendedor_auth_bp

    app.register_blueprint(auth_bp,          url_prefix="/api/auth")
    app.register_blueprint(users_bp,         url_prefix="/api/users")
    app.register_blueprint(products_bp,      url_prefix="/api/products")
    app.register_blueprint(stock_bp,         url_prefix="/api/stock")
    app.register_blueprint(clientes_bp,      url_prefix="/api")
    app.register_blueprint(vendas_bp,        url_prefix="/api/vendas")
    app.register_blueprint(vendedores_bp,    url_prefix="/api/vendedores")
    app.register_blueprint(comissoes_bp,     url_prefix="/api/comissoes")
    app.register_blueprint(devolucoes_bp,    url_prefix="/api/devolucoes")
    app.register_blueprint(fluxo_caixa_bp,  url_prefix="/api/fluxo-caixa")
    app.register_blueprint(barcodes_bp,      url_prefix="/api/barcodes")
    app.register_blueprint(pedidos_bp,       url_prefix="/api/pedidos")
    app.register_blueprint(vendedor_auth_bp, url_prefix="/api/vendedor-auth")

    with app.app_context():
        db.create_all()

    return app