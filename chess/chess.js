// ============================================================================
// MMMUT ERP — CHESS MODULE (chess.js)
// Academic Ledger Chess Arena — Realtime Game Engine & Firebase Sync
// Madan Mohan Malaviya University of Technology, Gorakhpur
// ============================================================================

import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
    getFirestore, collection, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc,
    onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs, runTransaction
} from "firebase/firestore";
import { Chess } from "chess.js";

// ===== Same Firebase project as main MMMUT ERP =====
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

// ===== Firestore Collections =====
const playersCol = collection(db, "chessPlayers");
const challengesCol = collection(db, "chessChallenges");
const gamesCol = collection(db, "chessGames");
const activityCol = collection(db, "chessActivity");

// ===== Runtime State =====
let currentUser = null;
let me = null;
let myName = "Student";

let isRemoteGame = false;
let myColor = 'w';
let currentGameId = null;
let gameUnsub = null;
let startedForId = null;
let waitingGameId = null;
let myGamesUnsubs = [];
let challengesUnsub = null;
const recordedGameIds = new Set();

const PIECE_GLYPHS = {
    w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
    b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
};
const PIECE_VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

let game = new Chess();
let boardFlipped = false;
let selectedSquare = null;
let legalTargets = [];
let lastMove = null;
let pendingPromotion = null;
let checkmateKingSquare = null;

let whiteMs = 180000, blackMs = 180000, incrementMs = 0;
let clockTimer = null;
let clockRunningColor = null;
let gameOver = false;
let pendingDrawOffer = null;

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function topColor() { return boardFlipped ? 'w' : 'b'; }
function bottomColor() { return boardFlipped ? 'b' : 'w'; }
function stripElFor(color) {
    return color === topColor()
        ? {
            strip: document.getElementById('topPlayerStrip'),
            name: document.getElementById('topPlayerName'),
            clock: document.getElementById('topPlayerClock'),
            captures: document.getElementById('topPlayerCaptures')
        }
        : {
            strip: document.getElementById('bottomPlayerStrip'),
            name: document.getElementById('bottomPlayerName'),
            clock: document.getElementById('bottomPlayerClock'),
            captures: document.getElementById('bottomPlayerCaptures')
        };
}

// ---------------- AUTH GATE ----------------
function activateChessSession(user) {
    currentUser = user;
    me = (user && user.uid) || 'dev-student';
    const gate = document.getElementById('gateScreen');
    const app = document.getElementById('chessApp');
    if (gate) gate.style.display = 'none';
    if (app) app.style.display = 'flex';
    myName = (user && (user.displayName || user.email)) || 'Student';
    const label = document.getElementById('playerNameLabel');
    if (label) label.textContent = myName;
    initHome();
    if (user && user.uid && user.uid !== 'dev-student') initPhase2(user);
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        activateChessSession(user);
    } else if (currentUser) {
        // Session already explicitly active
        return;
    } else {
        const title = document.getElementById('gateTitle');
        const msg = document.getElementById('gateMessage');
        const link = document.getElementById('gateBackLink');
        if (title) title.textContent = "Authentication Required";
        if (msg) msg.textContent = 'Please log in to your MMMUT ERP student session first.';
        if (link) link.style.display = 'inline-flex';
    }
});

window.activateChessSession = activateChessSession;
window.initHome = initHome;
window.setChessUIState = setChessUIState;

// ---------------- CHESS SIMPLIFIED UI STATE MACHINE ----------------
// States: 'idle' | 'searching' | 'active' | 'finished'
let chessUIState = 'idle';

function setChessUIState(state, meta = {}) {
    chessUIState = state;
    const sIdle = document.getElementById('stateIdle');
    const sSearching = document.getElementById('stateSearching');
    const sActive = document.getElementById('stateActive');
    const sFinished = document.getElementById('stateFinished');
    const boardControls = document.getElementById('boardControls');

    if (sIdle) sIdle.style.display = state === 'idle' ? 'block' : 'none';
    if (sSearching) {
        sSearching.style.display = state === 'searching' ? 'block' : 'none';
        const cancelBtn = document.getElementById('cancelSearchBtn');
        if (cancelBtn && state === 'searching') cancelBtn.style.display = 'inline-flex';
    }
    if (sActive) sActive.style.display = state === 'active' ? 'block' : 'none';
    if (sFinished) sFinished.style.display = state === 'finished' ? 'block' : 'none';

    if (boardControls) {
        boardControls.style.display = state === 'active' ? 'flex' : 'none';
    }

    if (state === 'finished') {
        const titleEl = document.getElementById('finishTitle');
        const reasonEl = document.getElementById('finishReason');
        const bannerEl = document.getElementById('finishBanner');
        if (titleEl) titleEl.textContent = meta.title || 'Game Over';
        if (reasonEl) reasonEl.textContent = meta.sub || '';
        if (bannerEl) {
            bannerEl.className = 'finished-banner-box ' + (meta.bannerClass || 'is-draw');
        }
    }
}

window.heroFindOpponent = function () {
    setChessUIState('searching');
    findOrCreateOnlineGame(300, 0); // 5+0 campus blitz standard
};

window.playAgain = function () {
    if (isRemoteGame) {
        leaveCurrentGame();
        window.heroFindOpponent();
    } else {
        beginGame(180, 0);
    }
};

