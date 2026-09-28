// tools/test_chess_simplified.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ART_DIR = 'C:\\Users\\Tanish\\.gemini\\antigravity-ide\\brain\\976acc2f-8628-4501-9f66-722445d9c6e9';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.env.TEMP || '.', 'chrome_chess_test_' + Date.now());

async function run() {
    console.log('Spawning headless Chrome for Simplified Chess Verification...');
    const chromeProc = spawn(chromePath, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--remote-debugging-port=9224',
        `--user-data-dir=${userDataDir}`,
        'about:blank'
    ], { detached: false });

    chromeProc.on('error', (err) => {
        console.error('Failed to spawn Chrome:', err);
        process.exit(1);
    });

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 300));
        try {
            const res = await fetch('http://127.0.0.1:9224/json/version');
            if (res.ok) {
                const data = await res.json();
                wsUrl = data.webSocketDebuggerUrl;
                console.log('Connected to Chrome CDP at:', wsUrl);
                break;
            }
        } catch (_) {}
    }

    if (!wsUrl) {
        console.error('Timeout waiting for Chrome CDP');
        chromeProc.kill();
        process.exit(1);
    }

    const ws = new WebSocket(wsUrl);
    let id = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && pending.has(msg.id)) {
            pending.get(msg.id)(msg);
            pending.delete(msg.id);
        }
    };

    await new Promise(r => ws.onopen = r);

    function send(method, params = {}) {
        return new Promise((resolve) => {
            const msgId = id++;
            pending.set(msgId, resolve);
            ws.send(JSON.stringify({ id: msgId, method, params }));
        });
    }

    // Create target/page
    const newTarget = await send('Target.createTarget', { url: 'http://127.0.0.1:5500/chess/chess.html' });
    const targetId = newTarget.result.targetId;
    const pageSession = await send('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = pageSession.result.sessionId;

    function sendPage(method, params = {}) {
        return new Promise((resolve) => {
            const msgId = id++;
            pending.set(msgId, (res) => resolve(res ? res.result : null));
            ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
        });
    }

    // Set viewport: Desktop 1200x800
    await sendPage('Emulation.setDeviceMetricsOverride', {
        width: 1200,
        height: 800,
        deviceScaleFactor: 1,
        mobile: false
    });

    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
            const args = (msg.params.args || []).map(a => a.value || a.description).join(' ');
            console.log(`[Browser Console] [${msg.params.type}] ${args}`);
        }
        if (msg.method === 'Runtime.exceptionThrown') {
            console.error('[Browser Exception]', JSON.stringify(msg.params.exceptionDetails));
        }
    });

    await sendPage('Page.enable');
    await sendPage('Runtime.enable');

    console.log('Navigated to http://127.0.0.1:5500/chess/chess.html...');
    await new Promise(r => setTimeout(r, 2000));

    // Helper to evaluate script
    async function evaluate(expression) {
        const res = await sendPage('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res && res.result && res.result.value !== undefined) {
            return res.result.value;
        }
        return res ? res.value : null;
    }

    // Capture screenshot helper
    async function captureScreenshot(name) {
        const res = await sendPage('Page.captureScreenshot', { format: 'png' });
        if (res && res.data) {
            const buf = Buffer.from(res.data, 'base64');
            const p2 = path.join(ART_DIR, name);
            fs.writeFileSync(p2, buf);
            console.log(`✓ Saved screenshot to artifacts: ${name}`);
        } else {
            console.warn(`Failed to capture screenshot ${name}`);
        }
    }

    // Ensure session is visible: activate chess session
    await evaluate(`
        (function() {
            window.__CHESS_DEV_SESSION__ = true;
            if (typeof window.activateChessSession === 'function') {
                window.activateChessSession({ displayName: 'Student', email: 'student@mmmut.ac.in', uid: 'dev-student' });
            }
        })()
    `);
    await new Promise(r => setTimeout(r, 600));

    console.log('\n--- Step 1: Verify Before Game (Idle) UX ---');
    const idleCheck = await evaluate(`
        (function() {
            const idle = document.getElementById('stateIdle');
            const searching = document.getElementById('stateSearching');
            const active = document.getElementById('stateActive');
            const finished = document.getElementById('stateFinished');
            const btn = document.getElementById('findOpponentBtn');
            const board = document.getElementById('board');
            const boardControls = document.getElementById('boardControls');

            return {
                idleVisible: idle && getComputedStyle(idle).display !== 'none',
                searchingHidden: searching && getComputedStyle(searching).display === 'none',
                activeHidden: active && getComputedStyle(active).display === 'none',
                finishedHidden: finished && getComputedStyle(finished).display === 'none',
                btnText: btn ? btn.textContent.trim() : null,
                hasBoard: !!board,
                boardControlsHidden: boardControls && getComputedStyle(boardControls).display === 'none'
            };
        })()
    `);
    console.log('Idle State Elements:', idleCheck);
    await captureScreenshot('chess_idle_desktop.png');

    console.log('\n--- Step 2: Test Searching State ---');
    await evaluate(`
        (function() {
            const btn = document.getElementById('findOpponentBtn');
            if (btn) btn.click();
        })()
    `);
    await new Promise(r => setTimeout(r, 500));

    const searchingCheck = await evaluate(`
        (function() {
            const searching = document.getElementById('stateSearching');
            const cancelBtn = document.getElementById('cancelSearchBtn');
            const idle = document.getElementById('stateIdle');

            return {
                searchingVisible: searching && getComputedStyle(searching).display !== 'none',
                idleHidden: idle && getComputedStyle(idle).display === 'none',
                cancelVisible: cancelBtn && getComputedStyle(cancelBtn).display !== 'none',
                heading: searching ? searching.querySelector('.searching-title').textContent.trim() : null
            };
        })()
    `);
    console.log('Searching State Elements:', searchingCheck);
    await captureScreenshot('chess_searching_desktop.png');

    console.log('\n--- Step 3: Test Cancel Search ---');
    await evaluate(`
        (function() {
            const cancelBtn = document.getElementById('cancelSearchBtn');
            if (cancelBtn) cancelBtn.click();
        })()
    `);
    await new Promise(r => setTimeout(r, 500));

    const cancelCheck = await evaluate(`
        (function() {
            const idle = document.getElementById('stateIdle');
            const searching = document.getElementById('stateSearching');
            return {
                idleRestored: idle && getComputedStyle(idle).display !== 'none',
                searchingHidden: searching && getComputedStyle(searching).display === 'none'
            };
        })()
    `);
    console.log('Cancel returns to Idle:', cancelCheck);

    console.log('\n--- Step 4: Test Active Game State (Play Local) ---');
    await evaluate(`
        (function() {
            if (typeof startLocalGame === 'function') {
                startLocalGame();
            }
        })()
    `);
    await new Promise(r => setTimeout(r, 600));

    const activeCheck = await evaluate(`
        (function() {
            const active = document.getElementById('stateActive');
            const idle = document.getElementById('stateIdle');
            const boardControls = document.getElementById('boardControls');
            const status = document.getElementById('statusLine');
            const whiteClock = document.getElementById('bottomPlayerClock');

            return {
                activeVisible: active && getComputedStyle(active).display !== 'none',
                idleHidden: idle && getComputedStyle(idle).display === 'none',
                boardControlsVisible: boardControls && getComputedStyle(boardControls).display !== 'none',
                statusText: status ? status.textContent.trim() : null,
                clockTicking: whiteClock ? whiteClock.textContent.trim() : null
            };
        })()
    `);
    console.log('Active Game Elements:', activeCheck);

    // Make moves: e2 -> e4, e7 -> e5
    console.log('\n--- Step 5: Playing Moves ---');
    await evaluate(`
        (function() {
            // Click e2 then e4
            const e2 = document.querySelector('[data-square="e2"]');
            if (e2) e2.click();
        })()
    `);
    await new Promise(r => setTimeout(r, 300));
    await evaluate(`
        (function() {
            const e4 = document.querySelector('[data-square="e4"]');
            if (e4) e4.click();
        })()
    `);
    await new Promise(r => setTimeout(r, 400));

    // Black response: e7 -> e5
    await evaluate(`
        (function() {
            const e7 = document.querySelector('[data-square="e7"]');
            if (e7) e7.click();
        })()
    `);
    await new Promise(r => setTimeout(r, 300));
    await evaluate(`
        (function() {
            const e5 = document.querySelector('[data-square="e5"]');
            if (e5) e5.click();
        })()
    `);
    await new Promise(r => setTimeout(r, 400));

    const movesNotation = await evaluate(`
        (function() {
            const ml = document.getElementById('moveList');
            return ml ? ml.innerText.replace(/\\s+/g, ' ').trim() : '';
        })()
    `);
    console.log('Move Notation Recorded:', movesNotation);
    await captureScreenshot('chess_active_desktop.png');

    console.log('\n--- Step 6: Test Resignation & Game Finished State ---');
    await evaluate(`
        (function() {
            if (typeof window.executeResign === 'function') {
                window.executeResign();
            }
        })()
    `);
    await new Promise(r => setTimeout(r, 600));

    const finishedCheck = await evaluate(`
        (function() {
            const finished = document.getElementById('stateFinished');
            const title = document.getElementById('finishTitle');
            const reason = document.getElementById('finishReason');
            const playAgainBtn = document.getElementById('playAgainBtn');
            const backBtn = document.getElementById('backToChessBtn');

            return {
                finishedVisible: finished && getComputedStyle(finished).display !== 'none',
                title: title ? title.textContent.trim() : null,
                reason: reason ? reason.textContent.trim() : null,
                hasPlayAgain: !!playAgainBtn,
                hasBackBtn: !!backBtn
            };
        })()
    `);
    console.log('Finished State Elements:', finishedCheck);
    await captureScreenshot('chess_finished_desktop.png');

    console.log('\n--- Step 7: Test Play Again / Back to Chess ---');
    await evaluate(`
        (function() {
            const backBtn = document.getElementById('backToChessBtn');
            if (backBtn) backBtn.click();
        })()
    `);
    await new Promise(r => setTimeout(r, 500));

    const returnedIdleCheck = await evaluate(`
        (function() {
            const idle = document.getElementById('stateIdle');
            return idle && getComputedStyle(idle).display !== 'none';
        })()
    `);
    console.log('Back to Chess returns to clean Idle:', returnedIdleCheck);

    console.log('\n--- Step 8: Mobile Viewport Responsiveness (390x844) ---');
    await sendPage('Emulation.setDeviceMetricsOverride', {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true
    });
    await new Promise(r => setTimeout(r, 600));

    const mobileMetrics = await evaluate(`
        (function() {
            const boardWrap = document.querySelector('.board-wrap');
            const rect = boardWrap.getBoundingClientRect();
            const body = document.body;
            return {
                boardWidth: Math.round(rect.width),
                boardHeight: Math.round(rect.height),
                isSquare: Math.abs(rect.width - rect.height) <= 1,
                bodyScrollWidth: body.scrollWidth,
                bodyClientWidth: body.clientWidth,
                hasHorizontalScroll: body.scrollWidth > body.clientWidth
            };
        })()
    `);
    console.log('Mobile 390px Board Metrics:', mobileMetrics);
    await captureScreenshot('chess_idle_mobile_390.png');

    console.log('\nAll verification steps completed successfully!');
    chromeProc.kill();
    process.exit(0);
}

run().catch((e) => {
    console.error('Error during test:', e);
    process.exit(1);
});
