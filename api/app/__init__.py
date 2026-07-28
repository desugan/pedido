import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

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


def _coluna_existe(tabela: str, coluna: str) -> bool:
    from .db import query_one
    row = query_one(f"SHOW COLUMNS FROM `{tabela}` WHERE Field = %s", (coluna,))
    return row is not None


def _tabela_existe(tabela: str) -> bool:
    from .db import query_one
    row = query_one("SHOW TABLES LIKE %s", (tabela,))
    return row is not None


def migrar_schema():
    """Aplica migracoes de schema automaticamente na inicializacao."""
    from .db import execute
    logger = logging.getLogger(__name__)
    try:
        execute("""
            CREATE TABLE IF NOT EXISTS app_config (
                config_key VARCHAR(100) PRIMARY KEY,
                config_value TEXT
            )
        """)

        if _tabela_existe("lancamento") and not _coluna_existe("lancamento", "status"):
            execute("ALTER TABLE lancamento ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE'")
            logger.info("Migracao: adicionada coluna lancamento.status")

        if _tabela_existe("pagamento"):
            if not _coluna_existe("pagamento", "qrcode"):
                execute("ALTER TABLE pagamento ADD COLUMN qrcode TEXT")
                logger.info("Migracao: adicionada coluna pagamento.qrcode")
            if not _coluna_existe("pagamento", "chavepix"):
                execute("ALTER TABLE pagamento ADD COLUMN chavepix VARCHAR(255) DEFAULT ''")
                logger.info("Migracao: adicionada coluna pagamento.chavepix")
            if not _coluna_existe("pagamento", "data_pagamento"):
                execute("ALTER TABLE pagamento ADD COLUMN data_pagamento DATETIME NULL")
                logger.info("Migracao: adicionada coluna pagamento.data_pagamento")

        if not _tabela_existe("pagamentopedido"):
            execute("""
                CREATE TABLE pagamentopedido (
                    id_pagamento_pedido INT AUTO_INCREMENT PRIMARY KEY,
                    id_pagamento INT NOT NULL,
                    id_pedido INT NOT NULL
                )
            """)
            logger.info("Migracao: criada tabela pagamentopedido")

    except Exception as ex:
        logger.error("__init__.py - migrar_schema: %s", ex)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        resources={r"/*": {"origins": Config.allowed_origins()}},
        supports_credentials=True,
        expose_headers=["Content-Type", "Authorization"],
    )

    migrar_schema()

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
        is_dev = os.getenv("FLASK_ENV") == "development"
        if is_dev:
            return jsonify({"error": str(error)}), 500
        return jsonify({"error": "Internal Server Error"}), 500

    return app
