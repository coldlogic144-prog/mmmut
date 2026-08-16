// _migration_test.mjs — validates the roll-claim identity engine against the
// real admission_data.csv roster WITHOUT touching the app or Firebase.
// Mirrors the exact normalization/verdict logic embedded in index.html.
import fs from 'node:fs';

const ROSTER = {};
for (const line of fs.readFileSync('C:/Users/DELL/Desktop/files/admission_data.csv').toString().split(/\r?\n/).slice(1)) {
  if (!line.trim()) continue;
  const [, , roll, enr, name] = line.split(',');
  ROSTER[roll] = { rollNumber: roll, enrollmentNo: enr, applicantName: name, branchName: enr.slice(4, 7) };
}

// --- Byte-for-byte mirrors of the index.html helpers ---
function normalizeUserName(s) { return String(s || '').toUpperCase().replace(/[^A-Z]/g, ' ').replace(/\s+/g, ' ').trim(); }
function evaluateRollClaim(profile, rosterEntry) {
  if (!rosterEntry) return { verdict: 'notfound', reasons: ['not-in-roster'] };
  const reasons = [];
  const pName = normalizeUserName(profile.name);
  const rName = normalizeUserName(rosterEntry.applicantName || rosterEntry.formalName || '');
  if (!pName || !rName || pName !== rName) reasons.push('name-mismatch');
  const branch = String(rosterEntry.branch || (rosterEntry.enrollmentNo || '').slice(4, 7) || '').toUpperCase();
  if (branch === 'CED') { if (String(profile.branchId || '').toLowerCase() !== 'civil') reasons.push('branch-mismatch'); }
  else if (branch === 'CSD') { reasons.push('csd-unmapped-branch'); }
  else { reasons.push('unknown-branch'); }
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
const csv = fs.readFileSync('C:/Users/DELL/Desktop/files/admission_data.csv').toString();
const rosterCount = csv.split(/\r?\n/).filter(l => l.trim()).length - 1;
console.log('Roster rows:', rosterCount);
for (const [name, branchId, roll, expect, label] of tests) {
  const got = evaluateRollClaim({ name, branchId }, ROSTER[roll] || null);
  const ok = got.verdict === expect;
  pass += ok ? 1 : 0;
  console.log(ok ? 'PASS' : 'FAIL', label, `${name}/${branchId}/${roll} -> ${got.verdict} ${JSON.stringify(got.reasons)}`);
}
console.log('test', pass + '/', tests.length);