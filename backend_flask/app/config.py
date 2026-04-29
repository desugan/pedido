import os
from dotenv import load_dotenv

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
        if os.path.exists(Config.JWT_PRIVATE_KEY_PATH):
            with open(Config.JWT_PRIVATE_KEY_PATH, "r") as f:
                return f.read()
        return ""

    @staticmethod
    def get_jwt_public_key() -> str:
        if os.path.exists(Config.JWT_PUBLIC_KEY_PATH):
            with open(Config.JWT_PUBLIC_KEY_PATH, "r") as f:
                return f.read()
        return ""

    @staticmethod
    def allowed_origins() -> list[str]:
        cors_origin = os.getenv("CORS_ORIGIN", "")
        if cors_origin:
            return [o.strip() for o in cors_origin.split(",") if o.strip()]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]
