#!/usr/bin/env node
// Aggregate per-frame rAF timings from playgrounds/**/references/captured/*/perf.json.
// Computes per-playground median + p95 + flags playgrounds outside the 60 Hz budget.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BUDGET_MS = 16.7;  // 60 Hz target (1000 / 60).
const SLOW_THRESH = 22;  // > 22 ms = below 45 Hz, flag.

function* walkPlaygrounds(dir) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) yield* walkPlaygrounds(p);
    else if (e === 'spec.md') yield path.dirname(p);
  }
}

const rows = [];
let aboveBudget = 0;
let withData = 0;
for (const pg of walkPlaygrounds(path.join(ROOT, 'playgrounds'))) {
  const captured = path.join(pg, 'references', 'captured');
  let latest;
  try { latest = readdirSync(captured).sort().pop(); } catch { continue; }
  if (!latest) continue;
  const dir = path.join(captured, latest);
  const perfFiles = readdirSync(dir).filter(f => f.endsWith('.perf.json'));
  if (!perfFiles.length) continue;
  const medians = [], p95s = [];
  for (const f of perfFiles) {
    try {
      const p = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
      if (typeof p.median === 'number') medians.push(p.median);
      if (typeof p.p95 === 'number') p95s.push(p.p95);
    } catch {}
  }
  if (!medians.length) continue;
  medians.sort((a, b) => a - b);
  p95s.sort((a, b) => a - b);
  const med = medians[Math.floor(medians.length / 2)];
  const p95 = p95s[Math.floor(p95s.length / 2)];
  const slug = path.relative(path.join(ROOT, 'playgrounds'), pg);
  rows.push({ slug, median: med, p95 });
  withData += 1;
  if (med > SLOW_THRESH || p95 > SLOW_THRESH * 1.5) aboveBudget += 1;
}

rows.sort((a, b) => b.median - a.median);
const lines = [];
lines.push('# Performance report\n');
lines.push(`Generated: ${new Date().toISOString()}\n`);
lines.push(`Playgrounds with perf data: ${withData}\n`);
lines.push(`Budget: ${BUDGET_MS} ms (60 Hz). Flag threshold: ${SLOW_THRESH} ms (~45 Hz).\n`);
lines.push(`Above flag threshold: ${aboveBudget} / ${withData}.\n\n`);
lines.push('## Top 20 by median rAF time\n\n');
lines.push('| Slug | median (ms) | p95 (ms) |\n|-|-|-|\n');
for (const r of rows.slice(0, 20)) lines.push(`| ${r.slug} | ${r.median.toFixed(2)} | ${r.p95.toFixed(2)} |\n`);
if (aboveBudget) {
  lines.push('\n## Above budget\n\n');
  lines.push('| Slug | median (ms) | p95 (ms) |\n|-|-|-|\n');
  for (const r of rows.filter(r => r.median > SLOW_THRESH)) lines.push(`| ${r.slug} | ${r.median.toFixed(2)} | ${r.p95.toFixed(2)} |\n`);
}

writeFileSync(path.join(ROOT, 'docs', 'PERF_REPORT.md'), lines.join(''));
console.log(`Wrote docs/PERF_REPORT.md (${withData} playgrounds with perf data, ${aboveBudget} above ${SLOW_THRESH}ms).`);