// ---------------- LOBBY / HOME ----------------
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
    if (grid) {
        grid.innerHTML = QUICK_TCS.map((tc) =>
            `<button class="tc-chip" onclick="quickStart(${tc.base},${tc.inc})">${tc.label}</button>`
        ).join('');
    }
    // Set initial board state
    if (!game) game = new Chess();
    renderBoard();
    renderMoveList();
    updatePlayerStrips();
    setChessUIState('idle');
    setStatus('Ready to play.');
}

window.quickStart = function (base, inc) {
    beginGame(base, inc);
};

// ---------------- SETUP MODAL ----------------
window.openSetupModal = function () {
    document.getElementById('setupModal').classList.add('open');
};
window.closeSetupModal = function () {
    document.getElementById('setupModal').classList.remove('open');
};

document.addEventListener('change', (e) => {
    if (e.target && e.target.id === 'setupTimeControl') {
        const row = document.getElementById('customTcRow');
        if (row) row.style.display = e.target.value === 'custom' ? 'flex' : 'none';
    }
    if (e.target && e.target.id === 'onlineTimeControl') {
        const row = document.getElementById('onlineCustomRow');
        if (row) row.style.display = e.target.value === 'custom' ? 'flex' : 'none';
    }
    if (e.target && e.target.id === 'challengeTimeControl') {
        const row = document.getElementById('challengeCustomRow');
        if (row) row.style.display = e.target.value === 'custom' ? 'flex' : 'none';
    }
});

window.startLocalGame = function () {
    const sel = document.getElementById('setupTimeControl').value;
    let base, inc;
    if (sel === 'custom') {
        base = Math.max(1, parseInt(document.getElementById('customMinutes').value || '10', 10)) * 60;
        inc = Math.max(0, parseInt(document.getElementById('customIncrement').value || '0', 10));
    } else {
        [base, inc] = sel.split('-').map(Number);
    }
    closeSetupModal();
    beginGame(base, inc);
};

// ---------------- GAME LIFECYCLE ----------------
function beginGame(baseSeconds, incSeconds) {
    stopClock();
    game = new Chess();
    boardFlipped = false;
    selectedSquare = null;
    legalTargets = [];
    lastMove = null;
    pendingPromotion = null;
    checkmateKingSquare = null;
    gameOver = false;
    pendingDrawOffer = null;
    showDrawControls(false);

    whiteMs = (baseSeconds || 180) * 1000;
    blackMs = (baseSeconds || 180) * 1000;
    incrementMs = (incSeconds || 0) * 1000;

    const resCard = document.getElementById('resultCard');
    if (resCard) resCard.style.display = 'none';

    renderBoard();
    renderMoveList();
    updatePlayerStrips();
    setChessUIState('active');
    updateTurnStatus();
    startClock('w');
}

window.backToHome = function () {
    stopClock();
    if (isRemoteGame) {
        leaveCurrentGame();
    }
    game = new Chess();
    boardFlipped = false;
    selectedSquare = null;
    legalTargets = [];
    lastMove = null;
    pendingPromotion = null;
    checkmateKingSquare = null;
    gameOver = false;
    pendingDrawOffer = null;
    showDrawControls(false);

    const resCard = document.getElementById('resultCard');
    if (resCard) resCard.style.display = 'none';

    renderBoard();
    renderMoveList();
    updatePlayerStrips();
    setChessUIState('idle');
    setStatus('Ready to play.');
    setOnlineStatus('');
};

// ---------------- CLOCK ----------------
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
            if (whiteMs === 0) {
                renderClocks();
                if (stripElFor('w').clock) stripElFor('w').clock.classList.add('critical-time');
                if (isRemoteGame) finishRemoteGame('b', 'timeout');
                endGame('timeout', 'b');
                return;
            }
        } else {
            blackMs = Math.max(0, blackMs - elapsed);
            if (blackMs === 0) {
                renderClocks();
                if (stripElFor('b').clock) stripElFor('b').clock.classList.add('critical-time');
                if (isRemoteGame) finishRemoteGame('w', 'timeout');
                endGame('timeout', 'w');
                return;
            }
        }
        renderClocks();
    }, 200);
}

function stopClock() {
    if (clockTimer) {
        clearInterval(clockTimer);
        clockTimer = null;
    }
    clockRunningColor = null;
}

function switchClock(movedColor) {
    if (movedColor === 'w') whiteMs += incrementMs; else blackMs += incrementMs;
    startClock(movedColor === 'w' ? 'b' : 'w');
    renderClocks();
}

