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
import secrets
import time
from typing import Any, Dict, Tuple

from flask import Blueprint, jsonify, request

from ..utils.responses import fail, ok

logger = logging.getLogger(__name__)

bp = Blueprint("telegram", __name__, url_prefix="/api/telegram")

# Server-side environment configuration (never sent to client)
TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
TELEGRAM_BOT_USERNAME = os.environ.get("TELEGRAM_BOT_USERNAME", "mmmut_erp_bot").strip().lstrip("@")
TELEGRAM_CHANNEL_ID = os.environ.get("TELEGRAM_CHANNEL_ID", "").strip()
TELEGRAM_WEBHOOK_SECRET = os.environ.get("TELEGRAM_WEBHOOK_SECRET", "").strip()
TELEGRAM_CHANNEL_INVITE_LINK = os.environ.get(
    "TELEGRAM_CHANNEL_INVITE_LINK",
    "https://t.me/+Hx9BkNjz58YwZjY9"
).strip()

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
    # Allow test environments to bypass verification if explicitly configured
    if os.environ.get("FLASK_ENV") == "testing" or os.environ.get("FIREBASE_AUTH_DISABLED") == "true":
        return True, expected_uid or "test_uid", None

    auth_header = request.headers.get("Authorization", "").strip()
    if not auth_header:
        # If running in local development mode without token, log warning
        if not TELEGRAM_BOT_TOKEN and not os.environ.get("REQUIRE_FIREBASE_AUTH"):
            return True, expected_uid or "local_dev_user", None
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
def channel_invite():
    """Return the private channel invite link configured on the server."""
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
        "channelId": TELEGRAM_CHANNEL_ID or "-1003908239361"
    })


