import fs from 'node:fs';

const dataFile = fs.readFileSync('frontend/js/modules/41_ledger_data.js', 'utf8');
const ledgerFile = fs.readFileSync('frontend/js/modules/86_ledger.js', 'utf8');

// Strip banners
const cleanedData = dataFile.replace(/^\/\/[\s\S]*?\/\/ =+\n\n/, '');
const cleanedLedger = ledgerFile.replace(/^\/\/[\s\S]*?\/\/ =+\n\n/, '');

const mockEnv = `
let currentUser = { branchId: 'civil' };
let currentUid = 'user123';
function escapeHtml(s) { return s; }
const document = {
  getElementById: (id) => ({
    style: {},
    innerHTML: '',
    value: '',
    classList: { add: () => {}, remove: () => {} },
    options: []
  }),
  querySelectorAll: () => []
};
${cleanedData}
${cleanedLedger}

console.log('Testing open course BSM-110...');
console.log('civil sem 1 subjects:', LEDGER_DATA['civil'].semesters['1'].map(s => s.code));
handleLedgerAction('open', '1', 'BSM-110');
console.log('ledgerOpenCourses:', Array.from(ledgerOpenCourses));

// Check render
const sub = LEDGER_DATA['civil'].semesters['1'][0];
console.log('sub:', sub);
const html = renderLedgerCourseRow(sub, '1', null);
console.log('HTML includes ledger-unit-card:', html.includes('ledger-unit-card'));
console.log('HTML length:', html.length);
`;

eval(mockEnv);
