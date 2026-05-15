#!/usr/bin/env node
// scripts/quality-audit.mjs
// Audits every playground against the three engagement gates:
//   Q1 AUTOPLAY  - animates within ~3 s of load with no user input
//   Q2 DRAMA     - at least one control produces a qualitative change
//   Q3 PHYSICAL  - primary visual is a spatial/temporal scene, not a plot
// Heuristic, not a substitute for human review. Writes docs/QUALITY-AUDIT.md.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PG = path.join(ROOT, 'playgrounds');
const FM_RE = new RegExp('^' + '\\-\\-\\-' + '\\n([\\s\\S]*?)\\n' + '\\-\\-\\-');

const SPATIAL_NOUNS = [
  'particle', 'field', 'lattice', 'atom', 'star', 'wave', 'beam', 'orbit',
  'shell', 'disk', 'grid', 'spectrum', 'spectra', 'ring', 'vortex', 'shower',
  'pendulum', 'sphere', 'galaxy', 'fluid', 'shadow', 'trajectory', 'cascade',
  'surface', 'nucleon', 'spin', 'cell', 'gas', 'string', 'membrane', 'ray',
];

async function walk(dir, depth, out) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const full = path.join(dir, e.name);
    const spec = path.join(full, 'spec.md');
    try { await fs.access(spec); out.push(full); } catch {}
    if (depth < 3) await walk(full, depth + 1, out);
  }
}

function fm(text) {
  const m = text.match(FM_RE);
  const o = {};
  if (!m) return o;
  for (const line of m[1].split('\n')) {
    const c = line.indexOf(':');
    if (c < 0) continue;
    o[line.slice(0, c).trim()] = line.slice(c + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return o;
}

const dirs = [];
await walk(PG, 0, dirs);
dirs.sort();

const rows = [];
for (const d of dirs) {
  if (d.includes('/_template')) continue;
  const rel = path.relative(PG, d);
  const spec = await fs.readFile(path.join(d, 'spec.md'), 'utf-8').catch(() => '');
  const meta = fm(spec);
  if (meta.status === 'deprecated') continue;
  let js = '';
  try { js = await fs.readFile(path.join(d, 'playground.js'), 'utf-8'); } catch {}
  const body = spec.replace(FM_RE, '').toLowerCase();

  // Q1: an animation loop is started at top level (not only inside an event
  // handler). Heuristic: requestAnimationFrame or setInterval appears, and
  // at least one such call is NOT lexically inside an addEventListener body.
  const hasRAF = /requestAnimationFrame|setInterval/.test(js);
  const onlyOnEvent = hasRAF && !/(^|\n)\s*(requestAnimationFrame|tick|loop|animate|bootSync|raf\s*=)/.test(js)
    && /addEventListener[\s\S]*requestAnimationFrame/.test(js)
    && !/requestAnimationFrame\([^)]*\);\s*\n[\s\S]*addEventListener/.test(js);
  const q1 = hasRAF && !onlyOnEvent;

  // Q2: more than one slider OR the spec mentions a qualitative change.
  const sliderCount = (js.match(/type:\s*'range'|type="range"|type='range'|buildSlider|slider\(/g) || []).length;
  const dramaWord = /(bifurcat|phase transition|chaos|chaotic|threshold|critical|instability|resonance|caustic|tipping|qualitativ|symmetry break|magic number|transition)/.test(body);
  const q2 = sliderCount >= 2 || dramaWord;

  // Q3: spec body has a spatial noun, OR does not lean on "curve"/"plot".
  const hasSpatial = SPATIAL_NOUNS.some(n => body.includes(n));
  const plotLean = /\bcurve\b|\bplot\b/.test(body);
  const q3 = hasSpatial || !plotLean;

  const passes = [q1, q2, q3].filter(Boolean).length;
  rows.push({ rel, title: meta.title || rel, status: meta.status || '?', q1, q2, q3, passes });
}

const pass = rows.filter(r => r.passes === 3);
const partial = rows.filter(r => r.passes === 1 || r.passes === 2);
const fail = rows.filter(r => r.passes === 0);

const L = [];
L.push('# Quality Audit (three-gate engagement test)');
L.push('');
L.push('Heuristic audit. Q1 AUTOPLAY, Q2 DRAMA, Q3 PHYSICAL INSTANTIATION.');
L.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
L.push('');
L.push(`Total audited (excludes deprecated + template): ${rows.length}`);
L.push(`PASS ${pass.length}  PARTIAL ${partial.length}  FAIL ${fail.length}`);
L.push('');
function tbl(title, arr) {
  L.push(`## ${title} (${arr.length})`);
  L.push('');
  for (const r of arr.sort((a, b) => a.rel.localeCompare(b.rel))) {
    L.push(`- ${r.q1 ? 'Q1' : 'q1'} ${r.q2 ? 'Q2' : 'q2'} ${r.q3 ? 'Q3' : 'q3'}  \`${r.rel}\`  ${r.title}`);
  }
  L.push('');
}
tbl('FAIL (all three gates fail)', fail);
tbl('PARTIAL (one or two gates fail)', partial);
tbl('PASS (all three gates)', pass);

await fs.writeFile(path.join(ROOT, 'docs', 'QUALITY-AUDIT.md'), L.join('\n'), 'utf-8');
console.log(`audited ${rows.length}: PASS ${pass.length} PARTIAL ${partial.length} FAIL ${fail.length}`);
