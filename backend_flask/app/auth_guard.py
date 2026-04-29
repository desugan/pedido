from __future__ import annotations

import jwt
import logging
from flask import request, jsonify, g, make_response

from app.security import decode_token, validate_token_algorithm
from app.config import Config

logger = logging.getLogger(__name__)


def apply_auth_guard(app):
    @app.before_request
    def _guard():
        path = request.path
        method = request.method.upper()

        if method == "OPTIONS":
            response = make_response("", 200)
            response.headers["Access-Control-Allow-Origin"] = request.headers.get("Origin", "*")
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            response.headers["Access-Control-Max-Age"] = "3600"
            return response

        public = path in ("/health", "/api/health") or path.startswith("/api/auth/login")

        if public:
            return None

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            logger.warning(f"401 - Missing token header: {path}")
            return jsonify({"error": "Token não fornecido"}), 401

        token = auth_header[7:]

        if not validate_token_algorithm(token):
            logger.warning(f"401 - Invalid token algorithm: {path}")
            return jsonify({"error": "Token inválido"}), 401

        try:
            payload = decode_token(token)
            g.user = payload
            return None
        except jwt.ExpiredSignatureError:
            logger.warning(f"401 - Expired token: {path}")
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidIssuerError as e:
            logger.warning(f"401 - Invalid issuer: {path}, error: {e}")
            return jsonify({"error": "Token inválido (issuer)"}), 401
        except jwt.InvalidAudienceError as e:
            logger.warning(f"401 - Invalid audience: {path}, error: {e}")
            return jsonify({"error": "Token inválido (audience)"}), 401
        except jwt.InvalidSignatureError as e:
            logger.warning(f"401 - Invalid signature: {path}, error: {e}")
            return jsonify({"error": "Token inválido (assinatura)"}), 401
        except jwt.DecodeError as e:
            logger.warning(f"401 - Decode error: {path}, error: {e}")
            return jsonify({"error": "Token mal formatado"}), 401
        except Exception as e:
            logger.error(f"401 - Token error: {path}, error: {type(e).__name__}: {e}")
            return jsonify({"error": "Token inválido ou expirado"}), 401
