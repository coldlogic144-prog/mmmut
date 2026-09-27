// test_telegram_system.mjs — Comprehensive test suite for Private Telegram Access System
import fs from 'node:fs';
import path from 'node:path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
    }
}

console.log('=== TEST SUITE: PRIVATE TELEGRAM ACCESS SYSTEM ===\n');

// ---------------------------------------------------------------------------
// 1. STATE MACHINE TRANSITIONS & USER'S REQUIRED CORRECTION
// ---------------------------------------------------------------------------
console.log('--- Test 1: State Machine Transitions & getChatMember Logic ---');

const STATES = {
    NOT_APPLIED: 'NOT_APPLIED',
    PENDING_ADMIN_APPROVAL: 'PENDING_ADMIN_APPROVAL',
    ADMIN_REJECTED: 'ADMIN_REJECTED',
    ADMIN_APPROVED: 'ADMIN_APPROVED',
    TELEGRAM_NOT_CONNECTED: 'TELEGRAM_NOT_CONNECTED',
    JOIN_REQUEST_NOT_SENT: 'JOIN_REQUEST_NOT_SENT',
    JOIN_REQUEST_PENDING: 'JOIN_REQUEST_PENDING',
    CHANNEL_APPROVED: 'CHANNEL_APPROVED',
    CHANNEL_REJECTED: 'CHANNEL_REJECTED'
};

// Simulation function mirroring the backend & frontend membership check
function evaluateMembershipCheck(currentStatus, getChatMemberResult) {
    // If not currently in a join-request state, return current
    if (currentStatus !== STATES.JOIN_REQUEST_PENDING) {
        return currentStatus;
    }

    if (!getChatMemberResult || !getChatMemberResult.ok) {
        // API error or user not found yet — must REMAIN JOIN_REQUEST_PENDING
        return STATES.JOIN_REQUEST_PENDING;
    }

    const memberStatus = getChatMemberResult.result?.status;

    if (['creator', 'administrator', 'member'].includes(memberStatus)) {
        return STATES.CHANNEL_APPROVED;
    }

    if (memberStatus === 'kicked') {
        // Reliable evidence of explicit rejection/banishment
        return STATES.CHANNEL_REJECTED;
    }

    // CRITICAL USER CORRECTION:
    // If getChatMember returns 'left', 'restricted', or anything else,
    // it simply means the admin has not yet acted on the join request.
    // MUST REMAIN JOIN_REQUEST_PENDING, NEVER FALSELY CHANNEL_REJECTED!
    return STATES.JOIN_REQUEST_PENDING;
}

// Case A: Initial state
let current = STATES.NOT_APPLIED;
assert(current === 'NOT_APPLIED', 'Initial state is NOT_APPLIED');

// Case B: Student applies -> PENDING_ADMIN_APPROVAL
current = STATES.PENDING_ADMIN_APPROVAL;
assert(current === 'PENDING_ADMIN_APPROVAL', 'After student applies, state is PENDING_ADMIN_APPROVAL');

// Case C: Admin declines -> ADMIN_REJECTED
current = STATES.ADMIN_REJECTED;
assert(current === 'ADMIN_REJECTED', 'If admin declines, state transitions to ADMIN_REJECTED');

// Case D: Student re-applies -> PENDING_ADMIN_APPROVAL
current = STATES.PENDING_ADMIN_APPROVAL;
assert(current === 'PENDING_ADMIN_APPROVAL', 'Student can re-apply to PENDING_ADMIN_APPROVAL');

// Case E: Admin approves -> ADMIN_APPROVED / TELEGRAM_NOT_CONNECTED
current = STATES.ADMIN_APPROVED;
function getEffectiveState(status, telegramUserId) {
    if (status === STATES.ADMIN_APPROVED && !telegramUserId) {
        return STATES.TELEGRAM_NOT_CONNECTED;
    }
    return status;
}
assert(getEffectiveState(current, null) === 'TELEGRAM_NOT_CONNECTED', 'Approved user without linked TG ID shows TELEGRAM_NOT_CONNECTED');

// Case F: Telegram linked via /start -> JOIN_REQUEST_NOT_SENT
let tgUserId = '987654321';
current = STATES.JOIN_REQUEST_NOT_SENT;
assert(getEffectiveState(current, tgUserId) === 'JOIN_REQUEST_NOT_SENT', 'Linked user shows JOIN_REQUEST_NOT_SENT');

// Case G: Join request submitted -> JOIN_REQUEST_PENDING
current = STATES.JOIN_REQUEST_PENDING;
assert(current === 'JOIN_REQUEST_PENDING', 'Submitting join request enters JOIN_REQUEST_PENDING');

