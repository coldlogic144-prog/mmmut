#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
backend/app.py — MMUT ERO Python backend (Flask) — application factory.

Purpose: serve the admission roster over HTTP so roll-number verification and
signup pre-checks keep working even when Firestore reads fail. Read-only,
stateless, no credentials required.

Run locally :  pip install -r requirements.txt &&  python backend/app.py
Production :  gunicorn backend.app:app   (see Procfile / render.yaml)

Env vars:
    MMMUT_DATA_CSV     path to admission_data.csv (default ../data/admission_data.csv)
    API_ALLOW_ORIGIN   comma-separated CORS origins; "*" by default.
                       LOCK THIS DOWN to your GitHub Pages origin in production.
    PORT               honored automatically by most PaaS hosts.
"""
from __future__ import annotations

import os

from flask import Flask, jsonify
from flask_cors import CORS

from .extensions import limiter


def create_app() -> Flask:
    app = Flask(__name__)

    # Lock down CORS: empty/ "*" is rejected in production. Set API_ALLOW_ORIGIN
    # to the exact GitHub Pages origin (see render.yaml).
    raw_origins = os.environ.get("API_ALLOW_ORIGIN", "").strip()
    if not raw_origins or raw_origins == "*":
        origins = []
    else:
        origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    # supports_credentials stays False: the API uses Bearer tokens, not cookies.
    CORS(app, origins=origins or ["http://127.0.0.1:5000"],
         supports_credentials=False,
         allow_headers=["Content-Type", "Authorization", "X-Telegram-Bot-Api-Secret-Token"])

    limiter.init_app(app)

    @app.after_request
    def _security_headers(resp):
        resp.headers.setdefault("X-Content-Type-Options", "nosniff")
        resp.headers.setdefault("X-Frame-Options", "DENY")
        resp.headers.setdefault("Referrer-Policy", "no-referrer")
        return resp

    from .routes.roster import bp as roster_bp
    app.register_blueprint(roster_bp)

    from .routes.telegram import bp as telegram_bp
    app.register_blueprint(telegram_bp)

    @app.get("/")
    def index():
        return jsonify({
            "ok": True,
            "service": "mmmut-ero-backend",
            "endpoints": ["/api/health", "/api/roster/<roll>",
                          "/api/roster/search?q=", "/api/roster/stats",
                          "/api/telegram/config", "/api/telegram/create-token",
                          "/api/telegram/check-membership", "/api/telegram/channel-invite",
                          "/api/telegram/verify-setup", "/api/telegram/set-webhook"],
        })

    @app.errorhandler(404)
    def not_found(_):
        return jsonify({"ok": False, "error": "not found"}), 404

    @app.errorhandler(500)
    def server_error(_):  # pragma: no cover
        return jsonify({"ok": False, "error": "internal error"}), 500

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    # debug=False in the entrypoint; use `flask --app backend.app run --debug` locally
    app.run(host="127.0.0.1", port=port, debug=False)