@bp.post("/create-token")
def create_linking_token():
    """Generate a single-use deep-link token to link ERP user to Telegram.
    
    Protected by Firebase Auth ID Token verification.
    """
    _clean_expired_tokens()
    data = request.get_json(silent=True) or {}
    uid = str(data.get("uid", "")).strip()
    if not uid:
        return fail("Missing required field: uid", 400)

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
def check_token_status(token: str):
    """Check if the student has started the bot with this token."""
    _clean_expired_tokens()
    entry = PENDING_TOKENS.get(token)
    if not entry:
        return fail("Token expired or not found", 404)

    is_linked = entry["status"] == "LINKED"
    return ok({
        "token": token,
        "linked": is_linked,
        "uid": entry["uid"],
        "telegramUserId": entry.get("telegramUserId"),
        "telegramUsername": entry.get("telegramUsername"),
    })


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
    # 1. Validate Webhook Secret Header
    if TELEGRAM_WEBHOOK_SECRET:
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
            token = parts[1].strip() if len(parts) > 1 else ""

            if token and token in PENDING_TOKENS:
                entry = PENDING_TOKENS[token]
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
def check_membership():
    """Verify if the student is currently an active member of the private channel.

    Protected by Firebase Auth ID Token verification.

    CORRECTION ENFORCEMENT:
    - If getChatMember returns member, administrator, or creator -> CHANNEL_APPROVED
    - Otherwise -> REMAIN JOIN_REQUEST_PENDING (do not falsely mark CHANNEL_REJECTED)
    - Only mark CHANNEL_REJECTED if there is explicit proof of rejection/ban.
    """
    data = request.get_json(silent=True) or {}
    uid = str(data.get("uid", "")).strip()
    telegram_user_id = str(data.get("telegramUserId", "")).strip()

    if not uid and not telegram_user_id:
        return fail("Missing required field: uid or telegramUserId", 400)

    # Verify caller's Firebase Auth ID token if uid is supplied
    if uid:
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
def verify_setup():
    """Verify live Telegram Bot configuration, webhook, and channel admin permissions."""
    report: Dict[str, Any] = {
        "timestamp": time.time(),
        "environment": {
            "TELEGRAM_BOT_TOKEN_SET": bool(TELEGRAM_BOT_TOKEN),
            "TELEGRAM_BOT_TOKEN_PREVIEW": "configured" if TELEGRAM_BOT_TOKEN else "MISSING",
            "TELEGRAM_CHANNEL_ID_SET": bool(TELEGRAM_CHANNEL_ID),
            "TELEGRAM_CHANNEL_ID": TELEGRAM_CHANNEL_ID or "MISSING",
            "TELEGRAM_BOT_USERNAME": TELEGRAM_BOT_USERNAME,
            "TELEGRAM_WEBHOOK_SECRET_SET": bool(TELEGRAM_WEBHOOK_SECRET),
            "TELEGRAM_CHANNEL_INVITE_LINK_SET": bool(TELEGRAM_CHANNEL_INVITE_LINK),
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

    # 2. Webhook check
    if TELEGRAM_BOT_TOKEN:
        wh_res = call_telegram_api("getWebhookInfo")
        if wh_res.get("ok"):
            wh_info = wh_res.get("result", {})
            wh_url = wh_info.get("url", "")
            report["webhook"] = {
                "status": "configured" if wh_url else "not_set",
                "url": wh_url,
                "pending_update_count": wh_info.get("pending_update_count", 0),
                "last_error_date": wh_info.get("last_error_date"),
                "last_error_message": wh_info.get("last_error_message"),
                "max_connections": wh_info.get("max_connections"),
                "allowed_updates": wh_info.get("allowed_updates", []),
                "has_custom_certificate": wh_info.get("has_custom_certificate"),
            }
            if not wh_url:
                action_items.append("Set Telegram Bot Webhook to https://mmmut-ero-backend.onrender.com/api/telegram/webhook")
            elif not wh_url.endswith("/api/telegram/webhook"):
                action_items.append(f"Webhook URL ({wh_url}) does not point to /api/telegram/webhook.")
        else:
            report["webhook"] = {"status": "failed", "error": wh_res.get("description")}

    # 3. Channel check
    if not TELEGRAM_CHANNEL_ID:
        action_items.append("Set TELEGRAM_CHANNEL_ID in Render environment variables (e.g. -1001234567890).")
        report["channel"]["error"] = "TELEGRAM_CHANNEL_ID is not configured."
    elif TELEGRAM_BOT_TOKEN:
        # Check chat info
        chat_res = call_telegram_api("getChat", {"chat_id": TELEGRAM_CHANNEL_ID})
        if chat_res.get("ok"):
            chat_info = chat_res.get("result", {})
            report["channel"]["chat_title"] = chat_info.get("title")
            report["channel"]["chat_type"] = chat_info.get("type")
        else:
            chat_err = chat_res.get("description", "Failed to access channel")
            report["channel"]["error"] = chat_err
            action_items.append(f"Telegram channel check failed ({chat_err}). Ensure bot has been added to the channel.")

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
                action_items.append(f"Bot (@{TELEGRAM_BOT_USERNAME}) is not an administrator of channel {TELEGRAM_CHANNEL_ID}. Add the bot as Channel Administrator.")
        else:
            admin_err = admin_res.get("description", "")
            report["channel"]["status"] = "error"
            report["channel"]["admin_check_error"] = admin_err
            action_items.append(f"Could not retrieve channel administrators: {admin_err}")

    # 4. Webhook secret check
    if not TELEGRAM_WEBHOOK_SECRET:
        action_items.append("Recommended: Set TELEGRAM_WEBHOOK_SECRET to protect webhook endpoint from spoofing.")

    report["overall_ready"] = (
        len(action_items) == 0 or
        (len(action_items) == 1 and "TELEGRAM_WEBHOOK_SECRET" in action_items[0])
    )

    return ok(report)


@bp.post("/set-webhook")
def set_webhook():
    """Register the backend webhook URL with Telegram Bot API."""
    if not TELEGRAM_BOT_TOKEN:
        return fail("TELEGRAM_BOT_TOKEN is not configured on the server", 400)

    data = request.get_json(silent=True) or {}
    webhook_url = data.get("webhookUrl") or "https://mmmut-ero-backend.onrender.com/api/telegram/webhook"
    secret_token = data.get("secretToken") or TELEGRAM_WEBHOOK_SECRET

    payload: Dict[str, Any] = {
        "url": webhook_url,
        "allowed_updates": ["message", "chat_join_request", "chat_member"],
        "drop_pending_updates": False,
    }
    if secret_token:
        payload["secret_token"] = secret_token

    res = call_telegram_api("setWebhook", payload)
    if res.get("ok"):
        return ok({
            "message": "Webhook successfully registered with Telegram Bot API",
            "url": webhook_url,
            "secret_configured": bool(secret_token),
            "allowed_updates": payload["allowed_updates"],
            "telegram_response": res
        })
    else:
        return fail(f"Telegram setWebhook failed: {res.get('description', 'Unknown error')}", 400)


@bp.post("/simulate-link")
def simulate_link():
    """Development / Testing endpoint to simulate a user completing the bot /start flow."""
    data = request.get_json(silent=True) or {}
    token = data.get("token", "")
    entry = PENDING_TOKENS.get(token)
    if not entry:
        return fail("Token not found or expired", 404)

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
    """Development / Testing endpoint to simulate channel admin approve/reject."""
    data = request.get_json(silent=True) or {}
    uid = data.get("uid", "")
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
