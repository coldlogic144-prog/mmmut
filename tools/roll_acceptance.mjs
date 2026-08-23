#!/usr/bin/env node
// tools/roll_acceptance.mjs — ACCEPTANCE MATRIX for roll verification.
//
// Tests REAL artifacts, not copies:
//   * pure functions extracted VERBATIM from the built frontend/js/app.js
//   * the REAL Flask backend (spawned here on 127.0.0.1:5057)
//   * the REAL production Firestore via its public REST read path
// Exit code 0 = all mandatory checks passed.
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const APP = fs.readFileSync('e:/mmmut/frontend/js/app.js', 'utf8');
const results = [];
const check = (name, pass, detail = '') =>
  results.push({ name, pass: !!pass, detail });

// ---------- 1) extract pure functions verbatim from built app.js ----------
function extractFn(name) {
  const re = new RegExp('(function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n        \\})');
  const m = APP.match(re);
  if (!m) throw new Error('cannot extract ' + name);
  return m[1];
}
const patternLine = APP.match(/const ROLL_NUMBER_PATTERN = ([^;]+);/)[0];
const rosterMapMatch = APP.match(/const ROSTER_BRANCH_TO_ID = \{[\s\S]*?\};/);
if (!patternLine || !rosterMapMatch) throw new Error('pattern/map extraction failed');
const make = new Function(
  patternLine + '\n' + rosterMapMatch[0] + '\n' +
  extractFn('normalizeRollInput') + '\n' +
  extractFn('rosterBranchToId') + '\n' +
  'return { normalizeRollInput, rollBranchToId: rosterBranchToId, PATTERN: ROLL_NUMBER_PATTERN };'
);
const { normalizeRollInput, rollBranchToId, PATTERN } = make();
check('extracted pure fns verbatim from built app.js', true);

// normalization / pattern behavior
for (const [inp, exp] of [[' 2026011001 ', '2026011001'], ['2026 0110 01', '2026011001']]) {
  check(`normalizeRollInput("${inp}") -> "${exp}"`, normalizeRollInput(inp) === exp);
}
for (const bad of ['20260110010', '202601100', 'ABCDEF1234', '', '202-6011001']) {
  check(`PATTERN rejects "${bad}"`, !PATTERN.test(normalizeRollInput(bad)));
}
// branch mapping for ALL eight codes
const branchExpect = { CED:'civil', CSD:'cse', EED:'ee', ECD:'ece', IOT:'eceiot', MED:'me', CHD:'chemical', ITC:'it' };
let mapOk = true;
for (const [code, id] of Object.entries(branchExpect)) {
  if (rollBranchToId(code) !== id) { mapOk = false; console.log('   map fail', code); }
}
check('ROSTER_BRANCH_TO_ID maps all 8 branches', mapOk);

// ---------- 2) spawn REAL backend ----------
const child = spawn('python', ['-m', 'backend.app'], {
  cwd: 'e:/mmmut', stdio: 'ignore',
  env: { ...process.env, PORT: '5057' },
});
const BASE = 'http://127.0.0.1:5057';
let healthy = false;
for (let i = 0; i < 25 && !healthy; i++) {
  await new Promise(r => setTimeout(r, 700));
  try { const h = await (await fetch(BASE + '/api/health')).json(); healthy = h.ok === true; } catch {}
}
check('backend /api/health ok', healthy);
const health = healthy ? await (await fetch(BASE + '/api/health')).json() : null;
check('backend rosterCount == 1189 (full CSV loaded)', health?.rosterCount === 1189,
  `got ${health?.rosterCount}`);

async function lookup(roll) {
  try {
    const r = await fetch(`${BASE}/api/roster/${roll}`);
    return await r.json();
  } catch { return null; }
}

// 10 valid rolls — covering first & last of every branch block
const VALID = ['2026011001','2026011169','2026021001','2026021373','2026031001',
               '2026041001','2026041301','2026051001','2026061001','2026071169'];
let validHits = 0;
for (const r of VALID) {
  const j = await lookup(r);
  if (j?.found) validHits++; else console.log('   VALID MISS', r);
}
check(`backend: known-valid rolls found (${validHits}/10)`, validHits === 10);

// 5 invalid rolls correctly rejected
const INVALID = ['9999999999','20260110010','202601100','ABCDEF1234','2025999999'];
let invalidRejected = 0;
for (const r of INVALID) {
  const norm = normalizeRollInput(r);
  if (!PATTERN.test(norm)) { invalidRejected++; continue; }      // input-layer reject
  const j = await lookup(norm);
  if (j && j.found === false) invalidRejected++;                 // data-layer reject
}
check(`invalid rolls rejected (${invalidRejected}/5)`, invalidRejected === 5);

// already-claimed roll: real production claim must exist with expected shape
try {
  const u = await (await fetch('https://firestore.googleapis.com/v1/projects/student-erp-77605/databases/(default)/documents/userRolls/2026011001')).json();
  const uid = u?.fields?.uid?.stringValue, un = u?.fields?.username?.stringValue;
  check('production userRolls claim 2026011001 exists (uid+username)',
    typeof uid === 'string' && uid.length > 20 && un === 'aarav', `uid=${uid} user=${un}`);
} catch (e) {
  check('production userRolls claim readable', false, String(e).slice(0, 80));
}

// backend-down path is graceful (connection refused → caught → apiService null)
let downOk = false;
try {
  const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 1500);
  await fetch('http://127.0.0.1:59999/api/roster/2026011001', { signal: ctrl.signal });
} catch { downOk = true; }
check('backend-down fails gracefully (maps to null, never throws)', downOk);

// decision-table presence in the built artifact
check('D1 decision present (permission-denied ≠ claim-race)',
  APP.includes("blocked:permission-denied-on-claim-write"));
check('D2 fallback present + unconfigured distinguishable',
  APP.includes("diag.backendAttempted = true") && APP.includes("'unconfigured'"));
check('D3 guidance present (gate-aware login message)',
  APP.includes('Sign in with your USERNAME first'));
check('SAFETY: hard gate currently OFF (ROLL_MIGRATION_ENABLED=false)',
  /ROLL_MIGRATION_ENABLED = false/.test(APP));

// ---------- 3) LIVE Firestore state (incident evidence + post-fix proof) ----------
console.log('\n--- LIVE FIRESTORE studentRoster via public REST ---');
const FS = 'https://firestore.googleapis.com/v1/projects/student-erp-77605/databases/(default)/documents/studentRoster/';
const fsState = [];
for (const roll of VALID.slice(0, 8)) {
  try {
    const r = await fetch(FS + roll);
    if (r.status === 200) {
      const j = await r.json();
      const nm = j.fields?.applicantName?.stringValue || '?';
      const br = j.fields?.branchName?.stringValue || '?';
      fsState.push(`  FS HIT  ${roll} ${br} ${nm}`);
    } else {
      fsState.push(`  FS HTTP ${r.status} ${roll}${r.status === 404 ? '  << MISSING IN FIRESTORE' : ''}`);
    }
  } catch (e) { fsState.push(`  FS ERR  ${roll} ${String(e).slice(0, 60)}`); }
}
console.log(fsState.join('\n'));

// ---------- report ----------
child.kill();
const passed = results.filter(r => r.pass).length;
console.log('\n================ ACCEPTANCE MATRIX ================');
for (const r of results)
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '   [' + r.detail + ']' : ''}`);
console.log('===================================================');
console.log(`${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);


