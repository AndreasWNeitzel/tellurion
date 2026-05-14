#!/usr/bin/env node
// gate-all.mjs
// Run scripts/gate.mjs for each hero; aggregate to docs/HERO-GATES.md.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(__dirname, '..');

const heroes = (await fs.readdir(path.join(ROOT, 'playgrounds/_heroes'), { withFileTypes: true }))
  .filter(e => e.isDirectory())
  .map(e => e.name);

const aggregate = [];
for (const slug of heroes) {
  console.log(`\n=== ${slug} ===`);
  spawnSync('node', [path.join(__dirname, 'gate.mjs'), slug], { stdio: 'inherit' });
  try {
    const gatesMd = await fs.readFile(path.join(ROOT, 'playgrounds/_heroes', slug, 'GATES.md'), 'utf-8');
    aggregate.push({ slug, gatesMd });
  } catch { /* gates file missing */ }
}

const md = [];
md.push(`# Hero Gates Aggregate`); md.push('');
md.push(`Run: ${new Date().toISOString()}`); md.push('');
md.push('| Hero | A | B | C | D | E | F | G |');
md.push('|...|...|...|...|...|...|...|...|');
for (const { slug, gatesMd } of aggregate) {
  const row = ['', '', '', '', '', '', ''];
  const lines = gatesMd.split('\n');
  for (const line of lines) {
    const m = line.match(/^\|\s*([A-G])\.[^|]+\|\s*(PASS|FAIL)\s*\|/);
    if (m) {
      const idx = m[1].charCodeAt(0) - 'A'.charCodeAt(0);
      row[idx] = m[2];
    }
  }
  md.push(`| ${slug} | ${row.join(' | ')} |`);
}
md.push('');
md.push('Per-hero detail: `playgrounds/_heroes/<slug>/GATES.md`.');
await fs.writeFile(path.join(ROOT, 'docs/HERO-GATES.md'), md.join('\n') + '\n');
console.log('\nWrote docs/HERO-GATES.md');
