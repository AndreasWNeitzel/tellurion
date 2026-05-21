// One-shot codemod: the v2 migration's generic getState labelled
// every rail readout 'control' whenever a control input had no id
// (key = el.id || 'control'). This rewrites that loop body to derive
// a human label from the control's aria-label or its row label,
// falling back to the id and only then to 'control'.
//
// Idempotent: a file already carrying the new code is left untouched.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const BUGGY = `      const key = (el.id || 'control').replace(/^slider-|^select-|^toggle-/, '');
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label: key.replace(/[-_]/g, ' '), value,
        format: typeof value === 'number' ? 'float' : undefined });`;

const FIXED = `      let label = (el.getAttribute('aria-label') || '').trim();
      if (!label) {
        const row = el.closest('.row');
        const lab = row && (row.querySelector('.label') || row.querySelector('label'));
        if (lab) label = lab.textContent.trim();
      }
      if (!label && el.id) label = el.id.replace(/^(slider|select|toggle)-/, '').replace(/[-_]/g, ' ');
      if (!label) label = 'control';
      const key = (el.id || label).replace(/^(slider|select|toggle)-/, '').replace(/[\\s_]+/g, '-').toLowerCase();
      let value = el.type === 'checkbox' ? (el.checked ? 'on' : 'off') : el.value;
      const num = Number(value);
      if (value !== '' && Number.isFinite(num)) value = num;
      fields.push({ key, label, value,
        format: typeof value === 'number' ? 'float' : undefined });`;

function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'references' || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (existsSync(join(p, 'playground.js'))) out.push(join(p, 'playground.js'));
      else out = out.concat(walk(p));
    }
  }
  return out;
}

let fixed = 0;
for (const f of walk('playgrounds')) {
  const src = readFileSync(f, 'utf8');
  if (!src.includes(BUGGY)) continue;
  writeFileSync(f, src.replace(BUGGY, FIXED));
  fixed += 1;
}
console.log(`fixed readout labels in ${fixed} playgrounds`);
