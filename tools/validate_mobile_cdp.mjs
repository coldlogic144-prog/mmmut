// tools/validate_mobile_cdp.mjs
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
  console.log('Starting headless Chrome with remote debugging on port 9222...');
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

  // Wait for Chrome debugging endpoint
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
  const newTarget = await send('Target.createTarget', { url: 'http://localhost:8000/frontend/' });
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

  await sendPage('Page.enable');
  await sendPage('Runtime.enable');
  await sendPage('DOM.enable');

  console.log('Navigating to http://localhost:8000/frontend/ ...');
  await sendPage('Page.navigate', { url: 'http://localhost:8000/frontend/' });
  await new Promise(r => setTimeout(r, 2000));

  async function evaluate(expr) {
    const res = await sendPage('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    return res?.result?.value;
  }

  async function setViewport(w, h, isMobile = true) {
    await sendPage('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 2,
      mobile: isMobile
    });
  }

  async function takeScreenshot(filename) {
    const shot = await sendPage('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const local = path.join(ROOT, filename);
    const art = path.join(ART_DIR, filename);
    fs.writeFileSync(local, buffer);
    fs.writeFileSync(art, buffer);
    console.log(`Saved screenshot ${filename} (${buffer.length} bytes)`);
  }

  // Log in as student to render full dashboard
  console.log('Logging in as student in browser session...');
  await evaluate(`
    (async () => {
      if (typeof loginAs === 'function') {
        await loginAs({
          name: 'Rahul Sharma',
          username: 'rahul.cse26',
          branchId: 'cse',
          section: 'A',
          isAdmin: false,
          adminRequested: false,
          lastReadPosts: Date.now()
        }, 'student_test_123');
      } else {
        document.getElementById('authScreen').style.display = 'none';
        document.getElementById('app').style.display = 'block';
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 1000));

  // Populate realistic test data for full inspection
  await evaluate(`
    (() => {
      // Announcements mock
      const feed = document.getElementById('postsFeedContent');
      if (feed) {
        feed.innerHTML = \`
          <div class="post-item pinned">
            <div class="post-title">📌 Mid-Semester Examination Schedule Announced — Autumn 2026</div>
            <div class="post-meta"><span>Dean of Academic Affairs</span> · <span>26 Sep 2026</span></div>
            <div class="post-content">The autumn session mid-term examinations will commence from 12th October. Students are advised to verify their admit cards.</div>
          </div>
          <div class="post-item">
            <div class="post-title">National Workshop on Cloud Architectures & Distributed Systems</div>
            <div class="post-meta"><span>Department of CSE</span> · <span>25 Sep 2026</span></div>
            <div class="post-content">Two-day hands-on workshop in Aryabhatta Hall. Registration closes Friday 5 PM.</div>
          </div>
        \`;
      }

      // Weekend timetable mock
      const todayView = document.getElementById('todayView');
      if (todayView) {
        todayView.innerHTML = '<div class="empty-note">It\\'s the weekend — no scheduled periods today. Enjoy it.</div>';
      }

      // Attendance mock
      const oPct = document.getElementById('overallPct');
      const oCounts = document.getElementById('overallCounts');
      const oLeave = document.getElementById('overallLeave');
      const sStats = document.getElementById('subjectStats');

      if (oPct) oPct.textContent = '93%';
      if (oCounts) oCounts.innerHTML = '<b>13</b> attended<br><b>1</b> missed<br>of <b>14</b> marked';
      if (oLeave) oLeave.innerHTML = '<div class="leave-line ok">✓ On track — you can take <b>3</b> more leaves above 75%.</div>';
      if (sStats) {
        sStats.innerHTML = \`
          <div class="stat-row">
            <div class="stat-label">Compiler Design</div>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:100%;"></div></div>
            <div class="stat-pct">100%</div>
          </div>
          <div class="stat-row">
            <div class="stat-label">Computer Networks</div>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:87.5%;"></div></div>
            <div class="stat-pct">88%</div>
          </div>
          <div class="stat-row">
            <div class="stat-label">Database Systems</div>
            <div class="stat-bar-track"><div class="stat-bar-fill" style="width:92%;"></div></div>
            <div class="stat-pct">92%</div>
          </div>
        \`;
      }
    })()
  `);
  await new Promise(r => setTimeout(r, 500));

  // --- 1. Test 390px (Standard Modern Phone) ---
  console.log('\n--- Testing 390x844 (Mobile) ---');
  await setViewport(390, 844, true);
  await new Promise(r => setTimeout(r, 500));

  const mobileCheck390 = await evaluate(`
    (() => {
      const topbar = document.querySelector('.topbar');
      const style = window.getComputedStyle(topbar);
      const notifBell = document.getElementById('notifBell');
      const bottomNav = document.querySelector('.mobile-bottom-nav');
      const userPillText = document.querySelector('.user-pill-text');
      const btnAdmin = document.querySelector('.btn-admin, .btn-request-admin');
      const fab = document.getElementById('ledgerAiFab');

      return {
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        topbarHeight: topbar ? topbar.offsetHeight : null,
        topbarPaddingTop: style.paddingTop,
        notifBellVisible: notifBell && window.getComputedStyle(notifBell).display !== 'none',
        userPillTextVisible: userPillText && window.getComputedStyle(userPillText).display !== 'none',
        btnAdminVisible: btnAdmin && window.getComputedStyle(btnAdmin).display !== 'none',
        bottomNavVisible: bottomNav && window.getComputedStyle(bottomNav).display !== 'none',
        bottomNavHeight: bottomNav ? bottomNav.offsetHeight : null,
        fabBottom: fab ? window.getComputedStyle(fab).bottom : null,
        fabWidth: fab ? window.getComputedStyle(fab).width : null,
        fabHeight: fab ? window.getComputedStyle(fab).height : null
      };
    })()
  `);
  console.log('390px Mobile Metrics:', JSON.stringify(mobileCheck390, null, 2));
  await takeScreenshot('dashboard_mobile_390.png');

  // Test Profile Dropdown open
  console.log('\nTesting Profile Dropdown on Mobile...');
  await evaluate(`toggleUserMenu(true)`);
  await new Promise(r => setTimeout(r, 300));
  await takeScreenshot('profile_dropdown_mobile.png');
  await evaluate(`toggleUserMenu(false)`);

  // Test Sidebar Drawer open
  console.log('\nTesting Sidebar Drawer on Mobile...');
  await evaluate(`toggleSidebar(true)`);
  await new Promise(r => setTimeout(r, 300));
  await takeScreenshot('sidebar_drawer_mobile.png');
  await evaluate(`toggleSidebar(false)`);

  // Scroll to Timetable & Attendance
  console.log('\nScrolling to Timetable Section on Mobile...');
  await evaluate(`scrollToSection('timetableSection')`);
  await new Promise(r => setTimeout(r, 600));
  await takeScreenshot('timetable_mobile_390.png');

  console.log('\nScrolling to Attendance Section on Mobile...');
  await evaluate(`scrollToSection('attendanceSection')`);
  await new Promise(r => setTimeout(r, 600));
  await takeScreenshot('attendance_mobile_390.png');

  // Open Telegram Section on Mobile
  console.log('\nOpening Telegram Section on Mobile...');
  await evaluate(`toggleTelegramSection(true)`);
  await new Promise(r => setTimeout(r, 600));
  await takeScreenshot('telegram_view_mobile_390.png');
  await evaluate(`toggleTelegramSection(false)`);
  await evaluate(`window.scrollTo({top: 0, behavior: 'instant'})`);
  await new Promise(r => setTimeout(r, 300));

  // --- 2. Test 360px (Small Android Phone) ---
  console.log('\n--- Testing 360x800 (Small Mobile) ---');
  await setViewport(360, 800, true);
  await new Promise(r => setTimeout(r, 500));
  const mobileCheck360 = await evaluate(`
    (() => ({
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
    }))()
  `);
  console.log('360px Mobile Metrics:', JSON.stringify(mobileCheck360, null, 2));
  await takeScreenshot('dashboard_mobile_360.png');

  // --- 3. Test 430px (Large Mobile Phone) ---
  console.log('\n--- Testing 430x932 (Large Mobile) ---');
  await setViewport(430, 932, true);
  await new Promise(r => setTimeout(r, 500));
  const mobileCheck430 = await evaluate(`
    (() => ({
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth
    }))()
  `);
  console.log('430px Mobile Metrics:', JSON.stringify(mobileCheck430, null, 2));
  await takeScreenshot('dashboard_mobile_430.png');

  // --- 4. Test Desktop 1200x800 ---
  console.log('\n--- Testing Desktop 1200x800 ---');
  await setViewport(1200, 800, false);
  await new Promise(r => setTimeout(r, 500));
  const desktopCheck = await evaluate(`
    (() => {
      const topbar = document.querySelector('.topbar');
      const sidebar = document.querySelector('.app-sidebar');
      const bottomNav = document.querySelector('.mobile-bottom-nav');
      const notifBell = document.getElementById('notifBell');
      return {
        viewportWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        topbarHeight: topbar ? topbar.offsetHeight : null,
        sidebarVisible: sidebar && window.getComputedStyle(sidebar).display !== 'none' && window.getComputedStyle(sidebar).position === 'sticky',
        bottomNavHidden: bottomNav && window.getComputedStyle(bottomNav).display === 'none',
        notifBellVisible: notifBell && window.getComputedStyle(notifBell).display !== 'none'
      };
    })()
  `);
  console.log('Desktop Metrics:', JSON.stringify(desktopCheck, null, 2));
  await takeScreenshot('dashboard_desktop_1200.png');

  console.log('\nAll tests and screenshots completed successfully!');
  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error('Validation script failed:', err);
  process.exit(1);
});