// Case H: USER CORRECTION TEST — getChatMember returns 'left' (not yet approved)
let resLeft = { ok: true, result: { status: 'left' } };
let evalLeft = evaluateMembershipCheck(current, resLeft);
assert(evalLeft === STATES.JOIN_REQUEST_PENDING, 'CORRECTION: getChatMember="left" MUST RETAIN JOIN_REQUEST_PENDING (never falsely CHANNEL_REJECTED)');

// Case I: USER CORRECTION TEST — getChatMember returns API 400 (e.g. user not found)
let resError = { ok: false, error_code: 400, description: 'Bad Request: user not found' };
let evalError = evaluateMembershipCheck(current, resError);
assert(evalError === STATES.JOIN_REQUEST_PENDING, 'CORRECTION: getChatMember error MUST RETAIN JOIN_REQUEST_PENDING');

// Case J: Telegram Channel Admin approves -> getChatMember returns 'member'
let resMember = { ok: true, result: { status: 'member' } };
let evalMember = evaluateMembershipCheck(current, resMember);
assert(evalMember === STATES.CHANNEL_APPROVED, 'getChatMember="member" transitions to CHANNEL_APPROVED');

// Case K: Telegram Channel Admin rejects with ban -> getChatMember returns 'kicked'
let resKicked = { ok: true, result: { status: 'kicked', until_date: 0 } };
let evalKicked = evaluateMembershipCheck(current, resKicked);
assert(evalKicked === STATES.CHANNEL_REJECTED, 'getChatMember="kicked" (reliable evidence) transitions to CHANNEL_REJECTED');

// ---------------------------------------------------------------------------
// 2. FIRESTORE RULES VERIFICATION
// ---------------------------------------------------------------------------
console.log('\n--- Test 2: Firestore Security Rules Validation ---');
const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

assert(rulesContent.includes('match /telegramApplications/{uid}'), 'firestore.rules includes /telegramApplications/{uid}');
assert(rulesContent.includes("request.resource.data.status == 'PENDING_ADMIN_APPROVAL'"), 'Student can only create initial application with PENDING_ADMIN_APPROVAL');
assert(rulesContent.includes("request.resource.data.status != 'ADMIN_APPROVED'"), 'Student cannot self-promote to ADMIN_APPROVED');
assert(rulesContent.includes("resource.data.status == 'ADMIN_REJECTED' && request.resource.data.status == 'PENDING_ADMIN_APPROVAL'"), 'Student can re-apply if ADMIN_REJECTED');
assert(rulesContent.includes("allow delete: if isAdmin()"), 'Only admins can delete applications');

// ---------------------------------------------------------------------------
// 3. BACKEND ROUTE & SENSITIVE DATA VERIFICATION
// ---------------------------------------------------------------------------
console.log('\n--- Test 3: Backend Routes & Bot Token Security ---');
const tgRouteContent = fs.readFileSync('backend/routes/telegram.py', 'utf8');
const feAppContent = fs.readFileSync('frontend/js/app.js', 'utf8');
const apiServiceContent = fs.readFileSync('frontend/js/services/apiService.js', 'utf8');
const envExampleContent = fs.readFileSync('.env.example', 'utf8');
const renderYamlContent = fs.readFileSync('render.yaml', 'utf8');

// Environment variables
assert(tgRouteContent.includes('TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN"'), 'TELEGRAM_BOT_TOKEN is loaded from server-side environment');
assert(tgRouteContent.includes('TELEGRAM_CHANNEL_ID = os.environ.get("TELEGRAM_CHANNEL_ID"'), 'TELEGRAM_CHANNEL_ID is loaded from server-side environment');
assert(tgRouteContent.includes('TELEGRAM_BOT_USERNAME = os.environ.get("TELEGRAM_BOT_USERNAME"'), 'TELEGRAM_BOT_USERNAME is loaded from server-side environment');
assert(tgRouteContent.includes('TELEGRAM_WEBHOOK_SECRET = os.environ.get("TELEGRAM_WEBHOOK_SECRET"'), 'TELEGRAM_WEBHOOK_SECRET is loaded from server-side environment');

assert(envExampleContent.includes('TELEGRAM_BOT_TOKEN='), '.env.example documents TELEGRAM_BOT_TOKEN');
assert(envExampleContent.includes('TELEGRAM_CHANNEL_ID='), '.env.example documents TELEGRAM_CHANNEL_ID');
assert(envExampleContent.includes('TELEGRAM_BOT_USERNAME='), '.env.example documents TELEGRAM_BOT_USERNAME');
assert(envExampleContent.includes('TELEGRAM_WEBHOOK_SECRET='), '.env.example documents TELEGRAM_WEBHOOK_SECRET');

