// ============================================================
// CHESS MODULE — chess.js (game logic)
// PHASE 1 SCOPE: local hotseat play only.
// Firebase is used ONLY to confirm the visitor has an existing
// Ledger session — no chess data is read from or written to
// Firestore in this phase. Same firebaseConfig as index.html,
// re-used as read-only auth verification (no new auth system).
// ============================================================

import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, getDocs, runTransaction } from "firebase/firestore";
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

// ===== Phase 2 collections (reuse the same chess* collections the Chess Club uses) =====
const playersCol = collection(db, "chessPlayers");
const challengesCol = collection(db, "chessChallenges");
const gamesCol = collection(db, "chessGames");
const activityCol = collection(db, "chessActivity");

// ===== Phase 2 runtime state =====
let currentUser = null;
let me = null;
let myName = "Player";

let isRemoteGame = false;
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

let game = null;
let boardFlipped = false;
let selectedSquare = null;
let legalTargets = [];
let lastMove = null; // { from, to }
let pendingPromotion = null; // { from, to }
let checkmateKingSquare = null;

let whiteMs = 0, blackMs = 0, incrementMs = 0;
let clockTimer = null;
let clockRunningColor = null; // 'w' | 'b' | null
let gameOver = false;
let pendingDrawOffer = null; // { from, ts } - tracks pending draw offer

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
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('gateScreen').style.display = 'none';
        document.getElementById('chessApp').style.display = 'flex';
        document.getElementById('playerNameLabel').textContent = user.displayName || user.email || 'Player';
        initHome();
        initPhase2(user);
    } else {
        document.getElementById('gateTitle').textContent = "You're not logged in";
        document.getElementById('gateMessage').textContent = 'Log in to Ledger first, then open Chess again.';
        document.getElementById('gateBackLink').style.display = 'inline-flex';
    }
});

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
    grid.innerHTML = QUICK_TCS.map((tc, i) =>
        `<button class="tc-chip" onclick="quickStart(${tc.base},${tc.inc})">${tc.label}</button>`
    ).join('');
    // Phase 1: no chessPlayers profile yet, so stats stay placeholders.
    document.getElementById('statRating').textContent = '1200';
    document.getElementById('statGames').textContent = '0';
    document.getElementById('statWins').textContent = '0';
    document.getElementById('statLosses').textContent = '0';
    document.getElementById('ratingChip').textContent = 'Rating 1200';
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
        document.getElementById('customTcRow').style.display = e.target.value === 'custom' ? 'flex' : 'none';
    }
    if (e.target && e.target.id === 'onlineTimeControl') {
        document.getElementById('onlineCustomRow').style.display = e.target.value === 'custom' ? 'flex' : 'none';
    }
    if (e.target && e.target.id === 'challengeTimeControl') {
        document.getElementById('challengeCustomRow').style.display = e.target.value === 'custom' ? 'flex' : 'none';
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
    game = new Chess();
    boardFlipped = false;
    selectedSquare = null;
    legalTargets = [];
    lastMove = null;
    pendingPromotion = null;
    checkmateKingSquare = null;
    gameOver = false;

    whiteMs = baseSeconds * 1000;
    blackMs = baseSeconds * 1000;
    incrementMs = incSeconds * 1000;

    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('resultCard').style.display = 'none';
    document.getElementById('statusLine').className = 'status-line';
    document.getElementById('statusLine').textContent = 'White to move.';

    renderBoard();
    renderMoveList();
    updatePlayerStrips();
    startClock('w');
}