function fmtClock(ms) {
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function renderClocks() {
    const w = stripElFor('w');
    const b = stripElFor('b');
    if (w.clock) w.clock.textContent = fmtClock(whiteMs);
    if (b.clock) b.clock.textContent = fmtClock(blackMs);
    if (w.clock) updateClockVisuals(w.clock, whiteMs);
    if (b.clock) updateClockVisuals(b.clock, blackMs);

    const turn = game ? game.turn() : 'w';
    if (w.strip) w.strip.classList.toggle('turn-active', turn === 'w' && !gameOver);
    if (b.strip) b.strip.classList.toggle('turn-active', turn === 'b' && !gameOver);
    if (w.clock) w.clock.classList.toggle('ticking', turn === 'w' && !gameOver);
    if (b.clock) b.clock.classList.toggle('ticking', turn === 'b' && !gameOver);
}

function updateClockVisuals(el, ms) {
    el.classList.toggle('low-time', ms <= 30000 && ms > 10000);
    el.classList.toggle('critical-time', ms <= 10000 && ms > 0);
}

function updatePlayerStrips() {
    const w = stripElFor('w');
    const b = stripElFor('b');
    if (isRemoteGame) {
        // In remote game, label with real opponent name
        if (myColor === 'w') {
            if (w.name) w.name.textContent = `${myName} (You)`;
            if (b.name) b.name.textContent = 'Opponent';
        } else {
            if (w.name) w.name.textContent = 'Opponent';
            if (b.name) b.name.textContent = `${myName} (You)`;
        }
    } else {
        if (w.name) w.name.textContent = 'White';
        if (b.name) b.name.textContent = 'Black';
    }
    const topStrip = document.getElementById('topPlayerStrip');
    const bottomStrip = document.getElementById('bottomPlayerStrip');
    if (topStrip) topStrip.dataset.color = topColor();
    if (bottomStrip) bottomStrip.dataset.color = bottomColor();
    renderClocks();
    renderCaptures();
}

// ---------------- BOARD RENDERING ----------------
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

function squareId(file, rank) { return file + rank; }

function renderBoard() {
    const board = document.getElementById('board');
    if (!board || !game) return;
    board.innerHTML = '';
    const filesOrder = boardFlipped ? [...FILES].reverse() : FILES;
    const ranksOrder = boardFlipped ? [...RANKS] : [...RANKS].reverse();

    const boardState = game.board();

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

            // Coordinates on perimeter
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

            // Piece
            const rowIdx = 8 - Number(rank);
            const colIdx = FILES.indexOf(file);
            const cell = boardState[rowIdx][colIdx];
            if (cell) {
                const p = document.createElement('div');
                p.className = 'piece';
                p.textContent = PIECE_GLYPHS[cell.color][cell.type];
                p.draggable = true;
                p.dataset.square = id;
                p.addEventListener('dragstart', onDragStart);
                p.addEventListener('dragend', onDragEnd);
                sq.appendChild(p);
            }

            // Legal target move indicators
            if (legalTargets.includes(id)) {
                const occupied = !!cell;
                const marker = document.createElement('div');
                marker.className = occupied ? 'capture-ring' : 'move-dot';
                sq.appendChild(marker);
            }

            // Check & checkmate styling
            if (game.inCheck() && cell && cell.type === 'k' && cell.color === game.turn()) {
                sq.classList.add('in-check');
            }
            if (checkmateKingSquare === id) {
                sq.classList.add('checkmate-king');
            }

            // Click / Tap listener
            sq.addEventListener('click', () => onSquareClick(id));
            sq.addEventListener('dragover', (e) => {
                e.preventDefault();
                if (legalTargets.includes(id)) sq.classList.add('legal-hover');
            });
            sq.addEventListener('dragleave', () => sq.classList.remove('legal-hover'));
            sq.addEventListener('drop', (e) => onDrop(e, id));

            board.appendChild(sq);
        });
    });
}

// ---------------- INTERACTION ----------------
function onSquareClick(id) {
    if (gameOver) return;
    if (isRemoteGame && myColor && game.turn() !== myColor) return;
    if (selectedSquare) {
        if (legalTargets.includes(id)) {
            attemptMove(selectedSquare, id);
            return;
        }
        // Reselect if clicking another piece of the turn's color
        const piece = game.get(id);
        const allowedColor = isRemoteGame ? myColor : game.turn();
        if (piece && piece.color === allowedColor) {
            selectSquare(id);
        } else {
            clearSelection();
        }
    } else {
        const piece = game.get(id);
        const allowedColor = isRemoteGame ? myColor : game.turn();
        if (piece && piece.color === allowedColor) selectSquare(id);
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
    if (gameOver) { e.preventDefault(); return; }
    if (isRemoteGame && myColor && game.turn() !== myColor) { e.preventDefault(); return; }
    const id = e.target.dataset.square;
    const piece = game.get(id);
    const allowedColor = isRemoteGame ? myColor : game.turn();
    if (!piece || piece.color !== allowedColor) { e.preventDefault(); return; }
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
    const move = game.move({ from, to, promotion: promotion || undefined });
    if (!move) { clearSelection(); return; }
    lastMove = { from, to };
    selectedSquare = null;
    legalTargets = [];
    if (isRemoteGame) {
        renderBoard();
        animateMove(move);
        renderMoveList();
        renderCaptures();
        updateTurnStatus();
        persistRemoteMove(move);
    } else {
        switchClock(move.color);
        renderBoard();
        animateMove(move);
        renderMoveList();
        renderCaptures();
        checkGameEnd();
    }
}

// ---------------- ANIMATIONS ----------------
function animateMove(move) {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    const reduced = prefersReducedMotion();

    const toSq = boardEl.querySelector(`.sq[data-square="${move.to}"]`);
    const fromSq = boardEl.querySelector(`.sq[data-square="${move.from}"]`);
    const movingPiece = toSq && toSq.querySelector('.piece');

    if (!reduced && movingPiece && toSq && fromSq) {
        const fromRect = fromSq.getBoundingClientRect();
        const toRect = toSq.getBoundingClientRect();
        const dx = fromRect.left - toRect.left;
        const dy = fromRect.top - toRect.top;
        movingPiece.style.transition = 'none';
        movingPiece.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
            const dur = move.piece === 'p' ? 220 : 180;
            movingPiece.style.transition = `transform ${dur}ms var(--anim-ease)`;
            movingPiece.style.transform = 'translate(0, 0)';
        });
        movingPiece.addEventListener('transitionend', () => {
            movingPiece.style.transition = '';
            movingPiece.style.transform = '';
        }, { once: true });
    }

    animateCapture(move);
    showMoveFeedback(toSq, move);
}

