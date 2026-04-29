import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()


def _default_database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return database_url

    database = os.getenv("MYSQL_DATABASE")
    if not database:
        return ""

    user = os.getenv("MYSQL_USER") or "root"
    password = os.getenv("MYSQL_PASSWORD") or os.getenv("MYSQL_ROOT_PASSWORD") or ""
    host = os.getenv("MYSQL_HOST") or "localhost"
    port = os.getenv("MYSQL_PORT") or "3306"

    return f"mysql://{user}:{password}@{host}:{port}/{database}"


class Config:
    DATABASE_URL = _default_database_url()
    JWT_SECRET = os.getenv("JWT_SECRET", "")
    JWT_PRIVATE_KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "jwt_private.pem")
    JWT_PUBLIC_KEY_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "jwt_public.pem")
    JWT_ISSUER = os.getenv("JWT_ISSUER", "pedido-api")
    JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "pedido-frontend")
    JWT_TTL_MINUTES = int(os.getenv("JWT_TTL_MINUTES", "15"))
    PORT = int(os.getenv("PORT", "5000"))

    @staticmethod
    def get_jwt_private_key() -> str:
        import logging
        logger = logging.getLogger(__name__)
        key_path = Config.JWT_PRIVATE_KEY_PATH
        logger.info(f"Looking for private key at: {key_path}, exists: {os.path.exists(key_path)}")
        if os.path.exists(key_path):
            content = open(key_path, "r").read()
            logger.info(f"Private key loaded, length: {len(content)}")
            return content
        logger.error(f"Private key NOT FOUND at: {key_path}")
        return ""

    @staticmethod
    def get_jwt_public_key() -> str:
        import logging
        logger = logging.getLogger(__name__)
        key_path = Config.JWT_PUBLIC_KEY_PATH
        logger.info(f"Looking for public key at: {key_path}, exists: {os.path.exists(key_path)}")
        if os.path.exists(key_path):
            content = open(key_path, "r").read()
            logger.info(f"Public key loaded, length: {len(content)}")
            return content
        logger.error(f"Public key NOT FOUND at: {key_path}")
        return ""

    @staticmethod
    def allowed_origins() -> list[str]:
        cors_origin = os.getenv("CORS_ORIGIN", "")
        if cors_origin:
            return [o.strip() for o in cors_origin.split(",") if o.strip()]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]
