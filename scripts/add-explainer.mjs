#!/usr/bin/env node
// add-explainer.mjs
// Idempotently injects the shared explainer (CSS link + module script)
// into every playgrounds/**/index.html. The module reads the colocated
// spec.md and renders a toggleable "What is this?" panel. Re-runnable:
// files already wired are skipped. The trigger/dialog live outside
// #stage, so the visual-regression goldens are unaffected.

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PG = path.join(ROOT, 'playgrounds');

async function* indexHtmls(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name === '_template') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* indexHtmls(full);
    else if (e.name === 'index.html') yield full;
  }
}

let changed = 0, skipped = 0;
for await (const file of indexHtmls(PG)) {
  let html = await fs.readFile(file, 'utf-8');
  if (html.includes('shared/js/explainer.js')) { skipped += 1; continue; }
  // Depth from this index.html up to repo root, then into shared/.
  const rel = path.relative(path.dirname(file), ROOT) || '.';
  const base = rel.split(path.sep).join('/');
  const css = `<link rel="stylesheet" href="${base}/shared/css/explainer.css">`;
  const js = `<script type="module" src="${base}/shared/js/explainer.js"></script>`;
  if (html.includes('</head>')) html = html.replace('</head>', `${css}</head>`);
  else html = css + html;
  if (html.includes('</body>')) html = html.replace('</body>', `${js}</body>`);
  else html += js;
  await fs.writeFile(file, html);
  changed += 1;
}
console.log(`explainer wired: ${changed} updated, ${skipped} already had it`);