function animateCapture(move) {
    if (!move.captured) return;
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    let flashSquareId = move.to;
    if (move.flags.includes('e')) {
        const rank = move.color === 'w' ? '5' : '4';
        flashSquareId = move.to[0] + rank;
    }
    const flashSq = boardEl.querySelector(`.sq[data-square="${flashSquareId}"]`);
    if (!flashSq) return;
    const ring = document.createElement('div');
    ring.className = 'capture-burst';
    flashSq.appendChild(ring);
    ring.addEventListener('animationend', () => ring.remove(), { once: true });
}

function showMoveFeedback(toSq, move) {
    if (!toSq) return;
    toSq.classList.add('landing-pulse');
    toSq.addEventListener('animationend', () => toSq.classList.remove('landing-pulse'), { once: true });
}

function showCheckNotification() {
    const boardWrap = document.querySelector('.board-wrap');
    if (!boardWrap) return;
    const toast = document.createElement('div');
    toast.className = 'check-toast';
    toast.textContent = 'CHECK!';
    boardWrap.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 250);
    }, 1200);
}

function showCheckmateOverlay(winnerColor, onDone) {
    const boardWrap = document.querySelector('.board-wrap');
    if (!boardWrap) { onDone && onDone(); return; }
    const overlay = document.createElement('div');
    overlay.className = 'checkmate-overlay';
    overlay.innerHTML = `
        <div class="checkmate-card">
            <div class="checkmate-title">CHECKMATE</div>
            <div class="checkmate-winner">${winnerColor === 'w' ? 'White' : 'Black'} is victorious</div>
        </div>`;
    boardWrap.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    const holdTime = prefersReducedMotion() ? 300 : 1400;
    setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(() => { overlay.remove(); onDone && onDone(); }, 300);
    }, holdTime);
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
    if (!list) return;
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
    const pgnBox = document.getElementById('pgnBox');
    if (pgnBox) pgnBox.textContent = game.pgn() || '—';
}

window.copyPgn = function () {
    navigator.clipboard.writeText(game.pgn() || '');
    setStatus('PGN copied to clipboard.');
};
window.copyFen = function () {
    navigator.clipboard.writeText(game.fen());
    setStatus('FEN position copied to clipboard.');
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
    const w = stripElFor('w');
    const b = stripElFor('b');
    if (w.captures) w.captures.textContent = renderSide(captured.w, 'w');
    if (b.captures) b.captures.textContent = renderSide(captured.b, 'b');
}

// ---------------- BOARD PERSPECTIVE FLIP ----------------
window.flipBoard = function () {
    boardFlipped = !boardFlipped;
    renderBoard();
    updatePlayerStrips();
};

// ---------------- GAME END ----------------
function checkGameEnd() {
    if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? 'b' : 'w';
        endGame('checkmate', winner);
    } else if (game.isStalemate()) {
        endGame('stalemate', null);
    } else if (game.isThreefoldRepetition()) {
        endGame('repetition', null);
    } else if (game.isInsufficientMaterial()) {
        endGame('insufficient', null);
    } else if (game.isDrawByFiftyMoves ? game.isDrawByFiftyMoves() : false) {
        endGame('fifty-move', null);
    } else {
        const turnLabel = game.turn() === 'w' ? 'White' : 'Black';
        const checkNote = game.inCheck() ? ' — Check!' : '';
        setStatus(`${turnLabel} to move${checkNote}`, game.inCheck());
        if (game.inCheck()) showCheckNotification();
    }
}

window.executeResign = function () {
    if (gameOver || !game) return;
    const resigningColor = isRemoteGame ? myColor : game.turn();
    const winner = resigningColor === 'w' ? 'b' : 'w';
    if (isRemoteGame) finishRemoteGame(winner, 'resignation');
    endGame('resignation', winner);
    if (isRemoteGame) leaveCurrentGame();
};

window.offerResign = function () {
    if (gameOver || !game) return;
    if (typeof window.promptResign === 'function') {
        window.promptResign();
    } else {
        window.executeResign();
    }
};

window.offerDraw = function () {
    if (gameOver || !game) return;
    if (isRemoteGame) {
        if (!currentGameId) return;
        updateDoc(doc(gamesCol, currentGameId), {
            drawOfferFrom: me,
            drawOfferTs: Date.now(),
            drawOfferStatus: 'pending'
        }).catch((e) => console.warn('draw offer failed', e));
        setOnlineStatus('Draw offer sent to opponent.');
    } else {
        if (!confirm('Both players agree to a draw?')) return;
        endGame('agreement', null);
    }
};

window.acceptDrawOffer = function () {
    pendingDrawOffer = null;
    showDrawControls(false);
    if (isRemoteGame && currentGameId) {
        finishRemoteGame(null, 'agreement');
        endGame('agreement', null);
        return;
    }
    endGame('agreement', null);
};

window.declineDrawOffer = function () {
    const offerer = pendingDrawOffer ? pendingDrawOffer.from : null;
    pendingDrawOffer = null;
    showDrawControls(false);
    setOnlineStatus(offerer ? 'Draw offer declined.' : 'Draw offer withdrawn.');
    if (isRemoteGame && currentGameId) {
        updateDoc(doc(gamesCol, currentGameId), {
            drawOfferFrom: null, drawOfferTs: null, drawOfferStatus: null
        }).catch(() => { });
    }
};

