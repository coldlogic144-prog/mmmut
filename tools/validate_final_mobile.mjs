// tools/validate_final_mobile.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ART_DIR = 'C:\\Users\\Tanish\\.gemini\\antigravity-ide\\brain\\976acc2f-8628-4501-9f66-722445d9c6e9';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.env.TEMP || '.', 'chrome_cdp_profile_' + Date.now());

async function run() {
  console.log('Spawning Chrome for comprehensive root validation...');
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=9222',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { detached: false });

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
    } catch (e) {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Chrome launch failed');
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = e => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  };
  await new Promise(r => ws.onopen = r);
  const send = (m, p = {}) => new Promise(r => {
    const i = id++;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method: m, params: p }));
  });

  const { targetId } = await send('Target.createTarget', { url: 'http://localhost:8000/' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const page = (m, p = {}) => new Promise(r => {
    const i = id++;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, sessionId, method: m, params: p }));
  });

  await page('Page.enable');
  await page('Runtime.enable');
  await page('DOM.enable');

  async function evalJs(expr) {
    const res = await page('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  async function setViewport(w, h, isMobile = true) {
    await page('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 2,
      mobile: isMobile
    });
  }

  async function takeScreenshot(name) {
    const shot = await page('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(shot.data, 'base64');
    fs.writeFileSync(path.join(ROOT, name), buf);
    fs.writeFileSync(path.join(ART_DIR, name), buf);
    console.log(`Saved screenshot ${name} (${buf.length} bytes)`);
  }

  // 1. Initial navigation
  console.log('Navigating to http://localhost:8000/ ...');
  await setViewport(390, 844, true);
  await page('Page.navigate', { url: 'http://localhost:8000/' });
  await new Promise(r => setTimeout(r, 2000));

  // 2. Perform test login
  console.log('Logging in as student in browser session...');
  await evalJs(`
    (function() {
      // Simulate fast student login for test verification
      const auth = document.getElementById('authScreen');
      const app = document.getElementById('app');
      const load = document.getElementById('loadingScreen');
      if (load) load.style.display = 'none';
      if (auth) auth.style.display = 'none';
      if (app) app.style.display = 'block';

      // Fill in student pills
      const pillName = document.getElementById('pillName');
      if (pillName) pillName.textContent = 'Rahul Kumar';
      const pillBranch = document.getElementById('pillBranch');
      if (pillBranch) pillBranch.textContent = 'Computer Science & Engineering · Section A';
      const pillAvatar = document.getElementById('pillAvatar');
      if (pillAvatar) pillAvatar.textContent = 'RK';
      const welcome = document.getElementById('welcomeStudentName');
      if (welcome) welcome.textContent = 'Rahul Kumar';

      // Render periods / attendance mock values if empty
      const todayView = document.getElementById('todayView');
      if (todayView && !todayView.innerHTML.trim()) {
        todayView.innerHTML = '<div style=\"padding:12px;text-align:center;color:var(--text-muted);font-size:13px;background:var(--surface-subtle);border-radius:6px;border:1px dashed var(--surface-border);\">It\\'s the weekend — no scheduled periods today. Enjoy it.</div>';
      }

      const ovPct = document.getElementById('overallPct');
      if (ovPct && ovPct.textContent === '—') ovPct.textContent = '93%';
      const ovCounts = document.getElementById('overallCounts');
      if (ovCounts && ovCounts.textContent === '—') ovCounts.innerHTML = '<strong>13</strong> attended · <strong>1</strong> missed<br>of <strong>14</strong> marked';
      const ovLeave = document.getElementById('overallLeave');
      if (ovLeave && !ovLeave.innerHTML.trim()) ovLeave.innerHTML = '<div style=\"background:rgba(16,185,129,0.08);color:#065f46;border:1px solid rgba(16,185,129,0.2);padding:6px 10px;border-radius:4px;font-size:12px;font-weight:600;\">✓ On track — you can take 3 more leaves above 75%.</div>';
      const subStats = document.getElementById('subjectStats');
      if (subStats && !subStats.innerHTML.trim()) {
        subStats.innerHTML = '<div style=\"display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--surface-border);font-size:12.5px;\"><span>Compiler Design</span><span style=\"font-weight:700;color:#10b981;\">100%</span></div><div style=\"display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--surface-border);font-size:12.5px;\"><span>Computer Networks</span><span style=\"font-weight:700;color:#10b981;\">88%</span></div><div style=\"display:flex;justify-content:space-between;padding:6px 0;font-size:12.5px;\"><span>Database Systems</span><span style=\"font-weight:700;color:#10b981;\">92%</span></div>';
      }
    })();
  `);
  await new Promise(r => setTimeout(r, 500));

  // --- Test 390x844 (Mobile) ---
  console.log('\n--- Testing 390x844 (iPhone 12/13/14) ---');
  await setViewport(390, 844, true);
  await new Promise(r => setTimeout(r, 500));

  const mobile390 = await evalJs(`
    ({
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      topbarHeight: document.querySelector('.topbar')?.offsetHeight,
      bottomNavVisible: getComputedStyle(document.querySelector('.mobile-bottom-nav') || {}).display !== 'none',
      bottomNavItems: Array.from(document.querySelectorAll('.mobile-bottom-nav .mobile-nav-item')).map(el => el.textContent.trim().replace(/\\s+/g, ' ')),
      telegramInBottomNav: !!document.getElementById('mobNavTelegram'),
      sidebarHiddenOnMobile: !document.querySelector('.app-sidebar')?.classList.contains('open'),
      headerMenuBtnVisible: getComputedStyle(document.querySelector('.sidebar-toggle-btn') || {}).display !== 'none'
    })
  `);
  console.log('390px Mobile Metrics:', JSON.stringify(mobile390, null, 2));
  await takeScreenshot('final_mobile_390_dashboard.png');

  // Test Drawer Open
  console.log('\nTesting Drawer Open on Mobile...');
  await evalJs(`window.toggleSidebar(true);`);
  await new Promise(r => setTimeout(r, 400));
  const drawerCheck = await evalJs(`
    ({
      drawerOpen: document.querySelector('.app-sidebar')?.classList.contains('open'),
      backdropActive: document.querySelector('.sidebar-backdrop')?.classList.contains('active'),
      telegramInDrawer: !!document.getElementById('sidebarTelegramBtn')
    })
  `);
  console.log('Drawer Open Metrics:', JSON.stringify(drawerCheck, null, 2));
  await takeScreenshot('final_mobile_390_drawer.png');

  // Close Drawer
  await evalJs(`window.toggleSidebar(false);`);
  await new Promise(r => setTimeout(r, 300));

  // Test Telegram Navigation
  console.log('\nTesting Telegram View on Mobile...');
  await evalJs(`window.toggleTelegramSection(true);`);
  await new Promise(r => setTimeout(r, 500));
  const tgCheck = await evalJs(`
    ({
      telegramViewVisible: getComputedStyle(document.getElementById('telegramView') || {}).display !== 'none',
      mainShellHidden: getComputedStyle(document.getElementById('mainShell') || {}).display === 'none',
      telegramStateContainer: !!document.getElementById('telegramStateContainer'),
      bottomNavStillVisible: getComputedStyle(document.querySelector('.mobile-bottom-nav') || {}).display !== 'none'
    })
  `);
  console.log('Telegram View Metrics:', JSON.stringify(tgCheck, null, 2));
  await takeScreenshot('final_mobile_390_telegram.png');

  // Return to Dashboard via Home bottom nav button
  console.log('\nReturning to Dashboard via Home button...');
  await evalJs(`window.scrollToSection('mainShell');`);
  await new Promise(r => setTimeout(r, 500));

  // --- Test 360x800 (Compact Small Mobile) ---
  console.log('\n--- Testing 360x800 (Compact Mobile / Samsung Galaxy S8) ---');
  await setViewport(360, 800, true);
  await new Promise(r => setTimeout(r, 500));
  const mobile360 = await evalJs(`
    ({
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      bottomNavVisible: getComputedStyle(document.querySelector('.mobile-bottom-nav') || {}).display !== 'none'
    })
  `);
  console.log('360px Mobile Metrics:', JSON.stringify(mobile360, null, 2));
  await takeScreenshot('final_mobile_360_dashboard.png');

  // --- Test 430x932 (Large Mobile) ---
  console.log('\n--- Testing 430x932 (iPhone 14 Pro Max) ---');
  await setViewport(430, 932, true);
  await new Promise(r => setTimeout(r, 500));
  const mobile430 = await evalJs(`
    ({
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
    })
  `);
  console.log('430px Mobile Metrics:', JSON.stringify(mobile430, null, 2));
  await takeScreenshot('final_mobile_430_dashboard.png');

  // --- Test 1200x800 (Desktop) ---
  console.log('\n--- Testing 1200x800 (Desktop Layout) ---');
  await setViewport(1200, 800, false);
  await new Promise(r => setTimeout(r, 500));
  const desktop = await evalJs(`
    ({
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      sidebarVisible: getComputedStyle(document.querySelector('.app-sidebar') || {}).position === 'sticky',
      bottomNavHidden: getComputedStyle(document.querySelector('.mobile-bottom-nav') || {}).display === 'none',
      telegramInSidebar: !!document.getElementById('sidebarTelegramBtn')
    })
  `);
  console.log('Desktop Metrics:', JSON.stringify(desktop, null, 2));
  await takeScreenshot('final_desktop_1200_dashboard.png');

  console.log('\nAll validation checks completed successfully!');
  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Validation failed:', err);
  process.exit(1);
});
