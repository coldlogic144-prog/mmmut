import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

console.log('=== TEST SUITE: THE LEDGER (SYLLABUS TRACKER) ERP INTEGRATION ===\n');

// --- Test Group 1: Syllabus Dataset Completeness ---
console.log('--- Test 1: Syllabus Dataset Completeness ---');
const dataModule = fs.readFileSync(path.join(__dirname, 'frontend/js/modules/41_ledger_data.js'), 'utf8');

const branchesExpected = ['civil', 'cse', 'it', 'ece', 'eceiot', 'ee', 'me', 'chemical', 'bba', 'bpharm'];
branchesExpected.forEach(b => {
    assert(dataModule.includes(`"${b}":`), `LEDGER_DATA contains branch: "${b}"`);
});

assert(dataModule.includes('const LEDGER_DATA ='), 'LEDGER_DATA constant is declared');
assert(dataModule.includes('const LEDGER_DETAIL ='), 'LEDGER_DETAIL constant is declared');
assert(dataModule.includes('BSM 110') && dataModule.includes('Engineering Mathematics I'), 'BSM 110 syllabus detail is present');
assert(dataModule.includes('Differential Calculus') && dataModule.includes('Leibnitz theorem'), 'Detailed topics within units are preserved');

// --- Test Group 2: DOM Architecture & Navigation ---
console.log('\n--- Test 2: DOM Architecture & Navigation ---');
const feHtml = fs.readFileSync(path.join(__dirname, 'frontend/index.html'), 'utf8');
const rootHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

[
    { name: 'frontend/index.html', content: feHtml },
    { name: 'root index.html', content: rootHtml }
].forEach(({ name, content }) => {
    assert(content.includes('id="sidebarLedgerBtn"') && content.includes('toggleLedgerSection(true)'), `${name} includes Desktop sidebar Ledger link`);
    assert(content.includes('id="ledgerView"'), `${name} includes #ledgerView container`);
    assert(content.includes('The Ledger') && content.includes('Syllabus tracker'), `${name} has Ledger header & subtitle`);
    assert(content.includes('id="ledgerStatPct"') && content.includes('id="ledgerStatCredits"'), `${name} has programme completion stat elements`);
    assert(content.includes('id="ledgerStatTopicsDone"') && content.includes('id="ledgerStatTopicsRemaining"'), `${name} has topic counter elements`);
    assert(content.includes('id="ledgerStatSemProgress"') && content.includes('id="ledgerSemProgressBar"'), `${name} has semester progress bar`);
    assert(content.includes('id="ledgerBranchSelect"'), `${name} has branch selector`);
    assert(content.includes('id="ledgerSearchInput"'), `${name} has course search input`);
    assert(content.includes('id="ledgerSemesterStrip"'), `${name} has semester chips container`);
    assert(content.includes('id="ledgerCourseList"'), `${name} has course list container`);
    assert(content.includes('id="ledgerResetModal"'), `${name} has reset confirmation modal`);
    assert(content.includes('const ledgerView = document.getElementById(\'ledgerView\')'), `${name} scrollToSection restores view by hiding ledgerView`);
});

// --- Test Group 3: JavaScript Module & State Machine ---
console.log('\n--- Test 3: JavaScript Module & State Machine ---');
const ledgerModule = fs.readFileSync(path.join(__dirname, 'frontend/js/modules/86_ledger.js'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, 'frontend/js/app.js'), 'utf8');

assert(ledgerModule.includes('function toggleLedgerSection(show)'), '86_ledger.js defines toggleLedgerSection');
assert(ledgerModule.includes('function detectUserBranch()'), '86_ledger.js defines automatic branch detection from currentUser.branchId');
assert(ledgerModule.includes('function attachLedgerFirestoreListener(branch)'), '86_ledger.js defines real-time Firestore synchronization listener');
assert(ledgerModule.includes('function saveLedgerProgress(branch)'), '86_ledger.js defines progress persistence');
assert(ledgerModule.includes('users\', currentUid, \'ledgerProgress\', branch'), '86_ledger.js writes to users/{uid}/ledgerProgress/{branch}');
assert(ledgerModule.includes('function handleLedgerAction(act, view, code, unitIdx, topicIdx)'), '86_ledger.js handles course, unit, and topic toggling');
assert(ledgerModule.includes('function confirmLedgerReset()'), '86_ledger.js handles isolated branch reset');

assert(appJs.includes('window.toggleLedgerSection = toggleLedgerSection;'), 'app.js exports toggleLedgerSection to window');
assert(appJs.includes('window.handleLedgerAction = handleLedgerAction;'), 'app.js exports handleLedgerAction to window');
assert(appJs.includes('window.handleLedgerBranchChange = handleLedgerBranchChange;'), 'app.js exports handleLedgerBranchChange to window');
assert(appJs.includes('window.confirmLedgerReset = confirmLedgerReset;'), 'app.js exports confirmLedgerReset to window');

// --- Test Group 4: Firestore Security Rules ---
console.log('\n--- Test 4: Firestore Security Rules ---');
const rules = fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8');
assert(rules.includes('match /ledgerProgress/{branch}'), 'firestore.rules matches subcollection /ledgerProgress/{branch}');
assert(rules.includes('allow read, write: if isOwner(uid);'), 'firestore.rules restricts access to isOwner(uid)');

// --- Test Group 5: CSS Design System & Responsiveness ---
console.log('\n--- Test 5: CSS Design System & Responsiveness ---');
const pagesCss = fs.readFileSync(path.join(__dirname, 'frontend/css/pages.css'), 'utf8');

assert(pagesCss.includes('#ledgerView {'), 'pages.css has styles for #ledgerView');
assert(pagesCss.includes('.ledger-cb.checked'), 'pages.css has styles for checked topic/course boxes');
assert(pagesCss.includes('.ledger-cb.partial'), 'pages.css has styles for partially completed units/courses');
assert(pagesCss.includes('.ledger-course-header'), 'pages.css has styles for course row header');
assert(pagesCss.includes('.ledger-course-details-panel'), 'pages.css has styles for expandable syllabus details');
assert(pagesCss.includes('.ledger-topics-grid'), 'pages.css has responsive grid for topics');
assert(pagesCss.includes('@media (max-width: 768px)') && pagesCss.includes('#ledgerView'), 'pages.css includes mobile breakpoint adjustments for #ledgerView');
assert(pagesCss.includes('--mobile-nav-height'), 'pages.css accounts for mobile bottom navigation safe area');

console.log('\n=================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('=================================================\n');

if (failed > 0) {
    process.exit(1);
} else {
    console.log('ALL LEDGER INTEGRATION TESTS PASSED SUCCESSFULLY!');
}
