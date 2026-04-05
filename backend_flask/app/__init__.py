from flask import Flask, jsonify
from flask_cors import CORS

from .auth_guard import apply_auth_guard
from .config import Config
from .routes.auth import auth_bp
from .routes.clientes import clientes_bp
from .routes.config import config_bp
from .routes.fornecedores import fornecedores_bp
from .routes.health import health_bp
from .routes.lancamentos import lancamentos_bp
from .routes.pagamentos import pagamentos_bp
from .routes.pedidos import pedidos_bp
from .routes.produtos import produtos_bp
from .routes.relatorios import relatorios_bp
from .routes.usuarios import usuarios_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        resources={r"/*": {"origins": Config.allowed_origins()}},
        supports_credentials=True,
    )

    apply_auth_guard(app)

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(clientes_bp)
    app.register_blueprint(pedidos_bp)
    app.register_blueprint(pagamentos_bp)
    app.register_blueprint(relatorios_bp)
    app.register_blueprint(produtos_bp)
    app.register_blueprint(usuarios_bp)
    app.register_blueprint(fornecedores_bp)
    app.register_blueprint(lancamentos_bp)
    app.register_blueprint(config_bp)

    @app.errorhandler(Exception)
    def handle_error(error: Exception):
        return jsonify({"error": str(error) or "Internal Server Error"}), 500

    return app
