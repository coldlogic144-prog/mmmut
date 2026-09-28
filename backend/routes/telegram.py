#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""routes/telegram.py — Private Telegram Access System endpoints.

Features:
- Token generation for official Telegram deep-link (/start <token>)
- Cryptographic Firebase Auth ID Token verification for protected endpoints
- Webhook handler for Telegram updates (/start linking, join requests) with secret validation
- Diagnostic verification for bot connectivity, webhook registration, and channel admin rights
- Reliable channel membership checking via getChatMember
- Private channel invite link provider (requiring admin approval)

Security Constraints:
- Telegram Bot Token is kept strictly server-side in environment variables.
- NEVER automatically approves Telegram channel join requests (approveChatJoinRequest is never called).
- When getChatMember is queried:
  - If member/admin/creator -> CHANNEL_APPROVED
  - Otherwise -> REMAINS JOIN_REQUEST_PENDING (never falsely marked CHANNEL_REJECTED).
  - Only marked CHANNEL_REJECTED if affirmative evidence of explicit rejection/ban exists.
- Never stores passwords, OTPs, or session tokens.
"""
from __future__ import annotations

import json
import logging
import os
import re
import secrets
import time
from typing import Any, Dict, Tuple

from flask import Blueprint, jsonify, request

from ..extensions import limiter
from ..utils.responses import fail, ok

logger = logging.getLogger(__name__)

bp = Blueprint("telegram", __name__, url_prefix="/api/telegram")

# Server-side environment configuration (never sent to client)
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_BOT_USERNAME = os.environ.get("TELEGRAM_BOT_USERNAME", "mmmut_erp_bot").strip().lstrip("@")
TELEGRAM_CHANNEL_ID = os.environ.get("TELEGRAM_CHANNEL_ID", "").strip()
TELEGRAM_WEBHOOK_SECRET = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "").strip()
# No hardcoded invite fallback: must come from env or generated via Bot API.
TELEGRAM_CHANNEL_INVITE_LINK = os.environ.get(
    "TELEGRAM_CHANNEL_INVITE_LINK",
    ""
).strip()

UID_RE = re.compile(r"^[A-Za-z0-9_-]{1,128}$")
MAX_PENDING_TOKENS = 10000
SIMULATE_ENABLED = os.environ.get("ENABLE_TELEGRAM_SIMULATE", "").lower() in ("1", "true", "yes")

FIREBASE_API_KEY = os.environ.get("FIREBASE_API_KEY", "AIzaSyDMLvLIZkPFO5nsVQBr2IA-8BRB5Hzb3Xo").strip()
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "student-erp-77605").strip()

# In-memory stores for temporary linking tokens and state cache
# token -> { "uid": str, "created_at": float, "status": str, "telegramUserId": str|None, "telegramUsername": str|None }
PENDING_TOKENS: Dict[str, Dict[str, Any]] = {}

# uid -> { "telegramUserId": str, "telegramUsername": str, "status": str, "linkedAt": float, "isMember": bool }
USER_TELEGRAM_CACHE: Dict[str, Dict[str, Any]] = {}

TOKEN_EXPIRY_SECONDS = 900  # 15 minutes


def _clean_expired_tokens() -> None:
    now = time.time()
    expired = [t for t, data in PENDING_TOKENS.items() if now - data["created_at"] > TOKEN_EXPIRY_SECONDS]
    for t in expired:
        PENDING_TOKENS.pop(t, None)
    # Bound memory: evict oldest first.
    if len(PENDING_TOKENS) > MAX_PENDING_TOKENS:
        oldest = sorted(PENDING_TOKENS.items(), key=lambda kv: kv[1].get("created_at", 0))
        for t, _ in oldest[: len(PENDING_TOKENS) - MAX_PENDING_TOKENS]:
            PENDING_TOKENS.pop(t, None)


def _valid_uid(uid: str) -> bool:
    return bool(uid and UID_RE.match(uid))


def _post_json(url: str, payload: Dict[str, Any], headers: Dict[str, str] | None = None, timeout: int = 10) -> Dict[str, Any]:
    """HTTP POST helper supporting both requests and urllib.request."""
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    try:
        import requests
        res = requests.post(url, json=payload, headers=hdrs, timeout=timeout)
        try:
            return res.json()
        except Exception:
            return {"ok": False, "status_code": res.status_code, "text": res.text}
    except ImportError:
        import urllib.request
        import urllib.error
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=hdrs,
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                return json.loads(e.read().decode("utf-8"))
            except Exception:
                return {"ok": False, "status_code": e.code, "error": str(e)}
        except Exception as e:
            return {"ok": False, "error": str(e)}


def call_telegram_api(method: str, payload: Dict[str, Any] | None = None) -> Dict[str, Any]:
    """Call Telegram Bot API securely using the server-side bot token."""
    if not TELEGRAM_BOT_TOKEN:
        logger.warning("Telegram Bot Token is not configured.")
        return {"ok": False, "error": "bot_token_not_configured"}

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/{method}"
    return _post_json(url, payload or {}, timeout=10)


def verify_firebase_id_token(expected_uid: str | None = None) -> Tuple[bool, str | None, str | None]:
    """Verify Firebase Auth ID token passed in the Authorization header.

    Returns:
        (is_valid: bool, authenticated_uid: str | None, error_message: str | None)
    """
    # Test harness bypass only: explicit FLASK_ENV=testing. No production bypass,
    # no local-dev auto-auth, no FIREBASE_AUTH_DISABLED backdoor.
    if os.environ.get("FLASK_ENV") == "testing":
        return True, expected_uid or "test_uid", None

    auth_header = request.headers.get("Authorization", "").strip()
    if not auth_header:
        return False, None, "Missing Authorization header with Firebase Auth ID token"

    parts = auth_header.split(maxsplit=1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return False, None, "Invalid Authorization header format. Expected 'Bearer <token>'"

    id_token = parts[1].strip()
    if not id_token:
        return False, None, "Empty Firebase Auth ID token"

    url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={FIREBASE_API_KEY}"
    try:
        res = _post_json(url, {"idToken": id_token}, timeout=10)
        if not res or "users" not in res:
            err_msg = res.get("error", {}).get("message", "Invalid or expired Firebase Auth ID token") if isinstance(res, dict) else "Token verification failed"
            return False, None, f"Firebase Auth verification failed: {err_msg}"

        user_record = res["users"][0]
        token_uid = user_record.get("localId")
        if not token_uid:
            return False, None, "Firebase user profile missing localId"

        if expected_uid and token_uid != expected_uid:
            logger.warning("UID mismatch: token UID '%s' does not match claimed UID '%s'", token_uid, expected_uid)
            return False, token_uid, f"Token UID '{token_uid}' does not match requested UID '{expected_uid}'"

        return True, token_uid, None
    except Exception as e:
        logger.error("Error verifying Firebase ID token: %s", e)
        return False, None, f"Token verification error: {str(e)}"


@bp.get("/config")
def telegram_config():
    """Return public configuration details (NO secrets)."""
    return ok({
        "botUsername": TELEGRAM_BOT_USERNAME,
        "botConfigured": bool(TELEGRAM_BOT_TOKEN),
        "channelConfigured": bool(TELEGRAM_CHANNEL_ID),
        "webhookSecretConfigured": bool(TELEGRAM_WEBHOOK_SECRET),
    })


@bp.get("/channel-invite")
@limiter.limit("30 per minute")
def channel_invite():
    """Return the private channel invite link. Requires Firebase Auth."""
    valid, auth_uid, err = verify_firebase_id_token()
    if not valid:
        return fail(err or "Unauthorized", 401)
    invite_link = TELEGRAM_CHANNEL_INVITE_LINK

    # If no static link is defined, attempt to generate one with creates_join_request=True
    if not invite_link and TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID:
        res = call_telegram_api("createChatInviteLink", {
            "chat_id": TELEGRAM_CHANNEL_ID,
            "name": "MMMUT ERP Roomhub Access Link",
            "creates_join_request": True
        })
        if res.get("ok"):
            invite_link = res.get("result", {}).get("invite_link", "")

    # Security: MUST NOT fall back to bot username or non-existent username
    if not invite_link:
        return fail(
            "Private channel invite link is not configured on the server. "
            "Please ensure TELEGRAM_CHANNEL_INVITE_LINK is set in environment "
            "or the bot has 'can_invite_users' admin rights in the channel.",
            404
        )

    # Disallow bot username as channel invite link
    if f"/{TELEGRAM_BOT_USERNAME}" in invite_link or invite_link.rstrip("/").endswith(f"@{TELEGRAM_BOT_USERNAME}"):
        return fail("Configured channel invite link cannot be the bot username.", 500)

    return ok({
        "inviteLink": invite_link,
        "channelName": "Roomhub",
    })


@bp.post("/create-token")
@limiter.limit("10 per minute")
def create_linking_token():
    """Generate a single-use deep-link token to link ERP user to Telegram.
    
    Protected by Firebase Auth ID Token verification.
    """
    _clean_expired_tokens()
    data = request.get_json(silent=True) or {}
    uid = str(data.get("uid", "")).strip()
    if not uid or not _valid_uid(uid):
        return fail("Missing or invalid field: uid", 400)

    # Verify caller's Firebase Auth ID token
    valid, auth_uid, err = verify_firebase_id_token(expected_uid=uid)
    if not valid:
        return fail(err or "Unauthorized: Invalid Firebase ID token", 401)

    token = secrets.token_urlsafe(16)
    PENDING_TOKENS[token] = {
        "uid": uid,
        "created_at": time.time(),
        "status": "PENDING",
        "telegramUserId": None,
        "telegramUsername": None,
    }

    deep_link = f"https://t.me/{TELEGRAM_BOT_USERNAME}?start={token}"
    return ok({
        "token": token,
        "botUsername": TELEGRAM_BOT_USERNAME,
        "deepLink": deep_link,
        "expiresIn": TOKEN_EXPIRY_SECONDS,
    })


@bp.get("/token-status/<token>")
@limiter.limit("60 per minute")
def check_token_status(token: str):
    """Check if the student has started the bot with this token.

    Requires Firebase Auth; only the token owner may poll it. Minimal fields
    returned to avoid UID/telegram-ID enumeration.
    """
    _clean_expired_tokens()
    token = (token or "")[:128]
    entry = PENDING_TOKENS.get(token)
    if not entry:
        return fail("Token expired or not found", 404)

    valid, auth_uid, err = verify_firebase_id_token(expected_uid=entry.get("uid"))
    if not valid:
        return fail(err or "Unauthorized", 401)

    is_linked = entry["status"] == "LINKED"
    resp = {"token": token, "linked": is_linked}
    if is_linked:
        # Single-use: consume shortly after first successful poll.
        PENDING_TOKENS.pop(token, None)
    return ok(resp)


@bp.post("/webhook")
def telegram_webhook():
    """Handle incoming Telegram webhook updates.

    SECURITY:
    - Verifies secret token header X-Telegram-Bot-Api-Secret-Token if configured.

    HANDLED EVENTS:
    - /start <token> : Links Telegram identity to student ERP UID.
    - chat_join_request : Marks JOIN_REQUEST_PENDING (NEVER auto-approves).
    - chat_member : Updates membership status if active member.
    """
    # 1. Validate Webhook Secret Header (mandatory in production).
    if not TELEGRAM_WEBHOOK_SECRET:
        logger.error("Webhook called but TELEGRAM_WEBHOOK_SECRET is not configured.")
        return fail("Webhook secret not configured", 503)
    header_secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "").strip()
    if not header_secret or not secrets.compare_digest(header_secret, TELEGRAM_WEBHOOK_SECRET):
        logger.warning("Unauthorized webhook request: secret token mismatch.")
        return fail("Unauthorized: invalid secret token", 401)

    update = request.get_json(silent=True) or {}
    logger.info("Received Telegram webhook update ID: %s", update.get("update_id"))

    # 2. Message Update (Command: /start <token>)
    message = update.get("message")
    if message:
        text = str(message.get("text", "")).strip()
        from_user = message.get("from", {})
        chat_id = message.get("chat", {}).get("id")

        if text.startswith("/start"):
            parts = text.split(maxsplit=1)
            token = parts[1].strip()[:128] if len(parts) > 1 else ""

            if token and token in PENDING_TOKENS:
                entry = PENDING_TOKENS[token]
                if entry.get("status") == "LINKED":
                    return ok({"status": "already_linked"})
                uid = entry["uid"]
                telegram_user_id = str(from_user.get("id", ""))
                telegram_username = from_user.get("username", "")

                entry["status"] = "LINKED"
                entry["telegramUserId"] = telegram_user_id
                entry["telegramUsername"] = telegram_username

                USER_TELEGRAM_CACHE[uid] = {
                    "telegramUserId": telegram_user_id,
                    "telegramUsername": telegram_username,
                    "status": "JOIN_REQUEST_NOT_SENT",
                    "linkedAt": time.time(),
                    "isMember": False,
                }

                logger.info("Linked UID %s to Telegram ID %s (@%s)", uid, telegram_user_id, telegram_username)

                # Send confirmation message to user on Telegram
                if TELEGRAM_BOT_TOKEN and chat_id:
                    welcome_text = (
                        "✅ *MMMUT ERP — Account Connected*\n\n"
                        "Your Telegram account has been successfully linked to your student ERP profile.\n\n"
                        "Please return to the ERP portal to request access to the official private channel."
                    )
                    call_telegram_api("sendMessage", {
                        "chat_id": chat_id,
                        "text": welcome_text,
                        "parse_mode": "Markdown",
                    })

                return ok({"status": "linked", "uid": uid})

    # 3. Chat Join Request Update
    # CRITICAL: Do NOT automatically approve! Telegram channel admin reviews manually.
    join_req = update.get("chat_join_request")
    if join_req:
        telegram_user_id = str(join_req.get("from", {}).get("id", ""))
        logger.info("Received chat_join_request from Telegram User ID: %s", telegram_user_id)

        for uid, user_data in USER_TELEGRAM_CACHE.items():
            if user_data.get("telegramUserId") == telegram_user_id:
                user_data["status"] = "JOIN_REQUEST_PENDING"
                logger.info("Updated UID %s status to JOIN_REQUEST_PENDING (awaiting channel admin)", uid)
                break

        return ok({"status": "join_request_recorded"})

    # 4. Chat Member Update
    member_update = update.get("chat_member")
    if member_update:
        new_status = member_update.get("new_chat_member", {}).get("status", "")
        telegram_user_id = str(member_update.get("new_chat_member", {}).get("user", {}).get("id", ""))

        for uid, user_data in USER_TELEGRAM_CACHE.items():
            if user_data.get("telegramUserId") == telegram_user_id:
                if new_status in ["creator", "administrator", "member"]:
                    user_data["status"] = "CHANNEL_APPROVED"
                    user_data["isMember"] = True
                    logger.info("Membership confirmed for UID %s (status: %s)", uid, new_status)
                # Note: We deliberately do NOT mark CHANNEL_REJECTED here unless explicit rejection is certified.
                break

        return ok({"status": "member_update_recorded"})

    return ok({"status": "ignored"})


@bp.post("/check-membership")
@limiter.limit("30 per minute")
def check_membership():
    """Verify if the student is currently an active member of the private channel.

    Always requires Firebase Auth for the claimed uid. telegramUserId-only
    lookups are rejected to prevent enumeration.
    """
    data = request.get_json(silent=True) or {}
    uid = str(data.get("uid", "")).strip()
    telegram_user_id = str(data.get("telegramUserId", "")).strip()[:64]

    if not uid or not _valid_uid(uid):
        return fail("Missing or invalid field: uid", 400)

    valid, auth_uid, err = verify_firebase_id_token(expected_uid=uid)
    if not valid:
        return fail(err or "Unauthorized: Invalid Firebase ID token", 401)

    # Locate user in cache if telegram_user_id not provided
    if not telegram_user_id and uid in USER_TELEGRAM_CACHE:
        telegram_user_id = USER_TELEGRAM_CACHE[uid].get("telegramUserId", "")

    if not telegram_user_id:
        return ok({
            "status": "TELEGRAM_NOT_CONNECTED",
            "isMember": False,
            "message": "Telegram account is not yet connected.",
        })

    is_member = False
    status_state = "JOIN_REQUEST_PENDING"
    rejection_evidence = False

    # If Bot Token and Channel ID are configured, query Telegram Bot API
    if TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID:
        tg_res = call_telegram_api("getChatMember", {
            "chat_id": TELEGRAM_CHANNEL_ID,
            "user_id": int(telegram_user_id) if telegram_user_id.isdigit() else telegram_user_id,
        })

        if tg_res.get("ok"):
            member_obj = tg_res.get("result", {})
            member_status = member_obj.get("status", "")

            if member_status in ["creator", "administrator", "member"]:
                is_member = True
                status_state = "CHANNEL_APPROVED"
            elif member_status == "kicked":
                # Kicked / banned is reliable evidence of rejection/banishment
                rejection_evidence = True
                status_state = "CHANNEL_REJECTED"
            else:
                # "left", "restricted", or other statuses while join request is pending
                # DO NOT mark CHANNEL_REJECTED! Remain JOIN_REQUEST_PENDING.
                is_member = False
                status_state = "JOIN_REQUEST_PENDING"
        else:
            # If API returned an error (e.g. user not found), remain JOIN_REQUEST_PENDING
            error_desc = tg_res.get("description", "")
            logger.info("getChatMember returned not-ok for user %s: %s", telegram_user_id, error_desc)
            status_state = "JOIN_REQUEST_PENDING"
            is_member = False
    else:
        # Fallback when running in local development without live bot credentials
        cached = USER_TELEGRAM_CACHE.get(uid)
        if cached:
            is_member = cached.get("isMember", False)
            status_state = "CHANNEL_APPROVED" if is_member else cached.get("status", "JOIN_REQUEST_PENDING")

    # Update cache if UID exists
    if uid in USER_TELEGRAM_CACHE:
        USER_TELEGRAM_CACHE[uid]["status"] = status_state
        USER_TELEGRAM_CACHE[uid]["isMember"] = is_member

    return ok({
        "status": status_state,
        "isMember": is_member,
        "telegramUserId": telegram_user_id,
        "rejectionEvidence": rejection_evidence,
    })


@bp.get("/verify-setup")
@limiter.limit("10 per minute")
def verify_setup():
    """Verify live Telegram Bot configuration. Requires Firebase Auth.

    Returns only boolean readiness flags, never raw channel/bot IDs.
    """
    valid, auth_uid, err = verify_firebase_id_token()
    if not valid:
        return fail(err or "Unauthorized", 401)
    report: Dict[str, Any] = {
        "timestamp": time.time(),
        "environment": {
            "botConfigured": bool(TELEGRAM_BOT_TOKEN),
            "channelConfigured": bool(TELEGRAM_CHANNEL_ID),
            "webhookSecretConfigured": bool(TELEGRAM_WEBHOOK_SECRET),
            "inviteLinkConfigured": bool(TELEGRAM_CHANNEL_INVITE_LINK),
        },
        "bot": {"status": "unverified"},
        "webhook": {"status": "unverified"},
        "channel": {"status": "unverified"},
        "overall_ready": False,
        "action_items": []
    }

    action_items = report["action_items"]

    # 1. Bot check
    bot_id = None
    if not TELEGRAM_BOT_TOKEN:
        action_items.append("Set TELEGRAM_BOT_TOKEN in Render environment variables.")
        report["bot"]["error"] = "TELEGRAM_BOT_TOKEN is not configured."
    else:
        me_res = call_telegram_api("getMe")
        if me_res.get("ok"):
            bot_info = me_res.get("result", {})
            bot_id = bot_info.get("id")
            report["bot"] = {
                "status": "connected",
                "id": bot_id,
                "username": bot_info.get("username"),
                "first_name": bot_info.get("first_name"),
                "can_join_groups": bot_info.get("can_join_groups"),
                "can_read_all_group_messages": bot_info.get("can_read_all_group_messages"),
            }
        else:
            err = me_res.get("description", "Unknown Telegram API error")
            report["bot"] = {"status": "failed", "error": err}
            action_items.append(f"Verify TELEGRAM_BOT_TOKEN validity with @BotFather: {err}")

    # 2. Webhook check (URL redacted to avoid leaking infra details)
    if TELEGRAM_BOT_TOKEN:
        wh_res = call_telegram_api("getWebhookInfo")
        if wh_res.get("ok"):
            wh_info = wh_res.get("result", {})
            wh_url = wh_info.get("url", "")
            report["webhook"] = {
                "status": "configured" if wh_url else "not_set",
                "configured": bool(wh_url),
                "pointsToBackend": bool(wh_url.endswith("/api/telegram/webhook")),
                "pending_update_count": wh_info.get("pending_update_count", 0),
            }
            if not wh_url:
                action_items.append("Set Telegram Bot Webhook to the backend /api/telegram/webhook URL.")
            elif not wh_url.endswith("/api/telegram/webhook"):
                action_items.append("Webhook URL does not point to /api/telegram/webhook.")
        else:
            report["webhook"] = {"status": "failed"}

    # 3. Channel check (no raw IDs/titles leaked)
    if not TELEGRAM_CHANNEL_ID:
        action_items.append("Set TELEGRAM_CHANNEL_ID in environment variables.")
        report["channel"]["error"] = "Channel is not configured."
    elif TELEGRAM_BOT_TOKEN:
        # Check chat info
        chat_res = call_telegram_api("getChat", {"chat_id": TELEGRAM_CHANNEL_ID})
        if chat_res.get("ok"):
            report["channel"]["reachable"] = True
        else:
            report["channel"]["error"] = "Failed to access channel"
            action_items.append("Telegram channel check failed. Ensure bot has been added to the channel.")

        # Check administrators and permissions
        admin_res = call_telegram_api("getChatAdministrators", {"chat_id": TELEGRAM_CHANNEL_ID})
        if admin_res.get("ok"):
            admins = admin_res.get("result", [])
            bot_admin = None
            if bot_id:
                for a in admins:
                    if a.get("user", {}).get("id") == bot_id:
                        bot_admin = a
                        break

            if bot_admin:
                can_invite = bot_admin.get("can_invite_users", False)
                can_manage = bot_admin.get("can_manage_chat", False)
                report["channel"]["bot_is_admin"] = True
                report["channel"]["can_invite_users"] = can_invite
                report["channel"]["can_manage_chat"] = can_manage
                report["channel"]["status"] = "verified"

                if not can_invite:
                    action_items.append("Telegram Bot is an admin, but missing permission 'Invite Users via Links' (can_invite_users=True).")
            else:
                report["channel"]["bot_is_admin"] = False
                report["channel"]["status"] = "bot_not_admin"
                action_items.append("Bot is not an administrator of the channel. Add the bot as Channel Administrator.")
        else:
            report["channel"]["status"] = "error"
            action_items.append("Could not retrieve channel administrators.")

    # 4. Webhook secret check
    if not TELEGRAM_WEBHOOK_SECRET:
        action_items.append("Recommended: Set TELEGRAM_WEBHOOK_SECRET to protect webhook endpoint from spoofing.")

    report["overall_ready"] = (
        len(action_items) == 0 or
        (len(action_items) == 1 and "TELEGRAM_WEBHOOK_SECRET" in action_items[0])
    )

    return ok(report)


@bp.post("/set-webhook")
@limiter.limit("5 per minute")
def set_webhook():
    """Register the backend webhook URL with Telegram Bot API.

    Requires Firebase Auth and a server-configured allowlist. Arbitrary
    webhookUrl values from clients are rejected.
    """
    valid, auth_uid, err = verify_firebase_id_token()
    if not valid:
        return fail(err or "Unauthorized", 401)
    if not TELEGRAM_BOT_TOKEN:
        return fail("TELEGRAM_BOT_TOKEN is not configured on the server", 400)
    if not TELEGRAM_WEBHOOK_SECRET:
        return fail("TELEGRAM_WEBHOOK_SECRET is not configured on the server", 400)

    data = request.get_json(silent=True) or {}
    allowed = [u.strip() for u in os.environ.get("TELEGRAM_WEBHOOK_ALLOWLIST", "").split(",") if u.strip()]
    default_url = (allowed[0] if allowed else "").rstrip("/") + "/api/telegram/webhook" if allowed else ""
    webhook_url = str(data.get("webhookUrl") or default_url).strip()
    if not webhook_url or not webhook_url.startswith("https://") or not webhook_url.endswith("/api/telegram/webhook"):
        return fail("Invalid webhookUrl: must be https and end with /api/telegram/webhook", 400)
    if allowed and webhook_url not in [a.rstrip("/") + "/api/telegram/webhook" if not a.endswith("/api/telegram/webhook") else a for a in allowed]:
        # Also accept exact allowlist entries.
        if webhook_url not in allowed:
            return fail("webhookUrl is not in the server allowlist", 403)

    payload: Dict[str, Any] = {
        "url": webhook_url,
        "allowed_updates": ["message", "chat_join_request", "chat_member"],
        "drop_pending_updates": False,
        "secret_token": TELEGRAM_WEBHOOK_SECRET,
    }

    res = call_telegram_api("setWebhook", payload)
    if res.get("ok"):
        return ok({
            "message": "Webhook successfully registered with Telegram Bot API",
            "configured": True,
            "allowed_updates": payload["allowed_updates"],
        })
    else:
        return fail("Telegram setWebhook failed", 400)


@bp.post("/simulate-link")
def simulate_link():
    """Development-only endpoint. Disabled unless ENABLE_TELEGRAM_SIMULATE=true."""
    if not SIMULATE_ENABLED or os.environ.get("FLASK_ENV") == "production":
        return fail("Not found", 404)
    valid, auth_uid, err = verify_firebase_id_token()
    if not valid:
        return fail(err or "Unauthorized", 401)
    data = request.get_json(silent=True) or {}
    token = str(data.get("token", ""))[:128]
    entry = PENDING_TOKENS.get(token)
    if not entry:
        return fail("Token not found or expired", 404)
    if entry.get("uid") != auth_uid:
        return fail("Token does not belong to this user", 403)

    uid = entry["uid"]
    fake_tg_id = str(data.get("telegramUserId") or "123456789")
    fake_tg_user = str(data.get("telegramUsername") or "test_student")

    entry["status"] = "LINKED"
    entry["telegramUserId"] = fake_tg_id
    entry["telegramUsername"] = fake_tg_user

    USER_TELEGRAM_CACHE[uid] = {
        "telegramUserId": fake_tg_id,
        "telegramUsername": fake_tg_user,
        "status": "JOIN_REQUEST_NOT_SENT",
        "linkedAt": time.time(),
        "isMember": False,
    }

    return ok({
        "status": "simulated_linked",
        "uid": uid,
        "telegramUserId": fake_tg_id,
        "telegramUsername": fake_tg_user,
    })


@bp.post("/simulate-channel-action")
def simulate_channel_action():
    """Development-only endpoint. Disabled unless ENABLE_TELEGRAM_SIMULATE=true."""
    if not SIMULATE_ENABLED or os.environ.get("FLASK_ENV") == "production":
        return fail("Not found", 404)
    valid, auth_uid, err = verify_firebase_id_token()
    if not valid:
        return fail(err or "Unauthorized", 401)
    data = request.get_json(silent=True) or {}
    uid = str(data.get("uid", ""))
    if uid != auth_uid:
        return fail("Can only simulate your own uid", 403)
    action = data.get("action", "")  # "approve" or "reject" or "request"

    if uid not in USER_TELEGRAM_CACHE:
        USER_TELEGRAM_CACHE[uid] = {
            "telegramUserId": "123456789",
            "telegramUsername": "test_student",
            "status": "JOIN_REQUEST_NOT_SENT",
            "linkedAt": time.time(),
            "isMember": False,
        }

    user_entry = USER_TELEGRAM_CACHE[uid]

    if action == "request":
        user_entry["status"] = "JOIN_REQUEST_PENDING"
        user_entry["isMember"] = False
    elif action == "approve":
        user_entry["status"] = "CHANNEL_APPROVED"
        user_entry["isMember"] = True
    elif action == "reject":
        user_entry["status"] = "CHANNEL_REJECTED"
        user_entry["isMember"] = False
    else:
        return fail("Invalid action. Must be 'request', 'approve', or 'reject'.", 400)

    return ok({
        "uid": uid,
        "action": action,
        "status": user_entry["status"],
        "isMember": user_entry["isMember"],
    })
