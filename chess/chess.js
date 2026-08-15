// ============================================================
// CHESS MODULE — chess.js (game logic)
// PHASE 1: local hotseat play (kept as-is).
// PHASE 2: Firebase-backed player profiles, online matchmaking,
// challenges, live Firestore-synced games, and Elo ratings.
// Reuses the SAME Firestore collections the old "Chess Club" tab
// in index.html already wrote its schema for (chessClubMembers,
// chessChallenges, chessActivity, chessGames) so existing club
// members/challenges show up here. Adds one new collection,
// chessMatchmaking, for the quick-play queue.
// ============================================================

import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
    getFirestore, doc, collection, getDoc, getDocs, setDoc, addDoc,
    updateDoc, deleteDoc, onSnapshot, query, where, serverTimestamp,
    runTransaction
} from "firebase/firestore";
import { Chess } from "chess.js";

// ===== Same Firebase project as the main Ledger app =====
const firebaseConfig = {
    apiKey: "AIzaSyDMLvLIZkPFO5nsVQBr2IA-8BRB5Hzb3Xo",
    authDomain: "student-erp-77605.firebaseapp.com",
    projectId: "student-erp-77605",
    storageBucket: "student-erp-77605.firebasestorage.app",
    messagingSenderId: "734576815247",
    appId: "1:734576815247:web:70afe502f427337cbad4fa",
    measurementId: "G-N8F1GHBW55"
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// ===== Collections (shared with the old Chess Club tab, plus one new one) =====
const usersCollection = collection(db, "users");
const chessMembersCollection = collection(db, "chessClubMembers");
const chessChallengesCollection = collection(db, "chessChallenges");
const chessActivityCollection = collection(db, "chessActivity");
const chessGamesCollection = collection(db, "chessGames");
const chessMatchmakingCollection = collection(db, "chessMatchmaking");

const PIECE_GLYPHS = {
    w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
    b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
};
const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
const RATING_K = 32;

// ---------------- CORE GAME STATE ----------------
let game = null;
let boardFlipped = false;
let selectedSquare = null;
let legalTargets = [];
let lastMove = null; // { from, to }
let pendingPromotion = null; // { from, to }

let whiteMs = 0, blackMs = 0, incrementMs = 0;
let clockTimer = null;
let clockRunningColor = null; // 'w' | 'b' | null
let gameOver = false;

// ---------------- PHASE 2 STATE ----------------
let currentUid = null;
let currentAuthUser = null;
let gameMode = null; // null | 'local' | 'online'
let setupModalMode = 'local'; // 'local' | 'online'

let myProfile = { name: 'Player', rating: 1200, wins: 0, losses: 0, draws: 0 };
let membersCache = []; // other players, for the challenge modal
let incomingChallenges = [];
let outgoingChallenges = [];
let joinedGameIds = new Set();
let resumableGameId = null;

let unsubOwnProfile = null;
let unsubMembers = null;
let unsubIncoming = null;
let unsubOutgoing = null;
let unsubMatchQueue = null;
let unsubOwnQueueDoc = null;
let unsubGameDoc = null;

let onlineGameId = null;
let onlineMyColor = null; // 'w' | 'b'
let onlineData = null; // last raw snapshot data for the active game
let onlineOrientationSet = false;
let onlineClockTimer = null;
let timeoutHandledForGame = null;
let matchmakingBusy = false;

// ---------------- AUTH GATE ----------------
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentAuthUser = user;
        currentUid = user.uid;
        document.getElementById('gateScreen').style.display = 'none';
        document.getElementById('chessApp').style.display = 'flex';
        document.getElementById('playerNameLabel').textContent = user.displayName || user.email || 'Player';
        await ensureChessProfile(user);
        initHome();
        subscribeOwnProfile();
        subscribeMembers();
        subscribeChallenges();
    } else {
        document.getElementById('gateTitle').textContent = "You're not logged in";
        document.getElementById('gateMessage').textContent = 'Log in to Ledger first, then open Chess again.';
        document.getElementById('gateBackLink').style.display = 'inline-flex';
    }
});

// ---------------- CHESS PROFILE (chessClubMembers) ----------------
async function ensureChessProfile(user) {
    try {
        const memberRef = doc(chessMembersCollection, user.uid);
        const memberSnap = await getDoc(memberRef);
        if (!memberSnap.exists()) {
            let extra = { name: user.displayName || user.email || 'Player', username: '', branch: '', section: '' };
            try {
                const uSnap = await getDoc(doc(usersCollection, user.uid));
                if (uSnap.exists()) {
                    const d = uSnap.data();
                    extra = { name: d.name || extra.name, username: d.username || '', branch: d.branchId || '', section: d.section || '' };
                }
            } catch (e) { /* fine, fall back to auth profile */ }
            await setDoc(memberRef, {
                uid: user.uid,
                name: extra.name,
                username: extra.username,
                branch: extra.branch,
                section: extra.section,
                joinedAt: serverTimestamp(),
                rating: 1200,
                wins: 0,
                losses: 0,
                draws: 0
            });
        }
    } catch (e) {
        console.warn('Could not ensure chess profile', e);
    }
}

function subscribeOwnProfile() {
    if (unsubOwnProfile) unsubOwnProfile();
    unsubOwnProfile = onSnapshot(doc(chessMembersCollection, currentUid), (snap) => {
        if (!snap.exists()) return;
        const d = snap.data();
        myProfile = { name: d.name || 'Player', rating: d.rating ?? 1200, wins: d.wins || 0, losses: d.losses || 0, draws: d.draws || 0 };
        document.getElementById('ratingChip').textContent = 'Rating ' + myProfile.rating;
        document.getElementById('statRating').textContent = myProfile.rating;
        document.getElementById('statGames').textContent = myProfile.wins + myProfile.losses + myProfile.draws;
        document.getElementById('statWins').textContent = myProfile.wins;
        document.getElementById('statLosses').textContent = myProfile.losses;
    });
}

