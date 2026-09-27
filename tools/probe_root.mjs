// tools/probe_root.mjs
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = path.join(process.env.TEMP || '.', 'chrome_cdp_profile_' + Date.now());

async function run() {
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
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    chromeProc.kill();
    throw new Error('Chrome CDP launch timeout');
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
  await page('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await page('Page.navigate', { url: 'http://localhost:8000/' });
  await new Promise(r => setTimeout(r, 2000));
  
  await page('Runtime.evaluate', { expression: 'if (typeof loginAs === "function") loginAs("student");' });
  await new Promise(r => setTimeout(r, 2000));
  
  const shot = await page('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('root_mobile_390.png', Buffer.from(shot.data, 'base64'));
  console.log('Saved root_mobile_390.png');
  chromeProc.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