window.backToHome = function () {
    if (isRemoteGame) leaveCurrentGame();
    else stopClock();
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('homeScreen').style.display = 'block';
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
                stripElFor('w').clock.classList.add('timeout-flash');
                if (isRemoteGame) finishRemoteGame('b', 'timeout');
                endGame('timeout', 'b');
                return;
            }
        } else {
            blackMs = Math.max(0, blackMs - elapsed);
            if (blackMs === 0) {
                renderClocks();
                stripElFor('b').clock.classList.add('timeout-flash');
                if (isRemoteGame) finishRemoteGame('w', 'timeout');
                endGame('timeout', 'w');
                return;
            }
        }
        renderClocks();
    }, 200);
}
function stopClock() {
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = null;
}
function switchClock(movedColor) {
    // increment goes to the player who just moved
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
    w.clock.textContent = fmtClock(whiteMs);
    b.clock.textContent = fmtClock(blackMs);
    updateClockVisuals(w.clock, whiteMs);
    updateClockVisuals(b.clock, blackMs);

    const turn = game ? game.turn() : 'w';
    w.strip.classList.toggle('turn-active', turn === 'w' && !gameOver);
    b.strip.classList.toggle('turn-active', turn === 'b' && !gameOver);
    w.clock.classList.toggle('ticking', turn === 'w' && !gameOver);
    b.clock.classList.toggle('ticking', turn === 'b' && !gameOver);
}
function updateClockVisuals(el, ms) {
    el.classList.toggle('low-time', ms <= 20000 && ms > 10000);
    el.classList.toggle('critical-time', ms <= 10000 && ms > 0);
}
function updatePlayerStrips() {
    const w = stripElFor('w');
    const b = stripElFor('b');
    w.name.textContent = 'White';
    b.name.textContent = 'Black';
    document.getElementById('topPlayerStrip').dataset.color = topColor();
    document.getElementById('bottomPlayerStrip').dataset.color = bottomColor();
    renderClocks();
    renderCaptures();
}

// ---------------- BOARD RENDERING ----------------
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

            // coords: file letters on rank-1 row (bottom edge shown), rank numbers on file-a column
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

            // piece
            const rowIdx = 8 - Number(rank); // boardState row index
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

            // move indicator
            if (legalTargets.includes(id)) {
                const occupied = !!cell;
                const marker = document.createElement('div');
                marker.className = occupied ? 'capture-ring' : 'move-dot';
                sq.appendChild(marker);
            }

            // check highlight
            if (game.inCheck() && cell && cell.type === 'k' && cell.color === game.turn()) {
                sq.classList.add('in-check');
            }
            if (checkmateKingSquare === id) {
                sq.classList.add('checkmate-king');
            }

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
    if (isRemoteGame) return;  // In online mode, moves are made remotely, not by clicking
    if (selectedSquare) {
        if (legalTargets.includes(id)) {
            attemptMove(selectedSquare, id);
            return;
        }
        // reselect if clicking another own piece
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
    if (isRemoteGame) return;  // In online mode, don't allow local square selection
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
    // promotion check
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
            const dur = move.piece === 'p' ? 240 : 200;
            movingPiece.style.transition = `transform ${dur}ms var(--anim-ease)`;
            movingPiece.style.transform = 'translate(0, 0)';
        });
        movingPiece.addEventListener('transitionend', () => {
            movingPiece.style.transition = '';
            movingPiece.style.transform = '';
        }, { once: true });
    }

    // castling: animate the rook too
    if (!reduced && (move.flags.includes('k') || move.flags.includes('q'))) {
        const rank = move.color === 'w' ? '1' : '8';
        const rookFrom = move.flags.includes('k') ? 'h' + rank : 'a' + rank;
        const rookTo = move.flags.includes('k') ? 'f' + rank : 'd' + rank;
        const rookFromSq = boardEl.querySelector(`.sq[data-square="${rookFrom}"]`);
        const rookToSq = boardEl.querySelector(`.sq[data-square="${rookTo}"]`);
        const rookPiece = rookToSq && rookToSq.querySelector('.piece');
        if (rookPiece && rookFromSq && rookToSq) {
            const fRect = rookFromSq.getBoundingClientRect();
            const tRect = rookToSq.getBoundingClientRect();
            const dx = fRect.left - tRect.left;
            const dy = fRect.top - tRect.top;
            rookPiece.style.transition = 'none';
            rookPiece.style.transform = `translate(${dx}px, ${dy}px)`;
            requestAnimationFrame(() => {
                rookPiece.style.transition = 'transform 220ms var(--anim-ease)';
                rookPiece.style.transform = 'translate(0, 0)';
            });
            rookPiece.addEventListener('transitionend', () => {
                rookPiece.style.transition = '';
                rookPiece.style.transform = '';
            }, { once: true });
        }
    }

    animateCapture(move);
    showMoveFeedback(toSq, move);

    if (move.promotion && movingPiece) {
        movingPiece.classList.add('promote-pop');
        movingPiece.addEventListener('animationend', () => movingPiece.classList.remove('promote-pop'), { once: true });
    }
}