function subscribeMembers() {
    if (unsubMembers) unsubMembers();
    unsubMembers = onSnapshot(chessMembersCollection, (snap) => {
        membersCache = snap.docs
            .map(d => ({ uid: d.id, ...d.data() }))
            .filter(m => m.uid !== currentUid);
        renderChallengeMemberList();
    });
}

// ---------------- HOME ----------------
const QUICK_TCS = [
    { label: '1 + 0', base: 60, inc: 0 },
    { label: '3 + 0', base: 180, inc: 0 },
    { label: '3 + 2', base: 180, inc: 2 },
    { label: '5 + 0', base: 300, inc: 0 },
    { label: '10 + 5', base: 600, inc: 5 },
    { label: '15 + 10', base: 900, inc: 10 },
];

function initHome() {
    const grid = document.getElementById('quickTcGrid');
    grid.innerHTML = QUICK_TCS.map((tc) =>
        `<button class="tc-chip" onclick="quickStart(${tc.base},${tc.inc})">${tc.label}</button>`
    ).join('');
    document.getElementById('ratingChip').textContent = 'Rating ' + myProfile.rating;
    checkResumableGame();
}
window.quickStart = function (base, inc) {
    beginLocalGame(base, inc);
};

// ---------------- SETUP MODAL (shared by Local + Online) ----------------
window.openSetupModal = function () {
    setupModalMode = 'local';
    document.getElementById('setupModalTitle').textContent = 'New local game';
    document.getElementById('setupModalConfirmBtn').textContent = 'Start game';
    document.getElementById('setupModal').classList.add('open');
};
window.openOnlineSetupModal = function () {
    if (resumableGameId) { showChessToast('Finish your game in progress first.'); return; }
    setupModalMode = 'online';
    document.getElementById('setupModalTitle').textContent = 'Play online — pick a time control';
    document.getElementById('setupModalConfirmBtn').textContent = 'Find opponent';
    document.getElementById('setupModal').classList.add('open');
};
window.closeSetupModal = function () {
    document.getElementById('setupModal').classList.remove('open');
};
document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'setupTimeControl') {
        document.getElementById('customTcRow').style.display = e.target.value === 'custom' ? 'flex' : 'none';
    }
});
window.confirmSetup = function () {
    const sel = document.getElementById('setupTimeControl').value;
    let base, inc;
    if (sel === 'custom') {
        base = Math.max(1, parseInt(document.getElementById('customMinutes').value || '10', 10)) * 60;
        inc = Math.max(0, parseInt(document.getElementById('customIncrement').value || '0', 10));
    } else {
        [base, inc] = sel.split('-').map(Number);
    }
    closeSetupModal();
    if (setupModalMode === 'online') {
        startMatchmaking(base, inc);
    } else {
        beginLocalGame(base, inc);
    }
};

