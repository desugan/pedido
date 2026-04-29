from __future__ import annotations

import jwt
from flask import request, jsonify, g

from app.security import decode_token, validate_token_algorithm


def apply_auth_guard(app):
    @app.before_request
    def _guard():
        path = request.path
        method = request.method.upper()

        public = path in ("/health", "/api/health") or (path == "/api/auth/login" and method == "POST")

        if public:
            return None

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token não fornecido"}), 401

        token = auth_header[7:]

        if not validate_token_algorithm(token):
            return jsonify({"error": "Token inválido"}), 401

        try:
            payload = decode_token(token)
            g.user = payload
            return None
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expirado"}), 401
        except jwt.InvalidIssuerError:
            return jsonify({"error": "Token inválido (issuer)"}), 401
        except jwt.InvalidAudienceError:
            return jsonify({"error": "Token inválido (audience)"}), 401
        except jwt.InvalidSignatureError:
            return jsonify({"error": "Token inválido (assinatura)"}), 401
        except jwt.DecodeError:
            return jsonify({"error": "Token mal formatado"}), 401
        except Exception:
            return jsonify({"error": "Token inválido ou expirado"}), 401
