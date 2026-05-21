#!/usr/bin/env node
// revert-figure-widen.mjs
// Undo the .pg-figure { max-width: Npx } bumps from widen-playgrounds.mjs.
// The bumped values were 1.5x of the originals, clamped at 1280px.
// We restore by dividing by 1.5 and rounding to the nearest common
// original width: 760, 860, 880, 900, 960, 1100, 1200.
//
// Idempotent for already-original values.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'playgrounds';
const ORIGINAL_CANDIDATES = [720, 760, 800, 820, 860, 880, 900, 940, 960, 1000, 1100, 1200];

function nearestCommon(n) {
  let best = ORIGINAL_CANDIDATES[0], bestDiff = Math.abs(n - best);
  for (const c of ORIGINAL_CANDIDATES) {
    const d = Math.abs(n - c);
    if (d < bestDiff) { best = c; bestDiff = d; }
  }
  return best;
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
  txt = txt.replace(/(\.pg-figure\s*\{\s*max-width:\s*)(\d+)(px\s*[;}])/g, (_, a, w, c) => {
    const wn = parseInt(w, 10);
    // Restore by dividing by 1.5 and snapping to nearest common candidate.
    const restored = nearestCommon(Math.round(wn / 1.5));
    return `${a}${restored}${c}`;
  });
  if (txt !== before) {
    writeFileSync(path, txt);
    touched++;
  }
}
console.log(`Restored .pg-figure max-width in ${touched} playground index.html files.`);