// ---------------- TOAST ----------------
function showChessToast(msg) {
    let el = document.getElementById('chessToast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'chessToast';
        el.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:var(--ink);color:var(--paper-raised);padding:10px 18px;border-radius:20px;font-size:13px;box-shadow:var(--shadow);z-index:999;opacity:0;transition:opacity .2s;pointer-events:none;';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, 2600);
}

// ================================================================
// LOCAL GAME LIFECYCLE (Phase 1, unchanged behavior)
// ================================================================
function beginLocalGame(baseSeconds, incSeconds) {
    teardownOnlineGame();
    gameMode = 'local';
    game = new Chess();
    boardFlipped = false;
    selectedSquare = null;
    legalTargets = [];
    lastMove = null;
    pendingPromotion = null;
    gameOver = false;
    onlineOrientationSet = false;

    whiteMs = baseSeconds * 1000;
    blackMs = baseSeconds * 1000;
    incrementMs = incSeconds * 1000;

    document.getElementById('whiteNameLabel').textContent = 'White';
    document.getElementById('blackNameLabel').textContent = 'Black';
    document.getElementById('drawOfferBanner').style.display = 'none';

    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('statusLine').className = 'status-line';
    document.getElementById('statusLine').textContent = 'White to move.';

    renderBoard();
    renderMoveList();
    renderCaptures();
    renderClocks();
    startClock('w');
}

window.backToHome = function () {
    stopClock();
    if (gameMode === 'online') teardownOnlineGame();
    gameMode = null;
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('homeScreen').style.display = 'block';
    checkResumableGame();
};

// ---------------- CLOCK (local hotseat) ----------------
function startClock(color) {
    stopClock();
    clockRunningColor = color;
    let last = Date.now();
    clockTimer = setInterval(() => {
        const now = Date.now();
        const elapsed = now - last;
        last = now;
        if (gameOver) { stopClock(); return; }
        if (clockRunningColor === 'w') {
            whiteMs = Math.max(0, whiteMs - elapsed);
            if (whiteMs === 0) { endLocalGame('timeout', 'b'); return; }
        } else {
            blackMs = Math.max(0, blackMs - elapsed);
            if (blackMs === 0) { endLocalGame('timeout', 'w'); return; }
        }
        renderClocks();
    }, 200);
}
function stopClock() {
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = null;
}
function switchClock(movedColor) {
    if (movedColor === 'w') whiteMs += incrementMs; else blackMs += incrementMs;
    startClock(movedColor === 'w' ? 'b' : 'w');
    renderClocks();
}
function fmtClock(ms) {
    const totalSec = Math.ceil(Math.max(0, ms) / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}
function renderClocks() {
    const whiteEl = document.getElementById('whiteClock');
    const blackEl = document.getElementById('blackClock');
    whiteEl.textContent = fmtClock(whiteMs);
    blackEl.textContent = fmtClock(blackMs);
    whiteEl.classList.toggle('low-time', whiteMs <= 20000);
    blackEl.classList.toggle('low-time', blackMs <= 20000);
    document.getElementById('bottomPlayerStrip').classList.toggle('turn-active', game && game.turn() === (boardFlipped ? 'b' : 'w'));
    document.getElementById('topPlayerStrip').classList.toggle('turn-active', game && game.turn() === (boardFlipped ? 'w' : 'b'));
}

// ---------------- BOARD RENDERING (shared local + online) ----------------
const FILES = ['a','b','c','d','e','f','g','h'];
const RANKS = ['1','2','3','4','5','6','7','8'];

function squareId(file, rank) { return file + rank; }

function renderBoard() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    const filesOrder = boardFlipped ? [...FILES].reverse() : FILES;
    const ranksOrder = boardFlipped ? [...RANKS] : [...RANKS].reverse();

    const boardState = game.board(); // 8x8, [0]=rank8..[7]=rank1

    ranksOrder.forEach((rank) => {
        filesOrder.forEach((file) => {
            const sq = document.createElement('div');
            const fileIdx = FILES.indexOf(file);
            const rankIdx = RANKS.indexOf(rank);
            const isLight = (fileIdx + rankIdx) % 2 === 1;
            sq.className = 'sq ' + (isLight ? 'light' : 'dark');
            const id = squareId(file, rank);
            sq.dataset.square = id;

            if (lastMove && (id === lastMove.from || id === lastMove.to)) sq.classList.add('last-move');
            if (selectedSquare === id) sq.classList.add('selected');

            if (rank === (boardFlipped ? '8' : '1')) {
                const f = document.createElement('span');
                f.className = 'coord-file'; f.textContent = file;
                sq.appendChild(f);
            }
            if (file === (boardFlipped ? 'h' : 'a')) {
                const r = document.createElement('span');
                r.className = 'coord-rank'; r.textContent = rank;
                sq.appendChild(r);
            }

            const rowIdx = 8 - Number(rank);
            const colIdx = FILES.indexOf(file);
            const cell = boardState[rowIdx][colIdx];
            if (cell) {
                const p = document.createElement('div');
                p.className = 'piece';
                p.textContent = PIECE_GLYPHS[cell.color][cell.type];
                p.draggable = canInteract();
                p.dataset.square = id;
                p.addEventListener('dragstart', onDragStart);
                p.addEventListener('dragend', onDragEnd);
                sq.appendChild(p);
            }

            if (legalTargets.includes(id)) {
                const occupied = !!cell;
                const marker = document.createElement('div');
                marker.className = occupied ? 'capture-ring' : 'move-dot';
                sq.appendChild(marker);
            }

            if (game.inCheck() && cell && cell.type === 'k' && cell.color === game.turn()) {
                sq.classList.add('in-check');
            }

            sq.addEventListener('click', () => onSquareClick(id));
            sq.addEventListener('dragover', (e) => e.preventDefault());
            sq.addEventListener('drop', (e) => onDrop(e, id));

            board.appendChild(sq);
        });
    });
}

// It's my turn to move a piece, in whichever mode we're in.
function canInteract() {
    if (gameOver || !game) return false;
    if (gameMode === 'online') return game.turn() === onlineMyColor;
    return true;
}

// ---------------- INTERACTION ----------------
function onSquareClick(id) {
    if (!canInteract()) return;
    if (selectedSquare) {
        if (legalTargets.includes(id)) {
            attemptMove(selectedSquare, id);
            return;
        }
        const piece = game.get(id);
        if (piece && piece.color === game.turn()) {
            selectSquare(id);
        } else {
            clearSelection();
        }
    } else {
        const piece = game.get(id);
        if (piece && piece.color === game.turn()) selectSquare(id);
    }
}
function selectSquare(id) {
    selectedSquare = id;
    legalTargets = game.moves({ square: id, verbose: true }).map(m => m.to);
    renderBoard();
}
function clearSelection() {
    selectedSquare = null;
    legalTargets = [];
    renderBoard();
}

let dragSourceSquare = null;
function onDragStart(e) {
    if (!canInteract()) { e.preventDefault(); return; }
    const id = e.target.dataset.square;
    const piece = game.get(id);
    if (!piece || piece.color !== game.turn()) { e.preventDefault(); return; }
    dragSourceSquare = id;
    selectSquare(id);
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
}
function onDragEnd(e) {
    e.target.classList.remove('dragging');
}
function onDrop(e, targetId) {
    e.preventDefault();
    if (!dragSourceSquare) return;
    if (legalTargets.includes(targetId)) {
        attemptMove(dragSourceSquare, targetId);
    } else {
        clearSelection();
    }
    dragSourceSquare = null;
}

function attemptMove(from, to) {
    const piece = game.get(from);
    const isPromotion = piece && piece.type === 'p' && (to[1] === '8' || to[1] === '1');
    if (isPromotion) {
        pendingPromotion = { from, to };
        openPromoModal(piece.color);
        return;
    }
    doMove(from, to, null);
}

function doMove(from, to, promotion) {
    if (gameMode === 'online') {
        doOnlineMove(from, to, promotion);
        return;
    }
    const move = game.move({ from, to, promotion: promotion || undefined });
    if (!move) { clearSelection(); return; }
    lastMove = { from, to };
    selectedSquare = null;
    legalTargets = [];
    switchClock(move.color);
    renderBoard();
    renderMoveList();
    renderCaptures();
    checkLocalGameEnd();
}

// ---------------- PROMOTION ----------------
function openPromoModal(color) {
    const choices = document.getElementById('promoChoices');
    const options = ['q', 'r', 'b', 'n'];
    choices.innerHTML = options.map(o =>
        `<button onclick="resolvePromotion('${o}')">${PIECE_GLYPHS[color][o]}</button>`
    ).join('');
    document.getElementById('promoModal').classList.add('open');
}
window.resolvePromotion = function (piece) {
    document.getElementById('promoModal').classList.remove('open');
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    pendingPromotion = null;
    doMove(from, to, piece);
};

// ---------------- MOVE LIST / PGN / FEN ----------------
function renderMoveList() {
    const history = game.history();
    const list = document.getElementById('moveList');
    let html = '';
    for (let i = 0; i < history.length; i += 2) {
        const num = i / 2 + 1;
        const white = history[i] || '';
        const black = history[i + 1] || '';
        const isLastWhite = i === history.length - 1;
        const isLastBlack = i + 1 === history.length - 1;
        html += `<div class="mv-num">${num}.</div><div class="mv-white${isLastWhite ? ' current' : ''}">${white}</div><div class="mv-black${isLastBlack ? ' current' : ''}">${black}</div>`;
    }
    list.innerHTML = html;
    list.scrollTop = list.scrollHeight;
    document.getElementById('pgnBox').textContent = game.pgn() || '—';
}

window.copyPgn = function () {
    navigator.clipboard.writeText(game.pgn() || '');
};
window.copyFen = function () {
    navigator.clipboard.writeText(game.fen());
};

// ---------------- CAPTURES ----------------
function renderCaptures() {
    const history = game.history({ verbose: true });
    const captured = { w: [], b: [] };
    history.forEach(m => {
        if (m.captured) {
            const capturerColor = m.color;
            captured[capturerColor].push(m.captured);
        }
    });
    const renderSide = (arr, color) => arr
        .sort((a, b) => PIECE_VALUE[b] - PIECE_VALUE[a])
        .map(t => PIECE_GLYPHS[color === 'w' ? 'b' : 'w'][t])
        .join(' ');
    document.getElementById('whiteCaptures').textContent = renderSide(captured.w, 'w');
    document.getElementById('blackCaptures').textContent = renderSide(captured.b, 'b');
}

// ---------------- BOARD FLIP ----------------
window.flipBoard = function () {
    boardFlipped = !boardFlipped;
    renderBoard();
};

// ---------------- LOCAL GAME END (Phase 1, not rated) ----------------
function checkLocalGameEnd() {
    if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'b' : 'w';
        endLocalGame('checkmate', winner);
    } else if (game.isStalemate()) {
        endLocalGame('stalemate', null);
    } else if (game.isThreefoldRepetition()) {
        endLocalGame('repetition', null);
    } else if (game.isInsufficientMaterial()) {
        endLocalGame('insufficient', null);
    } else if (game.isDrawByFiftyMoves ? game.isDrawByFiftyMoves() : false) {
        endLocalGame('fifty-move', null);
    } else {
        const turnLabel = game.turn() === 'w' ? 'White' : 'Black';
        const checkNote = game.inCheck() ? ' — check!' : '';
        setStatus(`${turnLabel} to move${checkNote}`, game.inCheck());
    }
}

