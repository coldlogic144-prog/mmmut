// Thin HTTP client for the Python backend (backend/app.py).
// NEVER throws into app flows: every helper returns null on any failure so an
// unavailable backend degrades gracefully to the original Firestore-only path.
// Point it at a deployed backend via localStorage['mmmut_api_base'] or by
// editing API_BASE_URL below (empty string = disabled, app behaves as before).
const API_BASE_URL = localStorage.getItem('mmmut_api_base') || '';

// OPTIONAL one-line deployment hook: after deploying the backend (e.g. Render),
// paste its origin here and redeploy the frontend so EVERY user gets the D2
// fallback without touching localStorage. Keep '' while no backend is deployed.
const BAKED_API_BASE = '';

function base() {
    const override = localStorage.getItem('mmmut_api_base');
    return ((override !== null && override !== '') ? override
        : (BAKED_API_BASE || API_BASE_URL)).replace(/\/$/, '');
}

async function getJson(url, timeoutMs = 6000) {
    if (!base()) return null; // backend not configured -> skip silently
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(base() + url, { signal: ctrl.signal });
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