function showDrawControls(show) {
    const banner = document.getElementById('drawOfferBanner');
    if (banner) banner.style.display = show ? 'flex' : 'none';
}

function endGame(reason, winnerColor) {
    if (gameOver) return;
    gameOver = true;
    stopClock();
    pendingDrawOffer = null;
    showDrawControls(false);

    const REASON_LABEL = {
        checkmate: 'Checkmate',
        stalemate: 'Stalemate',
        repetition: 'Draw — threefold repetition',
        insufficient: 'Draw — insufficient material',
        'fifty-move': 'Draw — fifty-move rule',
        resignation: 'Resignation',
        agreement: 'Draw by mutual agreement',
        timeout: 'Timeout'
    };

    let title, sub;
    if (winnerColor) {
        if (isRemoteGame) {
            title = winnerColor === myColor ? 'You won' : 'You lost';
        } else {
            title = `${winnerColor === 'w' ? 'White' : 'Black'} wins`;
        }
        sub = REASON_LABEL[reason] || reason;
    } else {
        title = 'Draw';
        sub = REASON_LABEL[reason] || reason;
    }

    const revealResultCard = () => {
        let bannerClass = 'is-draw';
        if (winnerColor) {
            bannerClass = (isRemoteGame ? (winnerColor === myColor ? 'is-win' : 'is-loss') : 'is-win');
        }
        setChessUIState('finished', { title, sub, bannerClass });

        const card = document.getElementById('resultCard');
        if (card) {
            card.style.display = 'none';
        }
        setStatus(`Game over — ${title} (${sub}).`, true);
    };

    if (reason === 'checkmate' && game) {
        const loserColor = winnerColor === 'w' ? 'b' : 'w';
        const boardState = game.board();
        outer:
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const cell = boardState[r][c];
                if (cell && cell.type === 'k' && cell.color === loserColor) {
                    checkmateKingSquare = FILES[c] + RANKS[7 - r];
                    break outer;
                }
            }
        }
        renderBoard();
        showCheckmateOverlay(winnerColor, revealResultCard);
    } else {
        revealResultCard();
    }
}

// ---------------- FIREBASE RATINGS, MATCHMAKING & CHALLENGES ----------------
function setOnlineStatus(msg) {
    const el = document.getElementById('onlineStatus');
    if (el) el.textContent = msg || '';
    const el2 = document.getElementById('onlineStatusModal');
    if (el2) el2.textContent = msg || '';
}
function setChallengeStatus(msg) {
    const el = document.getElementById('challengeStatus');
    if (el) el.textContent = msg || '';
}
function showCancelSearch(show) {
    const el = document.getElementById('cancelSearchModalBtn');
    if (el) el.style.display = show ? 'inline-flex' : 'none';
}