const REASON_LABEL = {
    checkmate: 'Checkmate',
    stalemate: 'Stalemate',
    repetition: 'Draw — threefold repetition',
    insufficient: 'Draw — insufficient material',
    'fifty-move': 'Draw — fifty-move rule',
    resignation: 'Resignation',
    agreement: 'Draw by agreement',
    timeout: 'Timeout'
};

function renderResultCard(reason, winnerColor) {
    let title, sub;
    if (winnerColor) {
        title = `${winnerColor === 'w' ? 'White' : 'Black'} wins`;
        sub = REASON_LABEL[reason] || reason;
    } else {
        title = 'Draw';
        sub = REASON_LABEL[reason] || reason;
    }
    const card = document.getElementById('resultCard');
    card.style.display = 'block';
    card.innerHTML = `<div class="result-banner"><div class="result-title">${title}</div><div class="result-sub">${sub}</div></div>`;
    setStatus(`Game over — ${title.toLowerCase()} (${sub.toLowerCase()}).`, true);
}

window.offerResign = function () {
    if (gameOver || !game) return;
    if (gameMode === 'online') {
        if (!confirm('Resign this game?')) return;
        const winner = onlineMyColor === 'w' ? 'b' : 'w';
        finishOnlineGame(onlineGameId, 'resignation', winner);
        return;
    }
    if (!confirm('Resign this game?')) return;
    const resigningColor = game.turn();
    endLocalGame('resignation', resigningColor === 'w' ? 'b' : 'w');
};
window.offerDraw = function () {
    if (gameOver || !game) return;
    if (gameMode === 'online') {
        if (onlineData && onlineData.drawOffer && onlineData.drawOffer.by === currentUid) {
            showChessToast('Draw offer already sent.');
            return;
        }
        updateDoc(doc(chessGamesCollection, onlineGameId), { drawOffer: { by: currentUid } }).catch(() => {});
        showChessToast('Draw offer sent.');
        return;
    }
    if (!confirm('Both players agree to a draw?')) return;
    endLocalGame('agreement', null);
};
window.acceptDrawOffer = function () {
    if (gameMode !== 'online' || !onlineGameId) return;
    finishOnlineGame(onlineGameId, 'agreement', null);
};
window.declineDrawOffer = function () {
    if (gameMode !== 'online' || !onlineGameId) return;
    updateDoc(doc(chessGamesCollection, onlineGameId), { drawOffer: null }).catch(() => {});
};

function endLocalGame(reason, winnerColor) {
    if (gameOver) return;
    gameOver = true;
    stopClock();
    renderResultCard(reason, winnerColor);
}

function setStatus(text, important) {
    const el = document.getElementById('statusLine');
    el.textContent = text;
    el.className = 'status-line' + (important ? ' important' : '');
}

// ================================================================
// PHASE 2 — CHALLENGES
// ================================================================
function subscribeChallenges() {
    if (unsubIncoming) unsubIncoming();
    if (unsubOutgoing) unsubOutgoing();
    unsubIncoming = onSnapshot(query(chessChallengesCollection, where('opponentUid', '==', currentUid)), (snap) => {
        incomingChallenges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        refreshChallengesUI();
    });
    unsubOutgoing = onSnapshot(query(chessChallengesCollection, where('challengerUid', '==', currentUid)), (snap) => {
        outgoingChallenges = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        refreshChallengesUI();
        checkAutoJoinAcceptedChallenge();
    });
}

