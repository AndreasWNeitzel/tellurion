#!/usr/bin/env node
// fix-controls-overlap.mjs
// Many playgrounds use a bare `class="controls"` without the
// `.pg-controls` grid scope, so dropdowns and sliders overlap each
// other. Bulk-rename to `class="controls pg-controls"` and inject a
// minimal local style block defining the grid if no .pg-controls
// CSS is reachable.
//
// Idempotent.

import { readFileSync, writeFileSync } from 'node:fs';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'playgrounds';
const PG_STYLE = `<style>
  .pg-controls { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3) var(--space-4); margin-block: var(--space-4); }
  .pg-controls .row { display: grid; grid-template-columns: 16ch 1fr 8ch; gap: var(--space-3); align-items: center; font-size: 13px; color: var(--fg-muted); }
  .pg-controls .row .value { font-family: var(--font-mono); text-align: right; color: var(--fg); }
  .pg-controls input[type="range"], .pg-controls select { width: 100%; }
  .pg-controls .row.buttons { grid-template-columns: 1fr 1fr 1fr; grid-column: span 2; }
</style>`;

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (e === 'index.html') yield p;
  }
}

let touched = 0;
for (const path of walk(ROOT)) {
  let txt = readFileSync(path, 'utf8');
  // Skip if it already has pg-controls.
  if (txt.includes('class="controls pg-controls"') || txt.includes('class="pg-controls"')) continue;
  // Only fix files that have the bare-controls pattern.
  if (!txt.includes('class="controls" id="controls"')) continue;
  txt = txt.replace(/class="controls" id="controls"/g, 'class="controls pg-controls" id="controls"');
  // Inject the local style block right after the closing </head> tag
  // so it overrides any conflicting shared CSS.
  if (!txt.includes('.pg-controls {')) {
    txt = txt.replace(/<\/head>/, `${PG_STYLE}\n</head>`);
  }
  writeFileSync(path, txt);
  touched += 1;
}
console.log(`Fixed dropdown overlap in ${touched} playground index.html files.`);
