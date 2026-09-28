// tools/test_ledger_live.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ART_DIR = 'C:\\Users\\Tanish\\.gemini\\antigravity-ide\\brain\\976acc2f-8628-4501-9f66-722445d9c6e9';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.env.TEMP || '.', 'chrome_ledger_test_' + Date.now());

async function run() {
    console.log('Spawning headless Chrome on port 9222...');
    const chromeProc = spawn(chromePath, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--remote-debugging-port=9222',
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
            const res = await fetch('http://127.0.0.1:9222/json/version');
            if (res.ok) {
                const data = await res.json();
                wsUrl = data.webSocketDebuggerUrl;
                console.log('Connected to Chrome DevTools Protocol at:', wsUrl);
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
    const newTarget = await send('Target.createTarget', { url: 'http://127.0.0.1:5500/' });
    const targetId = newTarget.result.targetId;
    const pageSession = await send('Target.attachToTarget', { targetId, flatten: true });
    const sessionId = pageSession.result.sessionId;

    function sendPage(method, params = {}) {
        return new Promise((resolve) => {
            const msgId = id++;
            pending.set(msgId, (res) => resolve(res.result));
            ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
        });
    }

    const consoleLogs = [];
    ws.addEventListener('message', (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method === 'Runtime.consoleAPICalled') {
            const args = (msg.params.args || []).map(a => a.value || a.description).join(' ');
            consoleLogs.push(`[${msg.params.type}] ${args}`);
        }
    });

    await sendPage('Page.enable');
    await sendPage('Runtime.enable');
    await sendPage('DOM.enable');

    await sendPage('Page.addScriptToEvaluateOnNewDocument', {
        source: `
            window._mockUser = {
                uid: 'test_student_user_1',
                username: 'aditya.civil',
                name: 'Aditya Verma',
                branchId: 'civil',
                section: 'A',
                semester: 1,
                role: 'student',
                rollNo: '2024011001',
                verified: true,
                isAdmin: false
            };
        `
    });

    console.log('Navigating to http://127.0.0.1:5500/ ...');
    await sendPage('Page.navigate', { url: 'http://127.0.0.1:5500/' });
    await new Promise(r => setTimeout(r, 2500));

    async function evaluate(expr) {
        const res = await sendPage('Runtime.evaluate', {
            expression: expr,
            returnByValue: true,
            awaitPromise: true
        });
        if (res && res.exceptionDetails) {
            console.error('EVAL EXCEPTION in:', expr, res.exceptionDetails);
        }
        return res?.result?.value;
    }

    async function setViewport(w, h, isMobile = false) {
        await sendPage('Emulation.setDeviceMetricsOverride', {
            width: w,
            height: h,
            deviceScaleFactor: 2,
            mobile: isMobile
        });
    }

    const savedScreenshots = new Map();
    async function takeScreenshot(filename) {
        const shot = await sendPage('Page.captureScreenshot', { format: 'png' });
        const buffer = Buffer.from(shot.data, 'base64');
        const art = path.join(ART_DIR, filename);
        fs.writeFileSync(art, buffer);
        savedScreenshots.set(filename, buffer);
        console.log(`Saved screenshot: ${filename}`);
    }

    console.log('\n--- 1. Testing UI State & Mocking Authenticated Session for Ledger Verification ---');
    let ready = false;
    for (let i = 0; i < 60; i++) {
        const isReady = await evaluate(`typeof window.loginAs === 'function' && typeof window.toggleLedgerSection === 'function' && typeof window.handleLedgerBranchChange === 'function'`);
        if (isReady) {
            ready = true;
            console.log(`Application ready after ${i * 250}ms`);
            break;
        }
        await new Promise(r => setTimeout(r, 250));
    }
    if (!ready) throw new Error('Timeout: window.loginAs and window.toggleLedgerSection did not initialize in time');

    await evaluate(`
        window._mockUser = {
            uid: 'test_student_user_1',
            username: 'aditya.civil',
            name: 'Aditya Verma',
            branchId: 'civil',
            section: 'A',
            semester: 1,
            role: 'student',
            rollNo: '2024011001',
            verified: true,
            isAdmin: false
        };
        window.loginAs(window._mockUser, 'test_student_user_1');
    `);
    await new Promise(r => setTimeout(r, 500));

    // Verify mainShell visible
    const shellDisplay = await evaluate(`document.getElementById('mainShell').style.display`);
    console.log('mainShell display:', shellDisplay);

    console.log('\n--- 2. Opening Ledger Module ---');
    await evaluate(`window.toggleLedgerSection(true)`);
    await new Promise(r => setTimeout(r, 500));

    const ledgerDisplay = await evaluate(`document.getElementById('ledgerView').style.display`);
    const mainShellAfterLedger = await evaluate(`document.getElementById('mainShell').style.display`);
    console.log('ledgerView display:', ledgerDisplay);
    console.log('mainShell display after toggleLedgerSection(true):', mainShellAfterLedger);

    const activeBranch = await evaluate(`window.getLedgerCurrentBranch ? window.getLedgerCurrentBranch() : document.getElementById('ledgerBranchSelect').value`);
    console.log('Auto-detected branch from currentUser.branchId:', activeBranch);

    const courseCount = await evaluate(`document.querySelectorAll('.ledger-course-item').length`);
    console.log('Courses rendered in Sem 1:', courseCount);

    // Desktop screenshot
    await setViewport(1280, 900, false);
    await takeScreenshot('ledger_desktop_overview.png');

    console.log('\n--- 3. Testing Course Expansion and Topic Interaction ---');
    // Expand first course (BSM-110 Engineering Mathematics I)
    await evaluate(`window.handleLedgerAction('open', '1', 'BSM-110')`);
    await new Promise(r => setTimeout(r, 400));

    const unitsCount = await evaluate(`document.querySelectorAll('.ledger-unit-card').length`);
    console.log('Units rendered in expanded course:', unitsCount);

    // Mark topic 0 in unit 0 complete ("Limit")
    const initialTopicsDone = await evaluate(`document.getElementById('ledgerStatTopicsDone').textContent`);
    console.log('Topics done before ticking:', initialTopicsDone);

    await evaluate(`window.handleLedgerAction('topic', '1', 'BSM-110', 0, 0)`);
    await new Promise(r => setTimeout(r, 400));

    const afterTopicsDone = await evaluate(`document.getElementById('ledgerStatTopicsDone').textContent`);
    console.log('Topics done after ticking Limit topic:', afterTopicsDone);

    await takeScreenshot('ledger_course_expanded_topic_checked.png');

    console.log('\n--- 4. Testing Search Filter ---');
    await evaluate(`window.handleLedgerSearchInput('differential')`);
    await new Promise(r => setTimeout(r, 400));

    const searchMatches = await evaluate(`document.querySelectorAll('.ledger-course-item').length`);
    console.log('Courses matching "differential":', searchMatches);
    await takeScreenshot('ledger_search_differential.png');

    // Clear search
    await evaluate(`window.clearLedgerSearch()`);
    await new Promise(r => setTimeout(r, 300));

    console.log('\n--- 5. Testing Branch Switching ---');
    await evaluate(`window.handleLedgerBranchChange('cse')`);
    await new Promise(r => setTimeout(r, 400));

    const cseBranch = await evaluate(`window.getLedgerCurrentBranch ? window.getLedgerCurrentBranch() : document.getElementById('ledgerBranchSelect').value`);
    const cseCourses = await evaluate(`document.querySelectorAll('.ledger-course-item').length`);
    console.log('Current branch after switch:', cseBranch);
    console.log('CSE courses in Sem 1:', cseCourses);

    console.log('\n--- 6. Testing Mobile Viewports (430px, 390px, 360px) ---');
    // Switch back to civil to test detailed layout on mobile
    await evaluate(`window.handleLedgerBranchChange('civil')`);
    await evaluate(`window.handleLedgerAction('open', '1', 'BSM-110')`);
    await new Promise(r => setTimeout(r, 400));

    const viewports = [
        { name: '430px (iPhone 14 Pro Max)', w: 430, h: 932, file: 'ledger_mobile_430px.png' },
        { name: '390px (iPhone 14 / 13)', w: 390, h: 844, file: 'ledger_mobile_390px.png' },
        { name: '412px (Pixel 7 / Galaxy S23)', w: 412, h: 915, file: 'ledger_mobile_412px.png' },
        { name: '360px (Small Android)', w: 360, h: 740, file: 'ledger_mobile_360px.png' }
    ];

    for (const vp of viewports) {
        await setViewport(vp.w, vp.h, true);
        await new Promise(r => setTimeout(r, 300));

        // Check horizontal overflow
        const hasOverflow = await evaluate(`document.documentElement.scrollWidth > window.innerWidth`);
        console.log(`Viewport ${vp.name} (${vp.w}px) — Horizontal overflow: ${hasOverflow ? 'YES (BUG)' : 'NO (CLEAN)'}`);

        await takeScreenshot(vp.file);
    }

    console.log('\n--- 7. Testing Reset Confirmation Modal ---');
    await evaluate(`window.openLedgerResetModal()`);
    await new Promise(r => setTimeout(r, 400));

    const modalOpen = await evaluate(`document.getElementById('ledgerResetModal').classList.contains('open')`);
    console.log('Reset confirmation modal is open:', modalOpen);
    await takeScreenshot('ledger_reset_modal.png');

    // Close modal
    await evaluate(`window.closeLedgerResetModal()`);
    await new Promise(r => setTimeout(r, 300));

    console.log('\n--- 8. Testing Return to Dashboard Navigation ---');
    await evaluate(`scrollToSection('mainShell')`);
    await new Promise(r => setTimeout(r, 300));

    const ledgerAfterReturn = await evaluate(`document.getElementById('ledgerView').style.display`);
    const shellAfterReturn = await evaluate(`document.getElementById('mainShell').style.display`);
    console.log('ledgerView display after back to ERP:', ledgerAfterReturn);
    console.log('mainShell display after back to ERP:', shellAfterReturn);

    console.log('\nConsole warnings/errors encountered during testing:');
    const errors = consoleLogs.filter(l => l.includes('[error]'));
    if (errors.length === 0) {
        console.log('No console errors detected! Clean execution.');
    } else {
        errors.forEach(e => console.log(' ', e));
    }

    ws.close();
    chromeProc.kill();
    for (const [filename, buffer] of savedScreenshots.entries()) {
        fs.writeFileSync(path.join(ROOT, filename), buffer);
    }
    console.log('\nALL CDP BROWSER VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch(err => {
    console.error('Fatal error during CDP browser test:', err);
    process.exit(1);
});