function refreshChallengesUI() {
    const pendingIncoming = incomingChallenges.filter(c => c.status === 'pending');
    const activeOutgoing = outgoingChallenges.filter(c => c.status === 'pending' || c.status === 'accepted');

    const dot = document.getElementById('challengeBellDot');
    const bell = document.getElementById('challengeBell');
    if (bell) bell.style.display = 'inline-flex';
    if (dot) dot.classList.toggle('show', pendingIncoming.length > 0);

    const section = document.getElementById('challengesSection');
    const panel = document.getElementById('challengesPanel');
    const all = [...pendingIncoming.map(c => ({ ...c, direction: 'incoming' })), ...activeOutgoing.map(c => ({ ...c, direction: 'outgoing' }))];
    if (!panel) return;
    if (all.length === 0) {
        section.style.display = 'none';
        panel.innerHTML = '';
        return;
    }
    section.style.display = 'block';
    panel.innerHTML = all.map(c => renderChallengeCard(c)).join('');

    renderChallengeInboxList();
}

function tcLabel(tc) {
    if (!tc) return '';
    return `${Math.round(tc.base / 60)} + ${tc.inc}`;
}

function renderChallengeCard(c) {
    if (c.direction === 'incoming') {
        return `<div class="challenge-card">
            <div class="c-info"><strong>${escapeHtml(c.challengerName || 'A player')}</strong> challenged you · ${tcLabel(c.timeControl)}<div class="c-status">Pending</div></div>
            <div class="c-actions">
                <button class="btn-primary" style="flex:none;" onclick="respondToChallenge('${c.id}','accept')">Accept</button>
                <button class="btn-secondary" style="flex:none;" onclick="respondToChallenge('${c.id}','decline')">Decline</button>
            </div>
        </div>`;
    }
    const statusLabel = c.status === 'accepted' ? 'Accepted — joining…' : 'Waiting for response';
    return `<div class="challenge-card">
        <div class="c-info">You challenged <strong>${escapeHtml(c.opponentName || 'a player')}</strong> · ${tcLabel(c.timeControl)}<div class="c-status">${statusLabel}</div></div>
        <div class="c-actions">${c.status === 'pending' ? `<button class="btn-secondary" style="flex:none;" onclick="respondToChallenge('${c.id}','cancel')">Cancel</button>` : ''}</div>
    </div>`;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

window.openChallengeInbox = function () {
    renderChallengeInboxList();
    document.getElementById('challengeInboxModal').classList.add('open');
};
window.closeChallengeInbox = function () {
    document.getElementById('challengeInboxModal').classList.remove('open');
};
function renderChallengeInboxList() {
    const el = document.getElementById('challengeInboxList');
    if (!el) return;
    const pendingIncoming = incomingChallenges.filter(c => c.status === 'pending');
    const activeOutgoing = outgoingChallenges.filter(c => c.status === 'pending' || c.status === 'accepted');
    const all = [...pendingIncoming.map(c => ({ ...c, direction: 'incoming' })), ...activeOutgoing.map(c => ({ ...c, direction: 'outgoing' }))];
    el.innerHTML = all.length ? all.map(c => renderChallengeCard(c)).join('') : `<div class="empty-note-chess">No pending challenges.</div>`;
}

window.openChallengeModal = function () {
    document.getElementById('challengeSearchInput').value = '';
    renderChallengeMemberList();
    document.getElementById('challengeModal').classList.add('open');
};
window.closeChallengeModal = function () {
    document.getElementById('challengeModal').classList.remove('open');
};

window.renderChallengeMemberList = function () {
    const list = document.getElementById('challengeMemberList');
    if (!list) return;
    const q = (document.getElementById('challengeSearchInput')?.value || '').trim().toLowerCase();
    const filtered = membersCache.filter(m => !q || (m.name || '').toLowerCase().includes(q) || (m.username || '').toLowerCase().includes(q));
    if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-note-chess">No players found.</div>`;
        return;
    }
    const pendingUids = new Set(outgoingChallenges.filter(c => c.status === 'pending').map(c => c.opponentUid));
    list.innerHTML = filtered
        .sort((a, b) => (b.rating || 1200) - (a.rating || 1200))
        .map(m => {
            const isPending = pendingUids.has(m.uid);
            return `<div class="member-row${isPending ? ' pending' : ''}">
                <div class="m-info"><span class="m-name">${escapeHtml(m.name || 'Player')}</span><span class="m-rating">Rating ${m.rating ?? 1200}</span></div>
                <button class="btn-primary" ${isPending ? 'disabled' : ''} onclick="sendChallengeTo('${m.uid}', '${escapeHtml(m.name || 'Player').replace(/'/g, "\\'")}')">${isPending ? 'Pending' : 'Challenge'}</button>
            </div>`;
        }).join('');
};

window.sendChallengeTo = async function (opponentUid, opponentName) {
    if (resumableGameId) { showChessToast('Finish your game in progress first.'); return; }
    if (outgoingChallenges.some(c => c.opponentUid === opponentUid && c.status === 'pending')) {
        showChessToast('You already have a pending challenge with them.');
        return;
    }
    const sel = document.getElementById('challengeTimeControl').value;
    const [base, inc] = sel.split('-').map(Number);
    try {
        await addDoc(chessChallengesCollection, {
            challengerUid: currentUid,
            challengerName: myProfile.name,
            opponentUid,
            opponentName,
            status: 'pending',
            timeControl: { base, inc },
            createdAt: serverTimestamp()
        });
        addDoc(chessActivityCollection, {
            type: 'challenge',
            uid: currentUid,
            name: myProfile.name,
            message: `${myProfile.name} challenged ${opponentName}`,
            createdAt: serverTimestamp()
        }).catch(() => {});
        showChessToast('Challenge sent to ' + opponentName + '.');
        renderChallengeMemberList();
    } catch (e) {
        showChessToast('Could not send challenge.');
    }
};

