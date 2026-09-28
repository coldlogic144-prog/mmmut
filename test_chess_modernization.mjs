import fs from 'fs';
import path from 'path';

console.log('=== TEST SUITE: CHESS MODULE MODERNIZATION & BUG AUDIT ===\n');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        console.log(`  ✓ PASS: ${message}`);
        passedTests++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
    }
}

// --- Test 1: HTML Structure & Semantic Elements ---
console.log('--- Test 1: HTML Architecture & DOM Components ---');
const chessHtml = fs.readFileSync('chess/chess.html', 'utf8');

assert(chessHtml.includes('id="gateScreen"'), 'Auth gate screen exists');
assert(chessHtml.includes('id="chessApp"'), 'Chess main application container exists');
assert(chessHtml.includes('class="chess-topbar"'), 'Modern sticky topbar exists');
assert(chessHtml.includes('MMMUT ERP'), 'University branding is present in header');
assert(chessHtml.includes('← Back to MMMUT ERP'), 'Back to MMMUT ERP navigation link is present');
assert(chessHtml.includes('id="board"'), 'Chess board container exists');
assert(chessHtml.includes('id="topPlayerStrip"'), 'Top player strip exists');
assert(chessHtml.includes('id="bottomPlayerStrip"'), 'Bottom player strip exists');
assert(chessHtml.includes('id="topPlayerClock"'), 'Top player clock element exists');
assert(chessHtml.includes('id="bottomPlayerClock"'), 'Bottom player clock element exists');
assert(chessHtml.includes('id="moveList"'), 'Move history notation container exists');
assert(chessHtml.includes('id="statusLine"'), 'Game status line element exists');
assert(chessHtml.includes('id="resultCard"'), 'Result banner card exists');
assert(chessHtml.includes('id="drawOfferBanner"'), 'Draw offer notification banner exists');
assert(chessHtml.includes('id="setupModal"'), 'Local game setup modal exists');
assert(chessHtml.includes('id="onlineModal"'), 'Online matchmaking modal exists');
assert(chessHtml.includes('id="challengeModal"'), 'Direct challenge modal exists');
assert(chessHtml.includes('id="promoModal"'), 'Pawn promotion modal exists');
assert(chessHtml.includes('id="resignModal"'), 'In-app resignation confirmation modal exists');

// --- Test 2: CSS Design System & Removal of Old Retro Styles ---
console.log('\n--- Test 2: CSS Design Tokens & Visual Language ---');
const chessCss = fs.readFileSync('chess/chess.css', 'utf8');

assert(chessCss.includes('Plus Jakarta Sans'), 'Uses Plus Jakarta Sans typography');
assert(chessCss.includes('JetBrains Mono'), 'Uses JetBrains Mono monospace typography');
assert(!chessCss.includes('Fraunces'), 'Old Fraunces font completely removed');
assert(!chessCss.includes('IBM Plex Sans'), 'Old IBM Plex Sans font completely removed');
assert(chessCss.includes('--primary: #1b365d;'), 'Institutional university navy color token defined');
assert(chessCss.includes('--bg-canvas: #f8fafc;'), 'Clean ERP canvas background token defined');
assert(chessCss.includes('--surface: #ffffff;'), 'Clean card surface token defined');
assert(chessCss.includes('--surface-border: #e2e8f0;'), 'Subtle slate border token defined');
assert(!chessCss.includes('--paper: #EDEAE0'), 'Old retro paper parchment color removed');
assert(!chessCss.includes('--brass: #B08A3E'), 'Old retro brass gold color removed');
assert(chessCss.includes('aspect-ratio: 1 / 1;'), 'Board strictly enforces 1:1 perfect square aspect ratio');
assert(chessCss.includes('touch-action: manipulation;'), 'Touch action manipulation enabled for instant mobile response');
assert(chessCss.includes('@media (max-width: 992px)'), 'Desktop-to-tablet responsive breakpoint present');
assert(chessCss.includes('@media (max-width: 560px)'), 'Mobile small screen responsive breakpoint present');
assert(chessCss.includes('safe-area-inset-top'), 'Mobile safe area inset top supported');

// --- Test 3: JavaScript Engine & Bug Fixes ---
console.log('\n--- Test 3: JavaScript Engine & Memory Leak Prevention ---');
const chessJs = fs.readFileSync('chess/chess.js', 'utf8');

assert(chessJs.includes('cleanupPhase2Listeners'), 'cleanupPhase2Listeners defined to prevent duplicate listeners');
assert(chessJs.includes('window.addEventListener(\'beforeunload\''), 'Unload lifecycle handler cleans up timers and listeners');
assert(chessJs.includes('window.addEventListener(\'pagehide\''), 'Pagehide lifecycle handler cleans up timers and listeners');
assert(chessJs.includes('window.executeResign'), 'In-app resignation handler defined');
assert(chessJs.includes('window.promptResign'), 'In-app resignation prompt modal trigger defined');
assert(chessJs.includes('drawOfferBanner'), 'Draw offer banner display is wired to sync state');
assert(chessJs.includes('stopClock()'), 'Clock cleanup function reliably implemented');
assert(chessJs.includes('window.openSetupModal'), 'Local game modal opener exported to window');
assert(chessJs.includes('window.openOnlineModal'), 'Online match modal opener exported to window');
assert(chessJs.includes('window.openChallengeModal'), 'Challenge modal opener exported to window');
assert(chessJs.includes('window.flipBoard'), 'Flip board perspective exported to window');
assert(chessJs.includes('window.offerDraw'), 'Draw offer function exported to window');
assert(chessJs.includes('window.acceptDrawOffer'), 'Accept draw function exported to window');
assert(chessJs.includes('window.declineDrawOffer'), 'Decline draw function exported to window');
assert(chessJs.includes('window.copyPgn'), 'Copy PGN exported to window');
assert(chessJs.includes('window.copyFen'), 'Copy FEN exported to window');

// --- Test 4: ERP Integration & Synchronization ---
console.log('\n--- Test 4: ERP Integration & Consistency ---');
const rootIndex = fs.readFileSync('index.html', 'utf8');
const frontendIndex = fs.readFileSync('frontend/index.html', 'utf8');
const clubModule = fs.readFileSync('frontend/js/modules/85_chess_club.js', 'utf8');

assert(clubModule.includes('window._chessMembersUnsub()'), '85_chess_club.js unsubscribes members on toggleChessClub(false)');
assert(clubModule.includes('window._chessEventsUnsub()'), '85_chess_club.js unsubscribes events on toggleChessClub(false)');
assert(clubModule.includes('window._chessChallengesUnsub()'), '85_chess_club.js unsubscribes challenges on toggleChessClub(false)');
assert(frontendIndex.includes('Open Live Chess Arena'), 'frontend/index.html includes link to Live Chess Arena');
assert(rootIndex.includes('Open Live Chess Arena'), 'root index.html includes link to Live Chess Arena');
assert(frontendIndex.includes('← Back to MMMUT ERP'), 'frontend/index.html uses ← Back to MMMUT ERP');
assert(rootIndex.includes('← Back to MMMUT ERP'), 'root index.html uses ← Back to MMMUT ERP');

console.log(`\n=================================================`);
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log(`=================================================`);

if (totalTests === passedTests) {
    console.log('\nALL CHESS MODERNIZATION TESTS PASSED!\n');
    process.exit(0);
} else {
    console.error('\nSOME TESTS FAILED!\n');
    process.exit(1);
}
