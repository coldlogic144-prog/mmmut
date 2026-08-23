#!/usr/bin/env node
// tools/build_frontend.mjs — rebuilds frontend/js/app.js from the source
// sections in frontend/js/modules/ (sorted by filename). Run after editing
// any NN_*.js section. Also verifies sections never gained import statements
// (they share one module scope by design).
import fs from 'node:fs';
import path from 'node:path';

const FE = 'e:/mmmut/frontend';
const MODS = path.join(FE, 'js', 'modules');

const files = fs.readdirSync(MODS).filter(f => f.endsWith('.js')).sort();
if (!files.length) throw new Error('no section files found in ' + MODS);

let bad = [];
for (const f of files) {
  const txt = fs.readFileSync(path.join(MODS, f), 'utf8');
  // strip the section banner before scanning for stray imports
  const body = txt.replace(/^\/\/[\s\S]*?\/\/ =+\n\n/, '');
  // Section 10 legitimately contains the original SDK import block; nothing else may.
  if (f !== '10_firebase_boot.js' && /^\s*import\s/m.test(body)) bad.push(f);
}
if (bad.length) {
  console.error('ERROR: these sections contain import statements:\n  ' + bad.join('\n  ') +
    '\nSections must stay import-free; imports live at the top of the composed app.js.');
  process.exit(1);
}

const bodies = files.map(f => {
  const txt = fs.readFileSync(path.join(MODS, f), 'utf8');
  return txt.replace(/^\/\/[\s\S]*?\/\/ =+\n\n/, ''); // drop banner
});

let code = bodies.join('\n\n');
const marker = '} from "firebase/messaging";';
if (!code.includes(marker)) throw new Error('firebase/messaging marker missing — section 10 changed?');
code = code.replace(marker, marker + '\n' +
  '\n        // ===== PYTHON BACKEND CLIENT (additive — see backend/) =====\n' +
  "        import { apiFetchRoster } from './services/apiService.js';");

const out =
  '// ============================================================================\n' +
  '// GENERATED FILE — tools/build_frontend.mjs composes this from\n' +
  '// frontend/js/modules/NN_*.js (verbatim extractions of the original\n' +
  '// monolithic index.html). Edit a section file, then rebuild:\n' +
  '//     node tools/build_frontend.mjs\n' +
  '// All sections share ONE module scope, exactly like the original single\n' +
  '// inline <script type="module">. Statement order is preserved.\n' +
  '// Sections composed: ' + files.join(', ') + '\n' +
  '// ============================================================================\n\n' +
  code.trimStart() + '\n';

fs.writeFileSync(path.join(FE, 'js', 'app.js'), out);
console.log('rebuilt js/app.js from ' + files.length + ' sections (' + out.split('\n').length + ' lines)');
