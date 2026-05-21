// One-shot codemod: the v2 migration dropped the
// <script type="module" src="./playground.js"> tag from some
// playground index.html files. Those pages load but the playground
// code never runs, leaving a blank canvas with no console error.
// This re-inserts the tag (before the explainer script, matching the
// order on the playgrounds that survived migration intact).
//
// Idempotent: a page that already includes ./playground.js is skipped.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  let out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'references' || e.name === 'node_modules') continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (existsSync(join(p, 'index.html')) && existsSync(join(p, 'playground.js'))) out.push(p);
      else out = out.concat(walk(p));
    }
  }
  return out;
}

const TAG = '<script type="module" src="./playground.js"></script>';
const EXPLAINER = '<script type="module" src="../../../shared/js/explainer.js"></script>';

let fixed = 0;
for (const dir of walk('playgrounds')) {
  const htmlPath = join(dir, 'index.html');
  let html = readFileSync(htmlPath, 'utf8');
  if (/src=["']\.\/playground\.js["']/.test(html)) continue;
  if (html.includes(EXPLAINER)) {
    html = html.replace(EXPLAINER, `${TAG}\n${EXPLAINER}`);
  } else {
    html = html.replace('</body>', `  ${TAG}\n</body>`);
  }
  writeFileSync(htmlPath, html);
  fixed += 1;
}
console.log(`re-inserted the playground.js script tag in ${fixed} pages`);
