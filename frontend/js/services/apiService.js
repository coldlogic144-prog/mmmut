// Thin HTTP client for the Python backend (backend/app.py).
// NEVER throws into app flows: every helper returns null on any failure so an
// unavailable backend degrades gracefully to the original Firestore-only path.
// Point it at a deployed backend via localStorage['mmmut_api_base'] or by
// editing API_BASE_URL below (empty string = disabled, app behaves as before).
const API_BASE_URL = localStorage.getItem('mmmut_api_base') || '';

// OPTIONAL one-line deployment hook: after deploying the backend (e.g. Render),
// paste its origin here and redeploy the frontend so EVERY user gets the D2
// fallback without touching localStorage. Keep '' while no backend is deployed.
const BAKED_API_BASE = 'https://mmmut-ero-backend.onrender.com';

function isSafeBase(u) {
    if (!u) return false;
    try {
        const parsed = new URL(u);
        return parsed.protocol === 'https:' ||
            ((parsed.protocol === 'http:') &&
             (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'));
    } catch (_) { return false; }
}

function base() {
    const override = localStorage.getItem('mmmut_api_base');
    const candidate = ((override !== null && override !== '') ? override
        : (BAKED_API_BASE || API_BASE_URL));
    if (!candidate) return '';
    const clean = String(candidate).replace(/\/$/, '');
    // Reject javascript:/data: and non-https overrides to prevent open-redirect / token theft.
    if (!isSafeBase(clean)) return '';
    return clean;
}

async function getJson(url, timeoutMs = 6000, idToken = null) {
    if (!base()) return null; // backend not configured -> skip silently
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const headers = {};
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
        const res = await fetch(base() + url, { signal: ctrl.signal, headers });
        if (!res.ok) return null;
        return await res.json();
    } catch (e) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

export async function apiHealth() {
    return getJson('/api/health');
}

// Raw roster record { rollNumber, applicantName, branchName, section, ... }
// or null when the backend is unavailable / does not know the roll.
export async function apiFetchRoster(rollNumber) {
    if (!/^\d{10}$/.test(String(rollNumber || ''))) return null;
    const data = await getJson('/api/roster/' + encodeURIComponent(rollNumber));
    return data && data.found ? data.record : null;
}

async function postJson(url, payload = {}, timeoutMs = 8000, idToken = null) {
    if (!base()) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (idToken) {
            headers['Authorization'] = `Bearer ${idToken}`;
        }
        const res = await fetch(base() + url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: ctrl.signal
        });
        if (!res.ok) {
            try {
                return await res.json();
            } catch (_) {
                return null;
            }
        }
        return await res.json();
    } catch (e) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

// Telegram Private Access API Helpers (all protected endpoints need idToken)
export async function apiCreateTelegramToken(uid, idToken = null) {
    if (!uid) return null;
    return await postJson('/api/telegram/create-token', { uid }, 8000, idToken);
}

export async function apiGetTelegramTokenStatus(token, idToken = null) {
    if (!token) return null;
    if (!idToken) return null;
    return await getJson('/api/telegram/token-status/' + encodeURIComponent(token), 6000, idToken);
}

export async function apiCheckTelegramMembership(uid, telegramUserId, idToken = null) {
    if (!uid || !idToken) return null;
    return await postJson('/api/telegram/check-membership', { uid, telegramUserId }, 8000, idToken);
}

export async function apiGetTelegramChannelInvite(idToken = null) {
    if (!idToken) return null;
    return await getJson('/api/telegram/channel-invite', 6000, idToken);
}

export async function apiVerifyTelegramSetup(idToken = null) {
    if (!idToken) return null;
    return await getJson('/api/telegram/verify-setup', 6000, idToken);
}

export async function apiSetTelegramWebhook(webhookUrl = null, secretToken = null, idToken = null) {
    if (!idToken) return null;
    return await postJson('/api/telegram/set-webhook', { webhookUrl, secretToken }, 8000, idToken);
}
