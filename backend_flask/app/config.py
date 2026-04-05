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
    JWT_SECRET = os.getenv("JWT_SECRET", "changeme-set-JWT_SECRET-in-env")
    PORT = int(os.getenv("PORT", "5000"))
    CORS_ORIGIN = os.getenv("CORS_ORIGIN", "")

    @staticmethod
    def allowed_origins() -> list[str]:
        if not Config.CORS_ORIGIN:
            return [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://pedido.uppermu.com.br",
                "https://pedido.uppermu.com.br:5173",
            ]
        return [o.strip() for o in Config.CORS_ORIGIN.split(",") if o.strip()]