window.respondToChallenge = async function (challengeId, action) {
    const challengeRef = doc(chessChallengesCollection, challengeId);
    try {
        if (action === 'decline' || action === 'cancel') {
            await updateDoc(challengeRef, { status: action === 'decline' ? 'declined' : 'cancelled' });
            return;
        }
        if (action === 'accept') {
            if (resumableGameId) { showChessToast('Finish your game in progress first.'); return; }
            const snap = await getDoc(challengeRef);
            if (!snap.exists()) return;
            const c = snap.data();
            const gameId = await createGameFromChallenge(c);
            await updateDoc(challengeRef, { status: 'accepted', gameId });
            addDoc(chessActivityCollection, {
                type: 'challenge_response',
                uid: currentUid,
                name: myProfile.name,
                message: `${myProfile.name} accepted a challenge from ${c.challengerName}`,
                createdAt: serverTimestamp()
            }).catch(() => {});
            joinedGameIds.add(gameId);
            joinOnlineGame(gameId);
        }
    } catch (e) {
        showChessToast('Something went wrong with that challenge.');
    }
};

async function createGameFromChallenge(challenge) {
    const flip = Math.random() < 0.5;
    const whiteUid = flip ? challenge.challengerUid : challenge.opponentUid;
    const whiteName = flip ? challenge.challengerName : challenge.opponentName;
    const blackUid = flip ? challenge.opponentUid : challenge.challengerUid;
    const blackName = flip ? challenge.opponentName : challenge.challengerName;
    const base = challenge.timeControl?.base ?? 300;
    const inc = challenge.timeControl?.inc ?? 0;
    const ref = await addDoc(chessGamesCollection, {
        whiteUid, whiteName, blackUid, blackName,
        timeControl: { base, inc },
        fen: new Chess().fen(),
        pgn: '',
        turn: 'w',
        whiteMs: base * 1000,
        blackMs: base * 1000,
        lastMove: null,
        lastMoveAt: serverTimestamp(),
        status: 'active',
        drawOffer: null,
        source: 'challenge',
        createdAt: serverTimestamp()
    });
    return ref.id;
}

function checkAutoJoinAcceptedChallenge() {
    if (gameMode === 'online') return;
    const c = outgoingChallenges.find(c => c.status === 'accepted' && c.gameId && !joinedGameIds.has(c.gameId));
    if (c) {
        joinedGameIds.add(c.gameId);
        joinOnlineGame(c.gameId);
    }
}

// ================================================================
// PHASE 2 — QUICK-PLAY MATCHMAKING
// ================================================================
function startMatchmaking(base, inc) {
    if (resumableGameId) { showChessToast('Finish your game in progress first.'); return; }
    document.getElementById('searchingModal').classList.add('open');
    document.getElementById('searchingSub').textContent = `Matching you at ${Math.round(base / 60)} + ${inc}…`;

    const myQueueRef = doc(chessMatchmakingCollection, currentUid);
    setDoc(myQueueRef, {
        uid: currentUid, name: myProfile.name, rating: myProfile.rating,
        base, inc, status: 'waiting', gameId: null, createdAt: serverTimestamp()
    }).then(() => {
        if (unsubOwnQueueDoc) unsubOwnQueueDoc();
        unsubOwnQueueDoc = onSnapshot(myQueueRef, (snap) => {
            if (!snap.exists()) return;
            const d = snap.data();
            if (d.status === 'matched' && d.gameId) {
                document.getElementById('searchingModal').classList.remove('open');
                stopMatchmakingListeners();
                deleteDoc(myQueueRef).catch(() => {});
                joinedGameIds.add(d.gameId);
                joinOnlineGame(d.gameId);
            }
        });

        if (unsubMatchQueue) unsubMatchQueue();
        unsubMatchQueue = onSnapshot(
            query(chessMatchmakingCollection, where('status', '==', 'waiting'), where('base', '==', base), where('inc', '==', inc)),
            (snap) => {
                const candidates = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(d => d.uid !== currentUid);
                tryClaimMatch(candidates, base, inc);
            }
        );
    }).catch(() => {
        document.getElementById('searchingModal').classList.remove('open');
        showChessToast('Could not start matchmaking.');
    });
}

async function tryClaimMatch(candidates, base, inc) {
    if (matchmakingBusy || candidates.length === 0) return;
    matchmakingBusy = true;
    for (const candidate of candidates) {
        try {
            await runTransaction(db, async (tx) => {
                const meRef = doc(chessMatchmakingCollection, currentUid);
                const oppRef = doc(chessMatchmakingCollection, candidate.uid);
                const meSnap = await tx.get(meRef);
                const oppSnap = await tx.get(oppRef);
                if (!meSnap.exists() || meSnap.data().status !== 'waiting') throw new Error('self-unavailable');
                if (!oppSnap.exists() || oppSnap.data().status !== 'waiting') throw new Error('opponent-unavailable');
                const me = meSnap.data();
                const opp = oppSnap.data();
                const gameRef = doc(chessGamesCollection);
                const flip = Math.random() < 0.5;
                const whiteUid = flip ? currentUid : candidate.uid;
                const whiteName = flip ? me.name : opp.name;
                const blackUid = flip ? candidate.uid : currentUid;
                const blackName = flip ? opp.name : me.name;
                tx.set(gameRef, {
                    whiteUid, whiteName, blackUid, blackName,
                    timeControl: { base, inc },
                    fen: new Chess().fen(),
                    pgn: '',
                    turn: 'w',
                    whiteMs: base * 1000,
                    blackMs: base * 1000,
                    lastMove: null,
                    lastMoveAt: serverTimestamp(),
                    status: 'active',
                    drawOffer: null,
                    source: 'online',
                    createdAt: serverTimestamp()
                });
                tx.update(meRef, { status: 'matched', gameId: gameRef.id });
                tx.update(oppRef, { status: 'matched', gameId: gameRef.id });
            });
            break; // matched — the onSnapshot on our own queue doc will pick it up
        } catch (e) {
            // this candidate was claimed by someone else, or we're no longer waiting; try the next one
        }
    }
    matchmakingBusy = false;
}

