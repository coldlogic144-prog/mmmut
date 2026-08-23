#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""routes/roster.py — HTTP endpoints over the admission roster.

The frontend consumes ONLY these shapes:
    GET /api/roster/<roll> -> {"ok":true,"found":bool,"record":{...}|null}
apiService.js treats any non-200 or network failure as "backend absent".
"""
from __future__ import annotations

from flask import Blueprint, jsonify

from ..services.roster_store import store
from ..utils.responses import fail

bp = Blueprint("roster", __name__, url_prefix="/api")


@bp.get("/health")
def health():
    s = store.stats()
    return jsonify({
        "ok": True,
        "service": "mmmut-ero-backend",
        "rosterCount": s["count"],
        "branches": s["branches"],
    })


@bp.get("/roster/<roll>")
def roster_lookup(roll: str):
    rec = store.get(roll)
    if rec is None:
        # 200 with found:false — a miss is not an error; the frontend falls
        # through to its normal Firestore-only behavior.
        return jsonify({"ok": True, "found": False, "record": None})
    return jsonify({"ok": True, "found": True, "record": rec})


@bp.get("/roster/search")
def roster_search():
    from flask import request
    q = request.args.get("q", "")
    try:
        limit = min(int(request.args.get("limit", 25)), 100)
    except ValueError:
        limit = 25
    results = store.search(q, limit=limit)
    return jsonify({"ok": True, "count": len(results), "results": results})


@bp.get("/roster/stats")
def roster_stats():
    return jsonify({"ok": True, **store.stats()})