async function ensureProfile(uid, name) {
    const ref = doc(playersCol, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    const fresh = { uid, name: name || 'Student', rating: 1200, games: 0, wins: 0, losses: 0, draws: 0, updatedAt: serverTimestamp() };
    try { await setDoc(ref, fresh); } catch (e) { console.warn('chess profile create failed', e); }
    return fresh;
}
async function refreshProfileStats() {
    const p = await ensureProfile(me, myName);
    if (!p) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('statRating', p.rating);
    set('statGames', p.games);
    set('statWins', p.wins);
    set('statLosses', p.losses);
    set('ratingChip', 'Rating ' + p.rating);
}

function applyElo(a, b, scoreA) {
    const K = 32;
    const ea = 1 / (1 + Math.pow(10, (b.rating - a.rating) / 400));
    a.rating = Math.max(100, Math.round(a.rating + K * (scoreA - ea)));
    b.rating = Math.max(100, Math.round(b.rating + K * (1 - scoreA - (1 - ea))));
}

async function ensureProfileTx(tx, uid, name) {
    const ref = doc(playersCol, uid);
    const snap = await tx.get(ref);
    if (snap.exists()) return snap.data();
    const fresh = { uid, name: name || 'Student', rating: 1200, games: 0, wins: 0, losses: 0, draws: 0, updatedAt: serverTimestamp() };
    tx.set(ref, fresh);
    return fresh;
}

async function recordGameResult(g) {
    if (recordedGameIds.has(g.id)) return;
    if (g.winnerColor === undefined) return;
    if (!g.whiteUid || !g.blackUid) return;
    recordedGameIds.add(g.id);
    try {
        await runTransaction(db, async (tx) => {
            const gameRef = doc(gamesCol, g.id);
            const gs = await tx.get(gameRef);
            if (!gs.exists() || gs.data().resultRecorded) return;
            const w = await ensureProfileTx(tx, g.whiteUid, g.whiteName);
            const b = await ensureProfileTx(tx, g.blackUid, g.blackName);
            let scoreW;
            if (g.winnerColor === 'w') { scoreW = 1; w.wins++; b.losses++; }
            else if (g.winnerColor === 'b') { scoreW = 0; b.wins++; w.losses++; }
            else { scoreW = 0.5; w.draws++; b.draws++; }
            w.games++; b.games++;
            applyElo(w, b, scoreW);
            tx.set(doc(playersCol, g.whiteUid), w);
            tx.set(doc(playersCol, g.blackUid), b);
            const actRef = doc(collection(activityCol));
            tx.set(actRef, {
                type: 'game', whiteUid: g.whiteUid, blackUid: g.blackUid,
                whiteName: g.whiteName, blackName: g.blackName,
                winnerColor: g.winnerColor, reason: g.reason, createdAt: serverTimestamp()
            });
            tx.update(gameRef, { resultRecorded: true });
        });
    } catch (e) {
        console.warn('chess result persist failed', e);
        recordedGameIds.delete(g.id);
    }
    loadRecentGames().catch(() => { });
    refreshProfileStats().catch(() => { });
}

function detectResult() {
    if (!game) return null;
    if (game.isCheckmate()) return { reason: 'checkmate', winnerColor: game.turn() === 'w' ? 'b' : 'w' };
    if (game.isStalemate()) return { reason: 'stalemate', winnerColor: null };
    if (game.isThreefoldRepetition()) return { reason: 'repetition', winnerColor: null };
    if (game.isInsufficientMaterial()) return { reason: 'insufficient', winnerColor: null };
    if (game.isDrawByFiftyMoves && game.isDrawByFiftyMoves()) return { reason: 'fifty-move', winnerColor: null };
    return null;
}

function rebuildFromMoves(moves) {
    const ng = new Chess();
    (moves || []).forEach(m => { try { ng.move({ from: m.from, to: m.to, promotion: m.promotion || undefined }); } catch (e) { } });
    game = ng;
    const last = (moves && moves.length) ? moves[moves.length - 1] : null;
    lastMove = last ? { from: last.from, to: last.to } : null;
    selectedSquare = null;
    legalTargets = [];
    renderBoard();
    renderMoveList();
    renderCaptures();
}

async function finishRemoteGame(winnerColor, reason) {
    if (!currentGameId) return;
    try {
        await updateDoc(doc(gamesCol, currentGameId), {
            finished: true,
            status: 'finished',
            winnerColor: winnerColor === undefined ? null : winnerColor,
            reason: reason || 'agreement'
        });
    } catch (e) { console.warn('finishRemoteGame failed', e); }
}

async function persistRemoteMove(move) {
    if (!currentGameId) return;
    const ref = doc(gamesCol, currentGameId);
    try {
        const snap = await getDoc(ref);
        const g = snap.data();
        if (!g) return;
        const now = Date.now();
        let w = g.whiteMs, b = g.blackMs;
        const elapsed = Math.max(0, now - (g.lastMoveTs || now));
        if (move.color === 'w') { w = Math.max(0, w - elapsed); w += incrementMs; }
        else { b = Math.max(0, b - elapsed); b += incrementMs; }
        const moves = [...(g.moves || []), { from: move.from, to: move.to, promotion: move.promotion || null }];
        const nextTurn = move.color === 'w' ? 'b' : 'w';
        await updateDoc(ref, { moves, turn: nextTurn, whiteMs: w, blackMs: b, lastMoveTs: now });
    } catch (e) {
        console.warn('persistRemoteMove failed', e);
        setOnlineStatus('Sync error: ' + (e.message || e));
    }
}

function onGameSnap(snap) {
    if (!snap.exists()) return;
    const g = snap.data();
    if (g.whiteUid === me) myColor = 'w';
    else if (g.blackUid === me) myColor = 'b';
    if (startedForId !== currentGameId) {
        beginGame((g.baseMs || 300000) / 1000, (g.incMs || 0) / 1000);
        startedForId = currentGameId;
    }
    rebuildFromMoves(g.moves);
    if (g.whiteMs != null) whiteMs = g.whiteMs;
    if (g.blackMs != null) blackMs = g.blackMs;
    renderClocks();
    if (!g.finished) startClock(game.turn());

    // Draw offer handling
    if (g.drawOfferFrom && g.drawOfferFrom !== me && !pendingDrawOffer) {
        pendingDrawOffer = { from: g.drawOfferFrom, ts: g.drawOfferTs || Date.now() };
        showDrawControls(true);
        setOnlineStatus('Opponent offered a draw.');
    } else if (!g.drawOfferFrom && pendingDrawOffer) {
        pendingDrawOffer = null;
        showDrawControls(false);
    }

    const res = detectResult();
    if (g.finished) {
        if (!gameOver) endGame(g.reason || (res && res.reason) || 'agreement', g.winnerColor);
        if (currentGameId && !recordedGameIds.has(currentGameId)) {
            recordGameResult({ id: currentGameId, ...g });
        }
        return;
    }
    if (res && currentGameId) finishRemoteGame(res.winnerColor, res.reason);
}

function joinGame(id) {
    if (currentGameId === id) return;
    if (gameUnsub) { gameUnsub(); gameUnsub = null; }
    currentGameId = id;
    isRemoteGame = true;
    startedForId = null;
    const resCard = document.getElementById('resultCard');
    if (resCard) resCard.style.display = 'none';
    const ref = doc(gamesCol, id);
    gameUnsub = onSnapshot(ref, onGameSnap, (err) => {
        console.warn('game snap err', err);
        setOnlineStatus('Connection issue. Retrying…');
    });
    setOnlineStatus('Connected to live match.');
}

function leaveCurrentGame() {
    if (gameUnsub) { gameUnsub(); gameUnsub = null; }
    currentGameId = null;
    isRemoteGame = false;
    myColor = 'w';
    startedForId = null;
    gameOver = false;
    pendingDrawOffer = null;
    showDrawControls(false);
    stopClock();
}

async function cancelOnlineSearch() {
    if (waitingGameId) {
        try { await deleteDoc(doc(gamesCol, waitingGameId)); } catch (e) { }
        waitingGameId = null;
    }
    showCancelSearch(false);
    setOnlineStatus('Search cancelled.');
    setChessUIState('idle');
}

// ---------------- ONLINE MATCHMAKING ----------------
async function findOrCreateOnlineGame(base, inc) {
    setOnlineStatus('Searching for student opponent…');
    showCancelSearch(false);
    try {
        const snap = await getDocs(query(gamesCol, where('status', '==', 'waiting')));
        let target = null, myWaiting = null;
        snap.forEach(d => {
            const g = d.data();
            if (g.whiteUid === me) myWaiting = { id: d.id };
            else if (!g.blackUid) target = { id: d.id };
        });
        if (myWaiting) {
            waitingGameId = myWaiting.id;
            setOnlineStatus('Waiting for an opponent… (Cancel to stop)');
            showCancelSearch(true);
            return;
        }
        if (target) {
            await updateDoc(doc(gamesCol, target.id), {
                blackUid: me, blackName: myName, status: 'active', lastMoveTs: Date.now()
            });
            setOnlineStatus('Match found! Loading board…');
        } else {
            const ref = await addDoc(gamesCol, {
                whiteUid: me, whiteName: myName, blackUid: '', blackName: '',
                status: 'waiting', baseMs: base * 1000, incMs: inc * 1000,
                moves: [], turn: 'w', whiteMs: base * 1000, blackMs: base * 1000,
                lastMoveTs: Date.now(), createdAt: serverTimestamp()
            });
            waitingGameId = ref.id;
            setOnlineStatus('Waiting for a student opponent… (Cancel to stop)');
            showCancelSearch(true);
        }
    } catch (e) {
        console.warn('findOrCreateOnlineGame failed', e);
        setOnlineStatus('Matchmaking error: ' + (e.message || e));
    }
}

function setupMyGamesListener() {
    const handler = (snap) => {
        snap.forEach(d => {
            const g = d.data();
            const id = d.id;
            if (g.status === 'active' && id !== currentGameId) {
                joinGame(id);
            } else if (g.status === 'waiting' && g.whiteUid === me && !currentGameId) {
                waitingGameId = id;
                setOnlineStatus('Waiting for an opponent… (Cancel to stop)');
                showCancelSearch(true);
            } else if (g.status === 'finished' && !recordedGameIds.has(id)) {
                recordGameResult({ id, ...g });
            }
        });
    };
    myGamesUnsubs.push(onSnapshot(query(gamesCol, where('whiteUid', '==', me)), handler));
    myGamesUnsubs.push(onSnapshot(query(gamesCol, where('blackUid', '==', me)), handler));
}

// ---------------- CHALLENGES ----------------
async function sendChessChallenge(opponentInput, tcBase, tcInc) {
    if (!me) return;
    setChallengeStatus('Searching for student profile…');
    try {
        const [s1, s2] = await Promise.all([
            getDocs(query(collection(db, 'users'), where('username', '==', opponentInput))),
            getDocs(query(collection(db, 'users'), where('email', '==', opponentInput)))
        ]);
        let opp = null;
        if (!s1.empty) opp = { uid: s1.docs[0].id, ...s1.docs[0].data() };
        else if (!s2.empty) opp = { uid: s2.docs[0].id, ...s2.docs[0].data() };
        if (!opp) { setChallengeStatus('No student found matching that username or email.'); return; }
        if (opp.uid === me) { setChallengeStatus("You cannot challenge yourself."); return; }
        const oppName = opp.name || opp.username || opp.email;
        await addDoc(challengesCol, {
            challengerUid: me, challengerName: myName,
            opponentUid: opp.uid, opponentName: oppName,
            status: 'pending', baseMs: tcBase * 1000, incMs: tcInc * 1000,
            createdAt: serverTimestamp()
        });
        setChallengeStatus('Challenge sent to ' + oppName + '!');
        addDoc(activityCol, {
            type: 'challenge', uid: me, name: myName,
            toUid: opp.uid, toName: oppName, createdAt: serverTimestamp()
        }).catch(() => { });
    } catch (e) {
        setChallengeStatus('Error sending challenge: ' + (e.message || e));
    }
}

function setupChallengesListener() {
    challengesUnsub = onSnapshot(
        query(challengesCol, where('opponentUid', '==', me)),
        (snap) => renderIncomingChallenges(snap)
    );
}

function renderIncomingChallenges(snap) {
    const el = document.getElementById('incomingChallenges');
    if (!el) return;
    const pending = snap.docs.filter(d => d.data().status === 'pending');
    if (!pending.length) { el.innerHTML = '<div class="empty-note">No incoming challenges at this moment.</div>'; return; }
    let html = '';
    pending.forEach(d => {
        const c = d.data();
        html += `<div class="challenge-row">
            <span><strong>${escapeHtml(c.challengerName || 'A Student')}</strong> challenged you</span>
            <div class="challenge-row-actions">
                <button class="btn-primary" style="padding:4px 10px; font-size:12px; background:var(--success); border-color:var(--success);" onclick="acceptChessChallenge('${d.id}')">Accept</button>
                <button class="btn-secondary" style="padding:4px 10px; font-size:12px;" onclick="declineChessChallenge('${d.id}')">Decline</button>
            </div>
        </div>`;
    });
    el.innerHTML = html;
}

async function acceptChessChallenge(challengeId) {
    try {
        const ref = doc(challengesCol, challengeId);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const c = snap.data();
        if (c.status !== 'pending') return;
        const ref2 = await addDoc(gamesCol, {
            whiteUid: c.challengerUid, whiteName: c.challengerName,
            blackUid: me, blackName: myName,
            status: 'active', baseMs: c.baseMs || 300000, incMs: c.incMs || 0,
            moves: [], turn: 'w', whiteMs: c.baseMs || 300000, blackMs: c.baseMs || 300000,
            lastMoveTs: Date.now(), createdAt: serverTimestamp(), fromChallenge: challengeId
        });
        await updateDoc(ref, { status: 'accepted' });
        joinGame(ref2.id);
    } catch (e) {
        setChallengeStatus('Could not accept challenge: ' + (e.message || e));
    }
}

async function declineChessChallenge(challengeId) {
    try { await updateDoc(doc(challengesCol, challengeId), { status: 'declined' }); } catch (e) { }
}

// ---------------- RECENT GAMES ----------------
async function loadRecentGames() {
    try {
        const [s1, s2] = await Promise.all([
            getDocs(query(gamesCol, where('whiteUid', '==', me), limit(20))),
            getDocs(query(gamesCol, where('blackUid', '==', me), limit(20)))
        ]);
        const map = new Map();
        s1.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
        s2.forEach(d => map.set(d.id, { id: d.id, ...d.data() }));
        const games = [...map.values()]
            .sort((a, b) => (b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0) - (a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0))
            .slice(0, 10);
        renderRecentGames(games);
    } catch (e) { console.warn('loadRecentGames failed', e); }
}

function renderRecentGames(games) {
    const el = document.getElementById('recentGames');
    if (!el) return;
    if (!games.length) { el.innerHTML = '<div class="empty-note">No games recorded yet.</div>'; return; }
    el.innerHTML = games.map(g => {
        const youAreWhite = g.whiteUid === me;
        const opp = youAreWhite ? (g.blackName || 'Opponent') : (g.whiteName || 'Opponent');
        let res = 'In progress';
        let resClass = 'rg-draw';
        if (g.finished) {
            if (g.winnerColor == null) {
                res = 'Draw';
                resClass = 'rg-draw';
            } else if (g.winnerColor === (youAreWhite ? 'w' : 'b')) {
                res = 'Won';
                resClass = 'rg-win';
            } else {
                res = 'Lost';
                resClass = 'rg-loss';
            }
        }
        return `<div class="recent-game">
            <span><strong>${youAreWhite ? 'White' : 'Black'}</strong> vs ${escapeHtml(opp)}</span>
            <span class="rg-result ${resClass}">${res}</span>
        </div>`;
    }).join('');
}

// ---------------- CLEANUP & INIT ----------------
function cleanupPhase2Listeners() {
    if (challengesUnsub) {
        try { challengesUnsub(); } catch (e) { }
        challengesUnsub = null;
    }
    myGamesUnsubs.forEach(unsub => {
        try { unsub(); } catch (e) { }
    });
    myGamesUnsubs = [];
    if (gameUnsub) {
        try { gameUnsub(); } catch (e) { }
        gameUnsub = null;
    }
}

async function initPhase2(user) {
    currentUser = user;
    me = user.uid;
    myName = user.displayName || user.email || 'Student';
    cleanupPhase2Listeners();
    try { await refreshProfileStats(); } catch (e) { }
    setupMyGamesListener();
    setupChallengesListener();
    loadRecentGames().catch(() => { });
}

window.addEventListener('beforeunload', () => {
    stopClock();
    cleanupPhase2Listeners();
});
window.addEventListener('pagehide', () => {
    stopClock();
    cleanupPhase2Listeners();
});

// ---------------- GLOBAL UI WIRING ----------------
window.openOnlineModal = function () {
    document.getElementById('onlineModal').classList.add('open');
};
window.closeOnlineModal = function () {
    document.getElementById('onlineModal').classList.remove('open');
};
window.startOnlineMatch = function () {
    const sel = document.getElementById('onlineTimeControl').value;
    let base, inc;
    if (sel === 'custom') {
        base = Math.max(1, parseInt(document.getElementById('onlineMinutes').value || '10', 10)) * 60;
        inc = Math.max(0, parseInt(document.getElementById('onlineIncrement').value || '0', 10));
    } else {
        [base, inc] = sel.split('-').map(Number);
    }
    closeOnlineModal();
    findOrCreateOnlineGame(base, inc);
};
window.cancelOnlineSearch = cancelOnlineSearch;

window.openChallengeModal = function () {
    const el = document.getElementById('challengeStatus');
    if (el) el.textContent = '';
    document.getElementById('challengeModal').classList.add('open');
};
window.closeChallengeModal = function () {
    document.getElementById('challengeModal').classList.remove('open');
};
window.sendChallengeFromModal = function () {
    const input = document.getElementById('challengeOpponent').value.trim();
    const sel = document.getElementById('challengeTimeControl').value;
    let base, inc;
    if (sel === 'custom') {
        base = Math.max(1, parseInt(document.getElementById('challengeMinutes').value || '10', 10)) * 60;
        inc = Math.max(0, parseInt(document.getElementById('challengeIncrement').value || '0', 10));
    } else {
        [base, inc] = sel.split('-').map(Number);
    }
    if (!input) { setChallengeStatus('Enter an opponent username or email.'); return; }
    sendChessChallenge(input, base, inc);
};

window.acceptChessChallenge = acceptChessChallenge;
window.declineChessChallenge = declineChessChallenge;

function setStatus(text, important) {
    const el = document.getElementById('statusLine');
    if (!el) return;
    el.textContent = text;
    el.className = 'status-line' + (important ? ' important' : '');
}
