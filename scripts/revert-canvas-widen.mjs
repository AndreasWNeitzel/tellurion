#!/usr/bin/env node
// revert-canvas-widen.mjs
// Undo the 1.5x bump of canvas width="N" attributes from
// widen-playgrounds.mjs (which was the wrong intervention -- it
// removed CSS upscaling and made text look smaller). The actual
// fix is to bump --content-max in shared/css/tokens.css; canvas
// width attributes are left at their original sizes so the browser
// keeps stretching the canvas to fill the wider figure container,
// which scales fonts up proportionally.
//
// Heuristic: any canvas width attribute that is exactly 1280 was
// almost certainly clamped by the prior script; restore it to a
// likely-original common value (760, 860, 880, 900, 960, 1100, 1200)
// by inferring from height. Where height/width was a "round"
// matched pair (e.g., 760x540, 880x540), we use a known table.
//
// For safety, we ALSO restore widths that look like factor-1.5
// products (e.g., 1140 = 760*1.5, 1320 = 880*1.5). The script is
// idempotent: running it twice is a no-op.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'playgrounds';

// Map: bumped width -> original. Covers the common cases produced by the
// prior widen script (1.5x of every width that appeared in the source
// tree as catalogued by `grep`).
const REVERT = {
  1140: 760,       // 760 x 1.5
  1290: 860,       // 860 x 1.5
  1320: 880,       // 880 x 1.5
  1350: 900,       // 900 x 1.5
  1440: 960,       // 960 x 1.5
  1080: 720,       // 720 x 1.5
  1230: 820,       // 820 x 1.5
};
// CAPPED-at-1280 values are ambiguous (could have come from anywhere
// over 853). The vast majority of clamped values came from 880 or 900;
// disambiguate by canvas height: 880x540 vs 900x600 vs 1100x720.
function revertClamped(width, height) {
  if (width !== 1280) return null;
  if (height === 540) return 880;
  if (height === 600) return 900;
  if (height === 720) return 1100;
  if (height === 640) return 960;
  return 900;     // best guess fallback for other heights.
}

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
  const before = txt;
  txt = txt.replace(/(<canvas[^>]*?\bwidth=")(\d+)("[^>]*\bheight=")(\d+)(")/g, (m, a, w, b, h, c) => {
    const wn = parseInt(w, 10), hn = parseInt(h, 10);
    let restored = REVERT[wn] ?? revertClamped(wn, hn) ?? null;
    if (restored == null) return m;
    return `${a}${restored}${b}${hn}${c}`;
  });
  if (txt !== before) {
    writeFileSync(path, txt);
    touched++;
  }
}
console.log(`Restored original canvas widths in ${touched} playground index.html files.`);