function animateCapture(move) {
    if (!move.captured) return;
    const boardEl = document.getElementById('board');
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
    toast.textContent = 'CHECK';
    boardWrap.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 1000);
}

function showCheckmateOverlay(winnerColor, onDone) {
    const boardWrap = document.querySelector('.board-wrap');
    if (!boardWrap) { onDone && onDone(); return; }
    const overlay = document.createElement('div');
    overlay.className = 'checkmate-overlay';
    overlay.innerHTML = `
        <div class="checkmate-card">
            <div class="checkmate-title">CHECKMATE</div>
            <div class="checkmate-winner">${winnerColor === 'w' ? 'White' : 'Black'} wins</div>
        </div>`;
    boardWrap.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('show'));
    const holdTime = prefersReducedMotion() ? 300 : 1300;
    setTimeout(() => {
        overlay.classList.remove('show');
        setTimeout(() => { overlay.remove(); onDone && onDone(); }, 350);
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
            // the capturing side gains the point; captured piece belonged to the opposite color
            const capturerColor = m.color;
            captured[capturerColor].push(m.captured);
        }
    });
    const renderSide = (arr, color) => arr
        .sort((a, b) => PIECE_VALUE[b] - PIECE_VALUE[a])
        .map(t => PIECE_GLYPHS[color === 'w' ? 'b' : 'w'][t])
        .join(' ');
    stripElFor('w').captures.textContent = renderSide(captured.w, 'w');
    stripElFor('b').captures.textContent = renderSide(captured.b, 'b');
}

// ---------------- BOARD FLIP ----------------
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
        const checkNote = game.inCheck() ? ' — check!' : '';
        setStatus(`${turnLabel} to move${checkNote}`, game.inCheck());
        if (game.inCheck()) showCheckNotification();
    }
}

window.offerResign = function () {
    if (gameOver || !game) return;
    if (!confirm('Resign this game?')) return;
    const resigningColor = game.turn();
    const winner = resigningColor === 'w' ? 'b' : 'w';
    if (isRemoteGame) finishRemoteGame(winner, 'resignation');
    endGame('resignation', winner);
    if (isRemoteGame) leaveCurrentGame();
};
window.offerDraw = function () {
    if (gameOver || !game) return;
    if (isRemoteGame) {
        // In remote game, send draw offer to opponent
        if (!currentGameId) return;
        pendingDrawOffer = { from: me, ts: Date.now() };
        // Update game doc to indicate draw offer pending
        const ref = doc(gamesCol, currentGameId);
        updateDoc(ref, { drawOfferFrom: me, drawOfferTs: Date.now() });
        // Show accept/decline buttons for opponent
        showDrawControls(true);
        setOnlineStatus('Draw offer sent to opponent.');
    } else {
        // Local game: just offer draw - the other player can offer too
        if (!confirm('Offer draw to opponent?')) return;
        endGame('agreement', null);
    }
};

// New function to accept a draw offer from opponent
window.acceptDrawOffer = function () {
    if (isRemoteGame && currentGameId && pendingDrawOffer) {
        // Send accept draw to server
        const ref = doc(gamesCol, currentGameId);
        updateDoc(ref, { drawOfferAccepted: me, drawOfferTs: Date.now() });
        endGame('agreement', null);
    } else {
        endGame('agreement', null);
    }
    showDrawControls(false);
};

// New function to decline a draw offer from opponent
window.declineDrawOffer = function () {
    pendingDrawOffer = null;
    showDrawControls(false);
    setOnlineStatus('Draw declined.');
};

// Show/hide draw offer control buttons
function showDrawControls(show) {
    const acceptBtn = document.querySelector('button[onclick="acceptDrawOffer()"]');
    const declineBtn = document.querySelector('button[onclick="declineDrawOffer()"]');
    if (acceptBtn && declineBtn) {
        acceptBtn.style.display = show ? 'inline-block' : 'none';
        declineBtn.style.display = show ? 'inline-block' : 'none';
    }
}

