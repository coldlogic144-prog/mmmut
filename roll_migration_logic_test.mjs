// roll_migration_logic_test.mjs — validates the roll-verification identity + roster
// auto-assign logic against the real admission_data.csv roster WITHOUT touching the
// app or Firebase. Mirrors the exact helpers embedded in index.html (the identity
// engine `evaluateRollClaim` plus the roster->branch mapping `rosterBranchToId`).
//
// Firestore `studentRoster` is the authoritative runtime source — this file only
// exercises the same rules against the CSV the import script uses.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const CSV_PATH = process.env.ROSTER_CSV
  || fileURLToPath(new URL('./admission_data.csv', import.meta.url));

const ROLL_RE = /^\d{10}$/;
const ENROLL_RE = /^2026(CED|CSD)\d{4}$/;

// --- RFC 4180 CSV reader ------------------------------------------------------
// Handles quoted fields, escaped quotes (""), embedded commas and newlines, and
// CRLF / CR / LF line endings. Replaces the old unsafe `line.split(',')` approach
// (a comma inside a quoted field used to corrupt rows).
function parseCsv(text) {
  const records = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; } // "" -> literal quote
        else { inQuotes = false; i += 1; }
      } else {
        field += ch;
        i += 1;
      }
    } else if (ch === '"' && field === '') {
      inQuotes = true;                       // start of a quoted field
      i += 1;
    } else if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
    } else if (ch === '\r' || ch === '\n') { // end of record
      row.push(field);
      field = '';
      records.push(row);
      row = [];
      i += (ch === '\r' && text[i + 1] === '\n') ? 2 : 1;
    } else {
      field += ch;
      i += 1;
    }
  }
  if (field !== '' || row.length) {          // trailing record without newline
    row.push(field);
    records.push(row);
  }
  // Drop trailing blank records (e.g. a final newline).
  while (records.length && records[records.length - 1].every(c => c.trim() === '')) records.pop();
  return records;
}

// --- Load roster via explicit header lookup (same columns as import script) ---
const parsed = parseCsv(fs.readFileSync(CSV_PATH, 'utf8'));
const headerRow = parsed[0] || [];
const col = (name) => headerRow.findIndex(h => h.trim() === name);
const iRoll = col('Roll_No');
const iEnr = col('Enrollment_No');
const iName = col('Applicant_Name');
if (iRoll < 0 || iEnr < 0 || iName < 0) {
  console.error('FAIL: required CSV headers (Roll_No, Enrollment_No, Applicant_Name) not found.');
  console.error('Actual header:', headerRow);
  process.exit(2);
}

const ROSTER = {};
const stats = {
  rows: 0,
  invalidRolls: [],
  invalidEnrollments: [],
  emptyNames: 0,
  duplicateRolls: [],
  branches: {},
};
for (const row of parsed.slice(1)) {
  if (row.every(c => c.trim() === '')) continue; // skip blank lines
  stats.rows += 1;
  const roll = (row[iRoll] || '').trim();
  const enr = (row[iEnr] || '').trim();
  const name = (row[iName] || '').trim();
  if (!ROLL_RE.test(roll)) { stats.invalidRolls.push(roll); continue; }
  if (!ENROLL_RE.test(enr)) { stats.invalidEnrollments.push(enr); continue; }
  if (!name) { stats.emptyNames += 1; continue; }
  if (ROSTER[roll]) { stats.duplicateRolls.push(roll); continue; }
  ROSTER[roll] = {
    rollNumber: roll,
    enrollmentNo: enr,
    applicantName: name,
    formalName: name,
    branchName: enr.slice(4, 7), // 'CED' | 'CSD' — mirrors index.html's fallback
  };
  const br = enr.slice(4, 7);
  stats.branches[br] = (stats.branches[br] || 0) + 1;
}

function reportValidation() {
  console.log('CSV file           :', CSV_PATH);
  console.log('--- roster validation ---');
  console.log('records            :', stats.rows, '(expected 215)');
  console.log('invalid rolls      :', stats.invalidRolls.length, '->', JSON.stringify(stats.invalidRolls));
  console.log('duplicate rolls    :', stats.duplicateRolls.length, '->', JSON.stringify(stats.duplicateRolls));
  console.log('invalid enrollments:', stats.invalidEnrollments.length, '->', JSON.stringify(stats.invalidEnrollments));
  console.log('empty names        :', stats.emptyNames);
  console.log('branch counts      :', stats.branches);
  const ok = stats.rows === 215
    && stats.invalidRolls.length === 0
    && stats.duplicateRolls.length === 0
    && stats.invalidEnrollments.length === 0
    && stats.emptyNames === 0;
  if (!ok) {
    console.error('VALIDATION FAILED — do NOT run the Firestore import.');
    process.exit(2);
  }
  console.log('validation         : PASS (safe to import)');
}

