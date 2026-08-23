#!/usr/bin/env node
// tools/extract_frontend.mjs — Phase 2 mechanical extractor (v2, final).
//
// ARCHITECTURE DECISION (see docs/REFACTOR_NOTES.md):
// The monolith's ~6,700-line module shares dozens of mutable bindings and
// locals-shadow-globals across every feature. Splitting into real per-file
// ES modules would require a framework-level state refactor and risk silent
// breakage. Instead we keep the requested folder structure as REVIEWABLE
// SOURCE SECTIONS under frontend/js/modules/NN_*.js and COMPOSE them — in
// original statement order, byte-identical — into ONE real ES module:
//     frontend/js/app.js
// which index.html loads. tools/build_frontend.mjs rebuilds app.js from the
// sections after any edit. Behavior is provably identical to index.html's
// original single <script type="module"> scope.
//
// The only genuinely separate ES module is js/services/apiService.js (the new,
// additive backend client) imported by app.js.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = 'e:/mmmut';
const SRC = path.join(ROOT, 'index.html');
const FE = path.join(ROOT, 'frontend');
const lines = fs.readFileSync(SRC, 'utf8').split(/\r?\n/);
const L = (a, b) => lines.slice(a - 1, b).join('\n'); // 1-based inclusive

// ---- ordered source sections (ranges are 1-based inclusive, original file) ----
const SEC = (file, desc, ranges) => ({ file, desc, ranges });
const SECTIONS = [
  SEC('10_firebase_boot.js', 'SDK imports, firebaseConfig, App Check, auth/db/storage + all Firestore collection refs', [[3446, 3583]]),
  SEC('15_flags_config.js', 'Roll-migration kill-switches/pattern + FCM VAPID key & SW path', [[3584, 3605], [3607, 3620]]),
  SEC('20_notifications_push.js', 'Firebase Cloud Messaging web-push module', [[3621, 3877]]),
  SEC('25_ai_init.js', 'Ledger AI (Gemini) model init', [[3878, 3906]]),
  SEC('30_data_tables.js', 'PERIODS/BRANCHES/BUILTIN_EVENTS/PDF_TIMETABLES static data', [[3907, 4919]]),
  SEC('35_schedule_engine.js', 'Helpers + seeded timetable generator', [[4920, 5042]]),
  SEC('40_syllabus_data.js', 'Per-branch/year syllabus dataset', [[5043, 5612]]),
  SEC('45_syllabus_ui.js', 'Syllabus viewer', [[5613, 5693]]),
  SEC('50_state_toast_holidays_profile.js', 'Shared state lets, toast, holidays, profile modal, branch options', [[5694, 5912]]),
  SEC('55_auth_core.js', 'Signup / Login / Logout / profile loaders / friendlyAuthError', [[5913, 6160]]),
  SEC('60_session_loginAs.js', 'loginAs() session starter wiring all listeners + gates', [[6161, 6349]]),
  SEC('65_roll_verification.js', 'Roll-number hard gate, claim, finalize (roll-login core)', [[6350, 6646]]),
  SEC('70_notif_badge_admin_request.js', 'Notification badge, posts-read, admin role request, admin roll-verify tab', [[6647, 6864]]),
  SEC('75_admin_panel.js', 'Admin dashboard/users/timetable-editor/calendar/holidays/posts/requests', [[6865, 7450]]),
  SEC('80_feed_attendance_events_image_history.js', 'Posts feed, topbar, schedule render+marking, stats, events, canvas image, history', [[7451, 8012]]),
  SEC('85_chess_club.js', 'Chess club manager (members/events/challenges/games/activity)', [[8013, 8578]]),
  SEC('90_community_feedback_rating.js', 'Community posts, feedback tickets, ratings', [[8579, 9346]]),
  SEC('95_ledger_ai_chat.js', 'Ledger AI chat UI, context builder, prompts', [[9347, 9893]]),
  SEC('99_boot_window_bindings.js', 'boot(), auth-state router, window.* bindings for inline onclick, DOMContentLoaded', [[9894, 10132]]),
];

