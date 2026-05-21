// One-shot codemod: many playground index.html files carry a
// placeholder intro paragraph (often just the title) left by the
// Layout System v2 migration, while the real description sits unused
// in spec.md's one_paragraph field. This fills the intro paragraph
// from spec.md wherever the current one is barebones.
//
// Idempotent: a playground whose intro is already substantial
// (>= 70 characters) is left untouched.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'references' || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (existsSync(join(p, 'index.html')) && existsSync(join(p, 'spec.md'))) out.push(p);
      else out = out.concat(walk(p));
    }
  }
  return out;
}

function parseOneParagraph(spec) {
  const m = spec.match(/^one_paragraph:\s*(.+)$/m);
  if (!m) return '';
  let v = m[1].trim();
  if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1).replace(/''/g, "'");
  else if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  return v;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let fixed = 0;
const introRe = /(<section class="playground-intro">\s*<p[^>]*>)([\s\S]*?)(<\/p>)/;
for (const dir of walk('playgrounds')) {
  const htmlPath = join(dir, 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  const m = html.match(introRe);
  if (!m) continue;
  const current = m[2].replace(/<[^>]+>/g, '').trim();
  if (current.length >= 70) continue;                 // already substantial
  const op = parseOneParagraph(readFileSync(join(dir, 'spec.md'), 'utf8'));
  if (op.length < 70) continue;                        // no usable description
  html = html.replace(m[0], m[1] + esc(op) + m[3]);
  writeFileSync(htmlPath, html);
  fixed += 1;
}
console.log(`filled ${fixed} placeholder intro paragraphs`);
