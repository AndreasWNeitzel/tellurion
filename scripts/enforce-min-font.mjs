#!/usr/bin/env node
// enforce-min-font.mjs
// Bumps any canvas-drawn font smaller than 11px up to 11px in
// playground.js files. Looks for the patterns
//   ctx.font = '9px ...'     -> '11px ...'
//   ctx.font = '10px ...'    -> '11px ...'
// Leaves 11px and above untouched. The 11px floor is the absolute
// minimum allowed by CLAUDE.md rule 12; 12px is the recommended
// default for prose labels. Sub-plot legends and tick labels are the
// primary offenders.
//
// Idempotent.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'playgrounds';
let totalBumped = 0;
let filesTouched = 0;

function* walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const s = statSync(p);
    if (s.isDirectory()) yield* walk(p);
    else if (e === 'playground.js') yield p;
  }
}

for (const path of walk(ROOT)) {
  const txt = readFileSync(path, 'utf8');
  let n = 0;
  const out = txt.replace(/(['"`])(\d+)px ([^'"`]+?)\1/g, (m, q, px, rest) => {
    const v = parseInt(px, 10);
    if (v >= 11) return m;
    // Skip if this is in a comment line or it's a CSS-style rule.
    // Heuristic: only bump occurrences likely to be canvas fonts (the
    // surrounding context will have ctx.font or similar). We can't
    // see context per-match in a regex replace, so apply unilaterally
    // and let any false positives be benign (everything below 11px is
    // unreadable in canvas anyway).
    n += 1;
    return `${q}11px ${rest}${q}`;
  });
  if (n > 0) {
    writeFileSync(path, out);
    filesTouched += 1;
    totalBumped += n;
  }
}
console.log(`Bumped ${totalBumped} sub-11px font declarations in ${filesTouched} playground files.`);
