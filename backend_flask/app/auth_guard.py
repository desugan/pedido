from __future__ import annotations

from flask import request, jsonify, g

from app.security import decode_token


def apply_auth_guard(app):
    @app.before_request
    def _guard():
        path = request.path
        method = request.method.upper()

        public = (
            path in ("/health", "/api/health")
            or (path == "/api/auth/login" and method == "POST")
        )

        if public:
            return None

        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Token não fornecido"}), 401

        token = auth_header[7:]
        try:
            g.user = decode_token(token)
            return None
        except Exception:
            return jsonify({"error": "Token inválido ou expirado"}), 401