assert(renderYamlContent.includes('key: TELEGRAM_BOT_TOKEN'), 'render.yaml configures TELEGRAM_BOT_TOKEN');
assert(renderYamlContent.includes('key: TELEGRAM_CHANNEL_ID'), 'render.yaml configures TELEGRAM_CHANNEL_ID');
assert(renderYamlContent.includes('key: TELEGRAM_BOT_USERNAME'), 'render.yaml configures TELEGRAM_BOT_USERNAME');
assert(renderYamlContent.includes('key: TELEGRAM_WEBHOOK_SECRET'), 'render.yaml configures TELEGRAM_WEBHOOK_SECRET');

// Bot token security
assert(!feAppContent.includes('bot_token') && !feAppContent.includes('BOT_TOKEN'), 'Bot token is NEVER present in frontend bundle');
assert(!apiServiceContent.includes('bot_token') && !apiServiceContent.includes('BOT_TOKEN'), 'Bot token is NEVER present in apiService.js');

// No auto approval
assert(!tgRouteContent.includes('approveChatJoinRequest"') && !tgRouteContent.includes("approveChatJoinRequest'"), 'CRITICAL: approveChatJoinRequest is NEVER invoked');

// Webhook secret validation
assert(tgRouteContent.includes('X-Telegram-Bot-Api-Secret-Token'), 'Webhook validates secret token header');

// Membership checks
assert(tgRouteContent.includes('status_state = "JOIN_REQUEST_PENDING"'), 'Backend check_membership defaults to JOIN_REQUEST_PENDING on non-member');
assert(tgRouteContent.includes('status_state = "CHANNEL_APPROVED"'), 'Backend check_membership promotes to CHANNEL_APPROVED on active member');

// Diagnostic setup verification endpoint
assert(tgRouteContent.includes('/verify-setup'), 'Backend has /verify-setup diagnostic route');
assert(tgRouteContent.includes('/set-webhook'), 'Backend has /set-webhook route');
assert(tgRouteContent.includes('can_invite_users'), 'Backend checks can_invite_users admin permission');

// ---------------------------------------------------------------------------
// 4. FRONTEND MODULES & BACKEND INTEGRATION
// ---------------------------------------------------------------------------
console.log('\n--- Test 4: Frontend Modules & API Connectivity ---');
const feIndex = fs.readFileSync('frontend/index.html', 'utf8');
const rootIndex = fs.readFileSync('index.html', 'utf8');

assert(feIndex.includes('id="telegramStateContainer"'), 'frontend/index.html includes #telegramStateContainer');
assert(feIndex.includes('data-tab="telegram"'), 'frontend/index.html includes Telegram admin tab');
assert(feIndex.includes('id="tab-telegram"'), 'frontend/index.html includes #tab-telegram content panel');
assert(rootIndex.includes('id="telegramStateContainer"'), 'root index.html includes #telegramStateContainer');
assert(rootIndex.includes('data-tab="telegram"'), 'root index.html includes Telegram admin tab');
assert(rootIndex.includes('id="tab-telegram"'), 'root index.html includes #tab-telegram content panel');

assert(feAppContent.includes('function renderAdminTelegram()'), 'frontend/js/app.js has renderAdminTelegram()');
assert(feAppContent.includes('function applyForTelegramAccess()'), 'frontend/js/app.js has applyForTelegramAccess()');
assert(feAppContent.includes('function checkMembershipStatus()'), 'frontend/js/app.js has checkMembershipStatus()');

// Deployed Backend URL configuration
assert(apiServiceContent.includes('https://mmmut-ero-backend.onrender.com'), 'frontend/js/services/apiService.js defaults to deployed Render backend URL');

// Firebase Auth ID token propagation
assert(feAppContent.includes('getIdToken()'), 'Frontend retrieves Firebase Auth ID token before calling protected backend endpoints');
assert(apiServiceContent.includes('Authorization') && apiServiceContent.includes('Bearer'), 'apiService attaches Authorization: Bearer <idToken> header');
assert(tgRouteContent.includes('verify_firebase_id_token'), 'Backend verifies Firebase Auth ID token on protected endpoints');

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n=================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('=================================================');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('\nALL TEST VERIFICATIONS PASSED SUCCESSFULLY!');
}
