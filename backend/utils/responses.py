#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""utils/responses.py — tiny JSON envelope helpers (kept for future routes)."""
from __future__ import annotations

from flask import jsonify


def ok(payload: dict | None = None, status: int = 200):
    body = {"ok": True}
    if payload:
        body.update(payload)
    return jsonify(body), status


def fail(message: str, status: int = 400, **extra):
    body = {"ok": False, "error": message}
    body.update(extra)
    return jsonify(body), status
