// roll_migration_logic_test.mjs — validates the roll-claim identity engine against
// the real admission_data.csv roster WITHOUT touching the app or Firebase.
// Mirrors the exact normalization/verdict logic embedded in index.html.
//
// Firestore `studentRoster` is the authoritative runtime source — this file only
// exercises the same identity rules against the CSV the import script uses.
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
function evaluateRollClaim(profile, rosterEntry) {
  if (!rosterEntry) return { verdict: 'notfound', reasons: ['not-in-roster'] };
  const reasons = [];
  const pName = normalizeUserName(profile.name);
  const rName = normalizeUserName(rosterEntry.applicantName || rosterEntry.formalName || '');
  if (!pName || !rName || pName !== rName) reasons.push('name-mismatch');
  const branch = String(rosterEntry.branchName ||
    (rosterEntry.enrollmentNo || '').slice(4, 7) || '').toUpperCase();
  if (branch === 'CED') {
    if (String(profile.branchId || '').toLowerCase() !== 'civil') reasons.push('branch-mismatch');
  } else if (branch === 'CSD') {
    reasons.push('csd-unmapped-branch');
  } else {
    reasons.push('unknown-branch');
  }
  return reasons.length === 0 ? { verdict: 'ok', reasons, branch } : { verdict: 'manual-review', reasons, branch };
}

const tests = [
  ['AARAV SINGH', 'civil', '2026011001', 'ok', 'ok (CED + civil + name)'],
  ['Aarav   Singh', 'civil', '2026011001', 'ok', 'ok with messy name spacing'],
  ['AARAV SINGH', 'cse', '2026011001', 'manual-review', 'branch mismatch: cse vs CED'],
  ['DELHI UNKNOWN', 'civil', '2026011001', 'manual-review', 'name mismatch'],
  ['ABHISHEK KUMAR', 'civil', '2026011004', 'ok', 'CED ABHISHEK block-1'],
  ['ABHISHEK KUMAR', 'cse', '2026021003', 'manual-review', 'CSD unmapped branch'],
  ['ABHISHEK KUMAR', 'cse', '2026021102', 'manual-review', 'CSD unmapped branch'],
  ['AARAV SINGH', 'civil', '2026021101', 'manual-review', 'name belongs to another roll'],
  ['AARAV SINGH', 'civil', '9999999999', 'notfound', 'not in roster'],
];
let pass = 0;
reportValidation();
console.log('--- identity-engine tests (mirrors index.html evaluateRollClaim) ---');
for (const [name, branchId, roll, expect, label] of tests) {
  const got = evaluateRollClaim({ name, branchId }, ROSTER[roll] || null);
  const ok = got.verdict === expect;
  pass += ok ? 1 : 0;
  console.log(ok ? 'PASS' : 'FAIL', label, `${name}/${branchId}/${roll} -> ${got.verdict} ${JSON.stringify(got.reasons)}`);
}
console.log('test', pass + ' / ' + tests.length);
process.exit(pass === tests.length ? 0 : 1);