#!/usr/bin/env node
// Flags playgrounds that are likely "static plot + slider" with no spatial
// scene and no autonomous motion. Heuristic signals (higher score = more
// likely a boring static plot):
//   +2  spec body mentions curve/plot but no spatial noun
//   +2  playground.js has no requestAnimationFrame OR rAF only redraws a
//       plot that does not change without a slider event
//   +1  <= 1 slider and no buttons beyond reset/pause
//   +1  playground.js never calls fillRect/arc in a loop over many objects
//       (no particle/field rendering) and has axis-drawing (moveTo+lineTo)
//   -2  spec body has a strong spatial noun
// Writes docs/STATIC-PLOT-AUDIT.md ranked worst-first.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PG = path.join(ROOT, 'playgrounds');
const FM = new RegExp('^' + '\\-\\-\\-' + '\\n([\\s\\S]*?)\\n' + '\\-\\-\\-');
const SPATIAL = ['particle','field','lattice','atom','star','wave','beam','orbit',
  'shell','disk','grid','spectrum','vortex','shower','pendulum','sphere','galaxy',
  'fluid','shadow','trajectory','cascade','surface','nucleon','spin','gas','string',
  'membrane','ray','planet','crystal','flow','jet','rotor','arm','tail'];

async function walk(d, depth, out) {
  let es; try { es = await fs.readdir(d, { withFileTypes: true }); } catch { return; }
  for (const e of es) {
    if (!e.isDirectory()) continue;
    const f = path.join(d, e.name);
    try { await fs.access(path.join(f, 'spec.md')); out.push(f); } catch {}
    if (depth < 3) await walk(f, depth + 1, out);
  }
}

const dirs = [];
await walk(PG, 0, dirs);
dirs.sort();

const rows = [];
for (const d of dirs) {
  if (d.includes('/_template')) continue;
  const rel = path.relative(PG, d);
  const spec = await fs.readFile(path.join(d, 'spec.md'), 'utf-8').catch(() => '');
  const meta = {};
  const m = spec.match(FM);
  if (m) for (const ln of m[1].split('\n')) { const c = ln.indexOf(':'); if (c > 0) meta[ln.slice(0, c).trim()] = ln.slice(c + 1).trim(); }
  if (meta.status === 'deprecated') continue;
  let js = '';
  try { js = await fs.readFile(path.join(d, 'playground.js'), 'utf-8'); } catch {}
  const body = spec.replace(FM, '').toLowerCase();

  let score = 0;
  const reasons = [];
  const hasSpatial = SPATIAL.some(n => body.includes(n));
  const plotLean = /\bcurve\b|\bplot\b|\baxes\b|\bx-axis\b/.test(body);
  if (plotLean && !hasSpatial) { score += 2; reasons.push('spec plot-only'); }
  if (hasSpatial) { score -= 2; }
  const hasRAF = /requestAnimationFrame|setInterval/.test(js);
  if (!hasRAF) { score += 2; reasons.push('no animation loop'); }
  const sliderCount = (js.match(/type="range"|type='range'|buildSlider|slider\(/g) || []).length;
  if (sliderCount <= 1) { score += 1; reasons.push('<=1 slider'); }
  const hasAxes = /moveTo\([^)]*\);\s*ctx\.lineTo|strokeStyle[\s\S]{0,40}moveTo/.test(js);
  const objLoop = /for\s*\([^)]*\)\s*\{[\s\S]{0,200}(arc\(|fillRect\()/.test(js);
  if (hasAxes && !objLoop) { score += 1; reasons.push('axes, no object loop'); }
  if (score >= 3) rows.push({ rel, title: meta.title || rel, status: meta.status || '?', score, reasons });
}

rows.sort((a, b) => b.score - a.score || a.rel.localeCompare(b.rel));
const L = [];
L.push('# Static-Plot Audit');
L.push('');
L.push('Playgrounds heuristically flagged as static-plot-plus-slider (score >= 3).');
L.push('Higher score = more likely a boring plot needing a spatial/animated makeover.');
L.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
L.push(`Flagged: ${rows.length}`);
L.push('');
for (const r of rows) L.push(`- [${r.score}] \`${r.rel}\`  ${r.title}  (${r.reasons.join(', ')})`);
L.push('');
await fs.writeFile(path.join(ROOT, 'docs', 'STATIC-PLOT-AUDIT.md'), L.join('\n'), 'utf-8');
console.log(`flagged ${rows.length} static-plot playgrounds (score>=3)`);
