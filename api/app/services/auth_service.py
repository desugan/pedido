import logging
import re
import time
from collections import defaultdict
from threading import Lock

import hashlib

from app.db import get_connection, query_one, execute
from app.security import sign_token, verify_password

logger = logging.getLogger(__name__)

_attempt_lock = Lock()
_login_attempts: dict[str, list[float]] = defaultdict(list)
MAX_ATTEMPTS = 5
BLOCK_DURATION_SECONDS = 300


def _check_rate_limit(username: str) -> tuple[bool, str]:
    """Verifica se o usuário excedeu o limite de tentativas de login.

    Args:
        username: Nome de usuário.

    Returns:
        Tupla (permitido, mensagem_de_erro).
    """
    with _attempt_lock:
        now = time.time()
        attempts = _login_attempts[username]
        attempts[:] = [t for t in attempts if now - t < BLOCK_DURATION_SECONDS]

        if len(attempts) >= MAX_ATTEMPTS:
            return False, "Muitas tentativas. Tente novamente em 5 minutos."

        return True, ""


def _record_failed_attempt(username: str):
    """Registra uma tentativa de login falha.

    Args:
        username: Nome de usuário.
    """
    with _attempt_lock:
        _login_attempts[username].append(time.time())


def _clear_attempts(username: str):
    """Limpa as tentativas de login de um usuário.

    Args:
        username: Nome de usuário.
    """
    with _attempt_lock:
        _login_attempts[username].clear()


def login(usuario: str, senha: str) -> dict:
    """Realiza login do usuário.

    Args:
        usuario: Nome de usuário.
        senha: Senha.

    Returns:
        Dict com token e dados do usuário.

    Raises:
        ValueError: Se credenciais inválidas ou bloqueado.
    """
    try:
        if not usuario or not senha:
            raise ValueError("Usuário e senha são obrigatórios")

        allowed, error_msg = _check_rate_limit(usuario)
        if not allowed:
            raise ValueError(error_msg)

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT id_usuario, usuario, id_perfil, id_cliente, senha
                    FROM usuario
                    WHERE usuario IN (%s, %s, %s)
                    LIMIT 1
                    """,
                    (usuario, usuario.upper(), usuario.lower()),
                )
                user = cur.fetchone()

                if not user:
                    _record_failed_attempt(usuario)
                    raise ValueError("Usuário ou senha inválidos")

                if not verify_password(str(user.get("senha") or ""), senha):
                    _record_failed_attempt(usuario)
                    raise ValueError("Usuário ou senha inválidos")

                _clear_attempts(usuario)

                cur.execute("SELECT perfil FROM perfil WHERE id_perfil = %s LIMIT 1", (user["id_perfil"],))
                perfil = cur.fetchone()

                cur.execute("SELECT nome FROM cliente WHERE id_cliente = %s LIMIT 1", (user["id_cliente"],))
                cliente = cur.fetchone()

        token = sign_token(
            {
                "id_usuario": user["id_usuario"],
                "usuario": user["usuario"],
                "id_perfil": user["id_perfil"],
                "id_cliente": user["id_cliente"],
            }
        )

        return {
            "token": token,
            "user": {
                "id_usuario": user["id_usuario"],
                "usuario": user["usuario"],
                "id_perfil": user["id_perfil"],
                "perfil": perfil["perfil"] if perfil else None,
                "id_cliente": user["id_cliente"],
                "cliente_nome": cliente["nome"] if cliente else None,
            },
        }
    except ValueError:
        raise
    except Exception as ex:
        logger.error("auth_service.py - login: %s", ex)
        raise


def alterar_senha(user: dict, senha_atual: str, nova_senha: str, confirmar_senha: str) -> None:
    """Altera a senha do usuário autenticado.

    Args:
        user: Dados do usuário autenticado.
        senha_atual: Senha atual.
        nova_senha: Nova senha.
        confirmar_senha: Confirmação da nova senha.

    Raises:
        ValueError: Se validações falharem.
    """
    try:
        if not senha_atual or not nova_senha or not confirmar_senha:
            raise ValueError("Todos os campos são obrigatórios")
        if nova_senha != confirmar_senha:
            raise ValueError("A confirmação da senha não confere")
        if len(nova_senha) < 6:
            raise ValueError("A nova senha deve ter ao menos 6 caracteres")
        if len(nova_senha) > 255:
            raise ValueError("A nova senha excede o tamanho máximo permitido")
        if not re.search(r"[A-Z]", nova_senha):
            raise ValueError("A nova senha deve conter ao menos uma letra maiúscula")
        if not re.search(r"[a-z]", nova_senha):
            raise ValueError("A nova senha deve conter ao menos uma letra minúscula")
        if not re.search(r"[^A-Za-z0-9]", nova_senha):
            raise ValueError("A nova senha deve conter ao menos um caractere especial")

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id_usuario, senha FROM usuario WHERE id_usuario = %s LIMIT 1",
                            (user.get("id_usuario"),))
                db_user = cur.fetchone()
                if not db_user:
                    raise ValueError("Usuário não encontrado")

                if not verify_password(str(db_user.get("senha") or ""), senha_atual):
                    raise ValueError("Senha atual inválida")

                nova_hash = hashlib.md5(nova_senha.encode()).hexdigest()
                cur.execute("UPDATE usuario SET senha = %s WHERE id_usuario = %s",
                            (nova_hash, user.get("id_usuario")))
    except ValueError:
        raise
    except Exception as ex:
        logger.error("auth_service.py - alterar_senha: %s", ex)
        raise