function endGame(reason, winnerColor) {
    if (gameOver) return;
    gameOver = true;
    stopClock();

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

    let title, sub;
    if (winnerColor) {
        title = `${winnerColor === 'w' ? 'White' : 'Black'} wins`;
        sub = REASON_LABEL[reason] || reason;
    } else {
        title = 'Draw';
        sub = REASON_LABEL[reason] || reason;
    }

    const revealResultCard = () => {
        const card = document.getElementById('resultCard');
        card.style.display = 'block';
        card.innerHTML = `<div class="result-banner"><div class="result-title">${title}</div><div class="result-sub">${sub}</div></div>`;
        setStatus(`Game over — ${title.toLowerCase()} (${sub.toLowerCase()}).`, true);
    };

    if (reason === 'checkmate' && game) {
        // find the losing king's square for the strong highlight
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

// ============================================================
// PHASE 2 — Firebase profiles, online matchmaking & challenges
// ============================================================

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
    const el = document.getElementById('cancelSearchBtn');
    if (el) el.style.display = show ? 'inline-flex' : 'none';
}

// ---------------- PROFILE / RATINGS ----------------
async function ensureProfile(uid, name) {
    const ref = doc(playersCol, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    const fresh = { uid, name: name || 'Player', rating: 1200, games: 0, wins: 0, losses: 0, draws: 0, updatedAt: serverTimestamp() };
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
    const fresh = { uid, name: name || 'Player', rating: 1200, games: 0, wins: 0, losses: 0, draws: 0, updatedAt: serverTimestamp() };
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
            if (!gs.exists() || gs.data().resultRecorded) return; // another client already recorded
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
        recordedGameIds.delete(g.id); // allow a retry on next snapshot
    }
    loadRecentGames().catch(() => { });
    refreshProfileStats().catch(() => { });
}

// ---------------- RESULT DETECTION ----------------
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
    selectedSquare = null; legalTargets = [];
    renderBoard(); renderMoveList(); renderCaptures();
}