// --- Byte-for-byte mirrors of the index.html helpers ---
function normalizeUserName(s) { return String(s || '').toUpperCase().replace(/[^A-Z]/g, ' ').replace(/\s+/g, ' ').trim(); }
// Byte-for-byte mirror of index.html rosterBranchToId: CED -> 'civil', CSD -> 'cse',
// with fallback source = enrollmentNo.slice(4, 7) (the 'CED'/'CSD' letters).
function rosterBranchToId(branchName) { return String(branchName || '').trim().toUpperCase() === 'CSD' ? 'cse' : 'civil'; }
function evaluateRollClaim(profile, rosterEntry) {
  if (!rosterEntry) return { verdict: 'notfound', reasons: ['not-in-roster'] };
  const reasons = [];
  const isAdmin = !!(profile && profile.isAdmin);
  const pName = normalizeUserName(profile ? profile.name : '');
  const rName = normalizeUserName(rosterEntry.applicantName || rosterEntry.formalName || '');
  const nameMismatch = !pName || !rName || pName !== rName;
  if (nameMismatch && !isAdmin) reasons.push('name-mismatch');
  const branch = String(rosterEntry.branchName ||
    (rosterEntry.enrollmentNo || '').slice(4, 7) || '').toUpperCase();
  if (branch === 'CED') {
    if (String(profile ? profile.branchId : '').toLowerCase() !== 'civil') {
      if (!isAdmin) reasons.push('branch-mismatch');
    }
  } else if (branch === 'CSD') {
    if (String(profile ? profile.branchId : '').toLowerCase() !== 'cse') {
      if (!isAdmin) reasons.push('branch-mismatch');
    }
  } else {
    reasons.push('unknown-branch');
  }
  return reasons.length === 0 ? { verdict: 'ok', reasons, branch } : { verdict: 'manual-review', reasons, branch };
}

const tests = [
  ['AARAV SINGH', 'civil', '2026011001', 'ok', 'ok (CED + civil + name)'],
  ['Aarav   SINGH', 'civil', '2026011001', 'ok', 'ok with messy name spacing'],
  ['AARAV SINGH', 'cse', '2026011001', 'manual-review', 'branch mismatch: cse vs CED'],
  ['DELHI UNKNOWN', 'civil', '2026011001', 'manual-review', 'name mismatch'],
  ['ABHISHEK KUMAR', 'civil', '2026011004', 'ok', 'CED ABHISHEK block-1'],
  ['ABHISHEK KUMAR', 'cse', '2026021003', 'ok', 'CSD + cse + name -> ok'],
  ['ABHISHEK KUMAR', 'cse', '2026021102', 'ok', 'CSD + cse + name -> ok'],
  ['AARAV SINGH', 'civil', '2026021101', 'manual-review', 'name belongs to another roll'],
  ['AARAV SINGH', 'civil', '9999999999', 'notfound', 'not in roster'],
  // CSD now auto-verifies for a CSE student whose name matches the roster.
  ['RISHIKESH NANDAN', 'cse', '2026021048', 'ok', 'CSD -> cse auto-verify'],
  // Admin accounts (e.g. tanish) may self-verify even on name/branch mismatch.
  ['DIFFERENT NAME', 'civil', '2026011001', 'ok', 'admin name override', true],
  ['DIFFERENT NAME', 'whatever', '2026011001', 'ok', 'admin branch+name override', true],
  ['DIFFERENT NAME', 'whatever', '2026021048', 'ok', 'admin CSD override', true],
];
let pass = 0;
reportValidation();
console.log('--- identity-engine tests (mirrors index.html evaluateRollClaim) ---');
for (const t of tests) {
  const [name, branchId, roll, expect, label, isAdmin] = t;
  const profile = { name, branchId };
  if (isAdmin) profile.isAdmin = true;
  const got = evaluateRollClaim(profile, ROSTER[roll] || null);
  const ok = got.verdict === expect;
  pass += ok ? 1 : 0;
  console.log(ok ? 'PASS' : 'FAIL', label, `${name}/${branchId}/${roll} -> ${got.verdict} ${JSON.stringify(got.reasons)}`);
}
// Every CSD student (matching roster name + cse branch) must now auto-verify.
let csdOk = 0, csdTotal = 0;
for (const [roll, enr] of Object.entries(ROSTER)) {
  if ((enr.branchName || '').toUpperCase() !== 'CSD') continue;
  csdTotal++;
  const got = evaluateRollClaim({ name: enr.applicantName, branchId: 'cse' }, enr);
  csdOk += got.verdict === 'ok' ? 1 : 0;
}
pass += csdOk === csdTotal ? 1 : 0;
console.log(csdOk === csdTotal ? 'PASS' : 'FAIL', `all CSD students auto-verify (${csdOk}/${csdTotal})`);

// --- NEW: roster->branch auto-assign mapping (used by the hard gate + signup) ---
const branchMapTests = [
  ['CED', 'civil', 'CED -> civil'],
  ['CSD', 'cse', 'CSD -> cse'],
  ['ced', 'civil', 'lowercase ced -> civil'],
  ['csd', 'cse', 'lowercase csd -> cse'],
  ['', 'civil', 'empty/unknown -> civil fallback'],
  [null, 'civil', 'null -> civil fallback'],
];
for (const [input, expect, label] of branchMapTests) {
  const got = rosterBranchToId(input);
  const ok = got === expect;
  pass += ok ? 1 : 0;
  console.log(ok ? 'PASS' : 'FAIL', label, `rosterBranchToId(${JSON.stringify(input)}) -> ${got} (expected ${expect})`);
}

// Every roster entry must resolve to a known branch id + a non-empty auto-name,
// otherwise the hard gate could stall on a legitimate roll.
let mapOk = 0, mapTotal = 0;
for (const [, enr] of Object.entries(ROSTER)) {
  mapTotal++;
  const id = rosterBranchToId(enr.branchName);
  const okName = !!(enr.applicantName || enr.formalName || '').trim();
  const okBranch = id === 'civil' || id === 'cse';
  if (okName && okBranch) mapOk++;
}
pass += mapOk === mapTotal ? 1 : 0;
console.log(mapOk === mapTotal ? 'PASS' : 'FAIL',
  `all roster rolls resolve name+branch (${mapOk}/${mapTotal})`);

const total = tests.length + 1 + branchMapTests.length + 1;
console.log('test', pass + ' / ' + total);
process.exit(pass === total ? 0 : 1);