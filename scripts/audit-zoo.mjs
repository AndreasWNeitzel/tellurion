#!/usr/bin/env node
// Static quality audit across all playgrounds. Cheap, no rendering: flags the
// issues detectable from source for a prioritised hero-quality worklist.
// Run: node scripts/audit-zoo.mjs [--issue <key>]
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = 'playgrounds';
const issIdx = process.argv.indexOf('--issue');
const ONLY_ISSUE = issIdx >= 0 ? process.argv[issIdx + 1] : null;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let s; try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) {
      if (name === 'node_modules' || name === 'references' || name === '_template') continue;
      if (existsSync(join(p, 'index.html'))) out.push(p);
      out.push(...walk(p));
    }
  }
  return out;
}

const rows = [];
for (const dir of walk(ROOT)) {
  const slug = dir.split('/').pop();
  if (slug.startsWith('_gl')) continue;
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  const js = existsSync(join(dir, 'playground.js')) ? readFileSync(join(dir, 'playground.js'), 'utf8') : '';
  const issues = [];
  const cm = html.match(/id="stage"[^>]*?width="(\d+)"\s+height="(\d+)"/);
  if (cm) { const w = +cm[1], h = +cm[2]; if (w >= h) issues.push('landscape'); }
  if (/<button[^>]*>\s*Next\s/i.test(html)) issues.push('cycle-button');
  if (js && !/requestAnimationFrame/.test(js)) issues.push('no-raf');
  if (!existsSync(join(dir, 'REEL.md'))) issues.push('no-reel');
  if (js && !/requestAnimationFrame/.test(js) && !/addEventListener\((['"])(pointer|click|input|change|mouse)/.test(js)) issues.push('static-noninteractive');
  if (issues.length) rows.push({ dir, issues });
}

const counts = {};
for (const r of rows) for (const i of r.issues) counts[i] = (counts[i] || 0) + 1;
console.log('=== issue counts (total flagged ' + rows.length + ') ===');
for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(4), k);
if (ONLY_ISSUE) {
  console.log('\n=== ' + ONLY_ISSUE + ' ===');
  for (const r of rows) if (r.issues.includes(ONLY_ISSUE)) console.log('  ' + r.dir.replace('playgrounds/', ''));
}
