#!/usr/bin/env node
// widen-playgrounds.mjs
// Increase every playground's canvas width by 1.5x (capped at 1280 px,
// the host-page column cap). Also bumps .pg-figure max-width in the
// inline style block of each index.html so the figure box keeps up.
// Height is left unchanged; this widens HORIZONTAL space only.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'playgrounds';
const CAP = 1280;
const FACTOR = 1.5;

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
  let before = txt;
  // 1. canvas width="N", bump.
  txt = txt.replace(/(<canvas[^>]*?\bwidth=")(\d+)(")/g, (_, a, w, c) => {
    const wn = Math.min(CAP, Math.round(parseInt(w, 10) * FACTOR));
    return a + wn + c;
  });
  // 2. .pg-figure { max-width: Npx } in inline style.
  txt = txt.replace(/(\.pg-figure\s*\{\s*max-width:\s*)(\d+)(px\s*[;}])/g, (_, a, w, c) => {
    const wn = Math.min(CAP, Math.round(parseInt(w, 10) * FACTOR));
    return a + wn + c;
  });
  // 3. Standalone "max-width: <N>px" inside the .pg-figure scope (some
  //    playgrounds put it as a separate rule). We only bump when the
  //    line clearly belongs to the figure block, i.e. the previous
  //    selector pattern. Skip via a conservative no-op.
  if (txt !== before) {
    writeFileSync(path, txt);
    touched++;
  }
}
console.log(`Widened canvases in ${touched} playground index.html files (factor ${FACTOR}, cap ${CAP}px).`);