function stopMatchmakingListeners() {
    if (unsubOwnQueueDoc) { unsubOwnQueueDoc(); unsubOwnQueueDoc = null; }
    if (unsubMatchQueue) { unsubMatchQueue(); unsubMatchQueue = null; }
}

window.cancelMatchmaking = function () {
    document.getElementById('searchingModal').classList.remove('open');
    stopMatchmakingListeners();
    deleteDoc(doc(chessMatchmakingCollection, currentUid)).catch(() => {});
};

// ================================================================
// PHASE 2 — ONLINE GAME (Firestore-synced)
// ================================================================
function joinOnlineGame(gameId) {
    stopClock();
    if (unsubGameDoc) unsubGameDoc();
    stopOnlineClockTimer();

    gameMode = 'online';
    onlineGameId = gameId;
    onlineOrientationSet = false;
    timeoutHandledForGame = null;
    selectedSquare = null;
    legalTargets = [];
    pendingPromotion = null;

    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('drawOfferBanner').style.display = 'none';

    unsubGameDoc = onSnapshot(doc(chessGamesCollection, gameId), applyGameSnapshot, () => {
        showChessToast('Lost connection to the game.');
    });
}

function teardownOnlineGame() {
    if (unsubGameDoc) { unsubGameDoc(); unsubGameDoc = null; }
    stopOnlineClockTimer();
    onlineGameId = null;
    onlineMyColor = null;
    onlineData = null;
}

function applyGameSnapshot(snap) {
    if (!snap.exists()) {
        showChessToast('That game no longer exists.');
        backToHome();
        return;
    }
    const data = snap.data();
    onlineData = data;
    onlineMyColor = data.whiteUid === currentUid ? 'w' : 'b';

    const g = new Chess();
    if (data.pgn) {
        try { g.loadPgn(data.pgn); } catch (e) { g.load(data.fen); }
    } else if (data.fen) {
        try { g.load(data.fen); } catch (e) { /* fresh game */ }
    }
    game = g;
    lastMove = data.lastMove || null;
    gameOver = data.status === 'finished';

    if (!onlineOrientationSet) {
        boardFlipped = onlineMyColor === 'b';
        onlineOrientationSet = true;
    }

    document.getElementById('whiteNameLabel').textContent = data.whiteName + (onlineMyColor === 'w' ? ' (You)' : '');
    document.getElementById('blackNameLabel').textContent = data.blackName + (onlineMyColor === 'b' ? ' (You)' : '');

    selectedSquare = null;
    legalTargets = [];
    renderBoard();
    renderMoveList();
    renderCaptures();
    renderOnlineClocksTick();
    updateDrawOfferUI(data);

    if (data.status === 'finished') {
        stopOnlineClockTimer();
        renderResultCard(data.reason, data.winnerColor);
    } else {
        startOnlineClockTimer();
        const turnLabel = data.turn === 'w' ? 'White' : 'Black';
        const yourTurn = data.turn === onlineMyColor;
        const checkNote = game.inCheck() ? ' — check!' : '';
        setStatus(`${yourTurn ? 'Your move' : turnLabel + ' to move'}${checkNote}`, game.inCheck());
    }
}

function updateDrawOfferUI(data) {
    const banner = document.getElementById('drawOfferBanner');
    const text = document.getElementById('drawOfferText');
    const actions = document.getElementById('drawOfferActions');
    if (!data.drawOffer || data.status === 'finished') {
        banner.style.display = 'none';
        return;
    }
    banner.style.display = 'block';
    if (data.drawOffer.by === currentUid) {
        text.textContent = 'Draw offer sent — waiting for a response.';
        actions.innerHTML = '';
    } else {
        text.textContent = 'Your opponent offers a draw.';
        actions.innerHTML = `<button class="btn-primary" onclick="acceptDrawOffer()">Accept</button><button class="btn-secondary" onclick="declineDrawOffer()">Decline</button>`;
    }
}

function startOnlineClockTimer() {
    stopOnlineClockTimer();
    onlineClockTimer = setInterval(renderOnlineClocksTick, 200);
}
function stopOnlineClockTimer() {
    if (onlineClockTimer) clearInterval(onlineClockTimer);
    onlineClockTimer = null;
}
function renderOnlineClocksTick() {
    if (!onlineData) return;
    const data = onlineData;
    const lastMoveAtMs = data.lastMoveAt && data.lastMoveAt.toMillis ? data.lastMoveAt.toMillis() : Date.now();
    let wMs = data.whiteMs ?? 0;
    let bMs = data.blackMs ?? 0;
    if (data.status === 'active') {
        const elapsed = Math.max(0, Date.now() - lastMoveAtMs);
        if (data.turn === 'w') wMs = Math.max(0, wMs - elapsed);
        else bMs = Math.max(0, bMs - elapsed);
    }
    whiteMs = wMs; blackMs = bMs;
    renderClocks();

    if (data.status === 'active' && timeoutHandledForGame !== onlineGameId) {
        if (wMs <= 0) { timeoutHandledForGame = onlineGameId; finishOnlineGame(onlineGameId, 'timeout', 'b'); }
        else if (bMs <= 0) { timeoutHandledForGame = onlineGameId; finishOnlineGame(onlineGameId, 'timeout', 'w'); }
    }
}