// ---- apiService.js: the one real standalone ES module (additive backend client)
const APISERVICE_JS = `// Thin HTTP client for the Python backend (backend/app.py).
// NEVER throws into app flows: every helper returns null on any failure so an
// unavailable backend degrades gracefully to the original Firestore-only path.
// Point it at a deployed backend via localStorage['mmmut_api_base'] or by
// editing API_BASE_URL below (empty string = disabled, app behaves as before).
const API_BASE_URL = localStorage.getItem('mmmut_api_base') || '';

function base() {
    const override = localStorage.getItem('mmmut_api_base');
    return (override !== null ? override : API_BASE_URL).replace(/\\/$/, '');
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
    if (!/^\\d{10}$/.test(String(rollNumber || ''))) return null;
    const data = await getJson('/api/roster/' + encodeURIComponent(rollNumber));
    return data && data.found ? data.record : null;
}
`;
// ---------- CSS split (order-preserving contiguous slices of the <style> block) ----------
const CSS_FILES = [
  ['css/base.css', 8, 102, 'Design tokens (:root), resets, typography, loading screen'],
  ['css/layout.css', 103, 551, 'Auth screens, app shell, topbar, shell grid'],
  ['css/components.css', 552, 1995, 'Cards, rail, stats, admin panel, modals, toast, history'],
  ['css/pages.css', 1996, 2657, 'Ledger AI chat + Chess club styles'],
];

// ---------- frontend/index.html ----------
function writeIndexHtml() {
  const head = L(1, 6) + '\n' + [
    '    <!-- Styles split from the original monolithic <style> block.',
    '         Link ORDER preserves the original cascade exactly. -->',
    ...CSS_FILES.map(([f]) => '    <link rel="stylesheet" href="./' + f + '" />'),
    '</head>',
  ].join('\n') + '\n';
  const html = head + '\n' + L(2660, 3429) + '\n\n' + L(3431, 3443) + '\n\n' +
    '    <!-- Application entry point. Generated by tools/build_frontend.mjs\n' +
    '         from the source sections in ./js/modules/. Do not hand-edit app.js;\n' +
    '         edit the section file, then run:  node tools/build_frontend.mjs -->\n' +
    '    <script type="module" src="./js/app.js"></script>\n' +
    '</body>\n</html>\n';
  fs.writeFileSync(path.join(FE, 'index.html'), html);
}

function composeAppJs(sectionBodies) {
  let code = sectionBodies.join('\n\n');
  // Inject the backend-client import right after the Firebase import block
  // (ES module imports are hoisted; placement here keeps related imports together).
  const marker = '} from "firebase/messaging";';
  if (!code.includes(marker)) throw new Error('firebase/messaging import marker not found');
  code = code.replace(marker, marker + '\n' +
    "\n        // ===== PYTHON BACKEND CLIENT (additive — see backend/) =====\n" +
    "        import { apiFetchRoster } from './services/apiService.js';");
  const banner =
    '// ============================================================================\n' +
    '// GENERATED FILE — tools/build_frontend.mjs composes this from\n' +
    '// frontend/js/modules/NN_*.js (source sections extracted verbatim from the\n' +
    '// original monolithic index.html). Edit a section file, then rebuild:\n' +
    '//     node tools/build_frontend.mjs\n' +
    '// All sections share ONE module scope, exactly like the original single\n' +
    '// inline <script type="module">. Statement order is preserved.\n' +
    '// ============================================================================\n\n';
  return banner + code.trimStart() + '\n';
}

// ---------- main ----------
fs.rmSync(FE, { recursive: true, force: true });
fs.mkdirSync(path.join(FE, 'js', 'modules'), { recursive: true });

const w = (rel, txt) => {
  fs.mkdirSync(path.dirname(path.join(FE, rel)), { recursive: true });
  fs.writeFileSync(path.join(FE, rel), txt);
};

w('js/services/apiService.js', APISERVICE_JS);

for (const [f, a, b, desc] of CSS_FILES) {
  w(f, '/* ' + desc + ' */\n' + L(a, b).trim() + '\n');
}

const bodies = [];
for (const sec of SECTIONS) {
  const body = sec.ranges.map(([a, b]) => L(a, b)).join('\n');
  const txt = '// ============================================================================\n' +
    '// SECTION: ' + sec.file + '\n' +
    '// ' + sec.desc + '\n' +
    '// Source: index.html lines ' + sec.ranges.map(([a, b]) => a + '-' + b).join(', ') + ' (verbatim)\n' +
    '// NOTE: sections share one module scope after composition — plain code, no\n' +
    '// imports/exports here by design. Rebuild app.js after editing.\n' +
    '// ============================================================================\n\n' + body;
  w('js/modules/' + sec.file, txt);
  bodies.push(body);
}

w('js/app.js', composeAppJs(bodies));
writeIndexHtml();

console.log('frontend written:');
const walk = (d, pre) => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p, pre + e.name + '/');
  else console.log('  ' + pre + e.name + ' (' + fs.readFileSync(p, 'utf8').split('\n').length + ' lines)');
});
walk(FE, '');
console.log('DONE');