// ---------------- REMOTE GAME SYNC ----------------
async function finishRemoteGame(winnerColor, reason) {
    if (!currentGameId) return;
    try {
        await updateDoc(doc(gamesCol, currentGameId), {
            finished: true,
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
    if (startedForId !== currentGameId) {
        beginGame((g.baseMs || 300000) / 1000, (g.incMs || 0) / 1000);
        startedForId = currentGameId;
    }
    rebuildFromMoves(g.moves);
    if (g.whiteMs != null) whiteMs = g.whiteMs;
    if (g.blackMs != null) blackMs = g.blackMs;
    renderClocks();
    startClock(game.turn());
    // Handle draw offer from opponent
    if (g.drawOfferFrom && g.drawOfferFrom !== me && !pendingDrawOffer) {
        // Opponent offered a draw - show accept/decline buttons
        pendingDrawOffer = { from: g.drawOfferFrom, ts: g.drawOfferTs || Date.now() };
        showDrawControls(true);
    }
    const res = detectResult();
    if (g.finished) {
        if (!gameOver) endGame(g.reason || (res && res.reason) || 'agreement', g.winnerColor);
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
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    document.getElementById('resultCard').style.display = 'none';
    const ref = doc(gamesCol, id);
    gameUnsub = onSnapshot(ref, onGameSnap, (err) => {
        console.warn('game snap err', err);
        setOnlineStatus('Connection error.');
    });
    setOnlineStatus('Connected to game.');
}
function leaveCurrentGame() {
    if (gameUnsub) { gameUnsub(); gameUnsub = null; }
    currentGameId = null;
    isRemoteGame = false;
    startedForId = null;
    gameOver = false;
    stopClock();
}
async function cancelOnlineSearch() {
    if (waitingGameId) {
        try { await deleteDoc(doc(gamesCol, waitingGameId)); } catch (e) { }
        waitingGameId = null;
    }
    showCancelSearch(false);
    setOnlineStatus('');
}

// ---------------- ONLINE MATCHMAKING ----------------
async function findOrCreateOnlineGame(base, inc) {
    setOnlineStatus('Searching for opponent…');
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
            // Reuse my own still-open waiting game
            waitingGameId = myWaiting.id;
            setOnlineStatus('Waiting for an opponent… (Cancel to stop)');
            showCancelSearch(true);
            return;
        }
        if (target) {
            await updateDoc(doc(gamesCol, target.id), {
                blackUid: me, blackName: myName, status: 'active', lastMoveTs: Date.now()
            });
            setOnlineStatus('Opponent found! Joining…');
        } else {
            const ref = await addDoc(gamesCol, {
                whiteUid: me, whiteName: myName, blackUid: '', blackName: '',
                status: 'waiting', baseMs: base * 1000, incMs: inc * 1000,
                moves: [], turn: 'w', whiteMs: base * 1000, blackMs: base * 1000,
                lastMoveTs: Date.now(), createdAt: serverTimestamp()
            });
            waitingGameId = ref.id;
            setOnlineStatus('Waiting for an opponent… (Cancel to stop)');
            showCancelSearch(true);
        }
    } catch (e) {
        console.warn('findOrCreateOnlineGame failed', e);
        setOnlineStatus('Could not start matchmaking: ' + (e.message || e));
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
    setChallengeStatus('Looking up player…');
    try {
        const [s1, s2] = await Promise.all([
            getDocs(query(collection(db, 'users'), where('username', '==', opponentInput))),
            getDocs(query(collection(db, 'users'), where('email', '==', opponentInput)))
        ]);
        let opp = null;
        if (!s1.empty) opp = { uid: s1.docs[0].id, ...s1.docs[0].data() };
        else if (!s2.empty) opp = { uid: s2.docs[0].id, ...s2.docs[0].data() };
        if (!opp) { setChallengeStatus('No player found with that username/email.'); return; }
        if (opp.uid === me) { setChallengeStatus("You can't challenge yourself."); return; }
        const oppName = opp.name || opp.username || opp.email;
        await addDoc(challengesCol, {
            challengerUid: me, challengerName: myName,
            opponentUid: opp.uid, opponentName: oppName,
            status: 'pending', baseMs: tcBase * 1000, incMs: tcInc * 1000,
            createdAt: serverTimestamp()
        });
        setChallengeStatus('Challenge sent to ' + oppName + '.');
        addDoc(activityCol, {
            type: 'challenge', uid: me, name: myName,
            toUid: opp.uid, toName: oppName, createdAt: serverTimestamp()
        }).catch(() => { });
    } catch (e) {
        setChallengeStatus('Could not send challenge: ' + (e.message || e));
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
    if (!pending.length) { el.innerHTML = '<div class="empty-note">No incoming challenges.</div>'; return; }
    let html = '';
    pending.forEach(d => {
        const c = d.data();
        html += '<div class="challenge-row"><span>' + (c.challengerName || 'Someone') +
            ' challenged you</span>' +
            '<button class="btn-secondary" onclick="acceptChessChallenge(\'' + d.id + '\')">Accept</button>' +
            '<button class="btn-ghost-chess" onclick="declineChessChallenge(\'' + d.id + '\')">Decline</button></div>';
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
        setChallengeStatus('Could not accept: ' + (e.message || e));
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
    if (!games.length) { el.innerHTML = '<div class="empty-note">No games yet.</div>'; return; }
    el.innerHTML = games.map(g => {
        const youAreWhite = g.whiteUid === me;
        const opp = youAreWhite ? (g.blackName || 'Opponent') : (g.whiteName || 'Opponent');
        let res = 'In progress';
        if (g.finished) {
            res = g.winnerColor == null ? 'Draw'
                : (g.winnerColor === (youAreWhite ? 'w' : 'b') ? 'You won' : 'You lost');
        }
        return '<div class="recent-game"><span>' + (youAreWhite ? 'White' : 'Black') + ' vs ' + opp +
            '</span><span class="rg-result">' + res + '</span></div>';
    }).join('');
}

// ---------------- INIT ----------------
async function initPhase2(user) {
    currentUser = user;
    me = user.uid;
    myName = user.displayName || user.email || 'Player';
    try { await refreshProfileStats(); } catch (e) { }
    setupMyGamesListener();
    setupChallengesListener();
    loadRecentGames().catch(() => { });
}

// ---------------- UI WIRING (window-exposed) ----------------
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
    document.getElementById('challengeStatus').textContent = '';
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
    if (!input) { setChallengeStatus('Enter a username or email.'); return; }
    sendChessChallenge(input, base, inc);
};
window.acceptChessChallenge = acceptChessChallenge;
window.declineChessChallenge = declineChessChallenge;

function setStatus(text, important) {
    const el = document.getElementById('statusLine');
    el.textContent = text;
    el.className = 'status-line' + (important ? ' important' : '');
}