function doOnlineMove(from, to, promotion) {
    if (!onlineData || onlineData.status !== 'active') return;
    if (game.turn() !== onlineMyColor) return;
    const move = game.move({ from, to, promotion: promotion || undefined });
    if (!move) { clearSelection(); return; }

    const lastMoveAtMs = onlineData.lastMoveAt && onlineData.lastMoveAt.toMillis ? onlineData.lastMoveAt.toMillis() : Date.now();
    const elapsed = Math.max(0, Date.now() - lastMoveAtMs);
    const incMs = (onlineData.timeControl?.inc || 0) * 1000;
    const myStoredMs = onlineMyColor === 'w' ? (onlineData.whiteMs ?? 0) : (onlineData.blackMs ?? 0);
    const myNewMs = Math.max(0, myStoredMs - elapsed) + incMs;

    const updateFields = {
        fen: game.fen(),
        pgn: game.pgn(),
        turn: game.turn(),
        lastMove: { from, to },
        lastMoveAt: serverTimestamp(),
        drawOffer: null,
        [onlineMyColor === 'w' ? 'whiteMs' : 'blackMs']: myNewMs
    };

    let endInfo = null;
    if (game.isCheckmate()) endInfo = { reason: 'checkmate', winnerColor: onlineMyColor };
    else if (game.isStalemate()) endInfo = { reason: 'stalemate', winnerColor: null };
    else if (game.isThreefoldRepetition()) endInfo = { reason: 'repetition', winnerColor: null };
    else if (game.isInsufficientMaterial()) endInfo = { reason: 'insufficient', winnerColor: null };
    else if (game.isDrawByFiftyMoves ? game.isDrawByFiftyMoves() : false) endInfo = { reason: 'fifty-move', winnerColor: null };
    else if (myNewMs <= 0) endInfo = { reason: 'timeout', winnerColor: onlineMyColor === 'w' ? 'b' : 'w' };

    lastMove = { from, to };
    selectedSquare = null;
    legalTargets = [];
    renderBoard();
    renderMoveList();
    renderCaptures();

    if (endInfo) {
        finishOnlineGame(onlineGameId, endInfo.reason, endInfo.winnerColor, updateFields);
    } else {
        updateDoc(doc(chessGamesCollection, onlineGameId), updateFields).catch(() => {
            showChessToast('Move failed to sync — check your connection.');
        });
    }
}

function finishOnlineGame(gameId, reason, winnerColor, extraFields) {
    const gameRef = doc(chessGamesCollection, gameId);
    runTransaction(db, async (tx) => {
        const gameSnap = await tx.get(gameRef);
        if (!gameSnap.exists()) return;
        const gdata = gameSnap.data();
        if (gdata.status === 'finished') return;

        const whiteRef = doc(chessMembersCollection, gdata.whiteUid);
        const blackRef = doc(chessMembersCollection, gdata.blackUid);
        const whiteSnap = await tx.get(whiteRef);
        const blackSnap = await tx.get(blackRef);
        const whiteRating = whiteSnap.exists() ? (whiteSnap.data().rating ?? 1200) : 1200;
        const blackRating = blackSnap.exists() ? (blackSnap.data().rating ?? 1200) : 1200;

        const scoreWhite = winnerColor === 'w' ? 1 : winnerColor === 'b' ? 0 : 0.5;
        const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
        const whiteDelta = Math.round(RATING_K * (scoreWhite - expectedWhite));
        const blackDelta = -whiteDelta;
        const resultField = winnerColor === 'w' ? 'win' : winnerColor === 'b' ? 'loss' : 'draw';

        tx.update(gameRef, {
            ...(extraFields || {}),
            status: 'finished',
            reason,
            winnerColor: winnerColor || null,
            result: resultField,
            whiteRatingChange: whiteDelta,
            blackRatingChange: blackDelta,
            ratingChange: whiteDelta,
            drawOffer: null,
            playedAt: serverTimestamp()
        });
        if (whiteSnap.exists()) {
            const wd = whiteSnap.data();
            tx.update(whiteRef, {
                rating: whiteRating + whiteDelta,
                wins: (wd.wins || 0) + (winnerColor === 'w' ? 1 : 0),
                losses: (wd.losses || 0) + (winnerColor === 'b' ? 1 : 0),
                draws: (wd.draws || 0) + (!winnerColor ? 1 : 0)
            });
        }
        if (blackSnap.exists()) {
            const bd = blackSnap.data();
            tx.update(blackRef, {
                rating: blackRating + blackDelta,
                wins: (bd.wins || 0) + (winnerColor === 'b' ? 1 : 0),
                losses: (bd.losses || 0) + (winnerColor === 'w' ? 1 : 0),
                draws: (bd.draws || 0) + (!winnerColor ? 1 : 0)
            });
        }
        return { whiteName: gdata.whiteName, blackName: gdata.blackName };
    }).then((info) => {
        if (!info) return;
        const label = winnerColor ? `${winnerColor === 'w' ? info.whiteName : info.blackName} won (${REASON_LABEL[reason] || reason}) vs ${winnerColor === 'w' ? info.blackName : info.whiteName}`
            : `${info.whiteName} and ${info.blackName} drew (${REASON_LABEL[reason] || reason})`;
        addDoc(chessActivityCollection, {
            type: 'game_result', uid: currentUid, name: myProfile.name,
            message: label, createdAt: serverTimestamp()
        }).catch(() => {});
    }).catch(() => { /* already finished or transient error — safe to ignore */ });
}

// ---------------- RESUME IN-PROGRESS GAME ----------------
async function checkResumableGame() {
    resumableGameId = null;
    document.getElementById('resumeGameBanner').style.display = 'none';
    if (!currentUid) return;
    try {
        const [whiteSnap, blackSnap] = await Promise.all([
            getDocs(query(chessGamesCollection, where('whiteUid', '==', currentUid), where('status', '==', 'active'))),
            getDocs(query(chessGamesCollection, where('blackUid', '==', currentUid), where('status', '==', 'active')))
        ]);
        const docs = [...whiteSnap.docs, ...blackSnap.docs];
        if (docs.length === 0) return;
        const d = docs[0];
        const data = d.data();
        resumableGameId = d.id;
        const opponent = data.whiteUid === currentUid ? data.blackName : data.whiteName;
        document.getElementById('resumeGameSub').textContent = `vs ${opponent} · ${tcLabel(data.timeControl)}`;
        document.getElementById('resumeGameBanner').style.display = 'flex';
    } catch (e) { /* fine, just skip the banner */ }
}
window.resumeActiveGame = function () {
    if (!resumableGameId) return;
    joinedGameIds.add(resumableGameId);
    joinOnlineGame(resumableGameId);
};
