#!/usr/bin/env node
// scripts/build-curriculum-index.mjs
// Phase 3 of the UPorto curriculum reorganization.
// Walks every playgrounds/<slug>/spec.md, reads its YAML frontmatter,
// groups by curriculum_year then by primary_uc in the order ratified
// by the directive, and emits docs/CURRICULUM.md. The top of the file
// carries a summary table by status (draft / in-progress / verified /
// implemented / shipped).
//
// A minimal hand-rolled YAML reader is used; we do not pull in js-yaml.
// Only flat key: value and key: [a, b] are supported, which matches
// every spec.md frontmatter in this repo.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FENCE = '-'.repeat(3);
const DASH = '-'.repeat(3);
const TABLE_SEP = `|${DASH}|${DASH}|`;

const UC_ORDER = {
  'bsc-y1s1': [
    ['FIS1013', 'Mechanics'],
    ['M1017',   'Real Analysis I'],
    ['M1038',   'Linear Algebra and Analytic Geometry'],
    ['CC1017',  'Programming I'],
    ['CTT1001', 'Communication in Science'],
  ],
  'bsc-y1s2': [
    ['FIS1014', 'Electromagnetism I'],
    ['FIS1015', 'Physics Laboratory I'],
    ['M1015',   'Analysis II'],
    ['Q1014',   'Fundamentals of Chemistry'],
    ['Q1015',   'General Chemistry Laboratory'],
  ],
  'bsc-y2s1': [
    ['FIS2013', 'Electromagnetism II'],
    ['FIS2014', 'Thermal Physics'],
    ['FIS2016', 'Waves and Continuous Media'],
    ['AST2004', 'Astrophysics'],
    ['M2037',   'Analysis III'],
  ],
  'bsc-y2s2': [
    ['FIS2017', 'Modern Physics'],
    ['FIS2018', 'Computational Physics'],
    ['FIS2020', 'Physics Laboratory II'],
    ['FIS2021', 'Analytical Mechanics'],
    ['FIS2019', 'Quantum Mechanics I'],
  ],
  'bsc-y3s1': [
    ['AST3014', 'Fluids and Plasmas in Astrophysics'],
    ['AST3015', 'Computational Astronomy'],
    ['AST3018', 'Astrophysics Project'],
    ['FIS3019', 'Optics and Photonics'],
    ['FIS3027', 'Physics Laboratory III'],
    ['M3012',   'Mathematical Methods in the Sciences'],
  ],
  'bsc-y3s2': [
    ['AST3016', 'Radiative Processes in Astrophysics'],
    ['AST3017', 'Relativistic Cosmology and Astrophysics'],
    ['FIS3020', 'Condensed Matter Physics'],
    ['FIS3028', 'Electrodynamics and Relativity'],
    ['FIS3029', 'Quantum Mechanics II'],
    ['FIS3030', 'Physics of the Nucleus and Particles'],
    ['FIS3033', 'Data Acquisition and Control Laboratory'],
    ['M3007',   'Differential Geometry'],
  ],
  'msc-y1': [
    ['MAA-GD',  'Galactic Dynamics'],
    ['MAA-SA',  'Stellar Astrophysics'],
    ['MAA-SP',  'Stellar Atmospheres and Spectra'],
    ['MAA-EX',  'Extragalactic Astrophysics'],
    ['MAA-CS',  'Cosmology'],
    ['MAA-SS',  'Solar System and Exoplanets'],
    ['MAA-AS',  'Asteroseismology'],
    ['MAA-PL',  'Plasma Astrophysics'],
    ['MAA-HE',  'High-Energy Astrophysics'],
    ['MAA-AB',  'Astrobiology'],
    ['MAA-DM',  'Data Mining and Machine Learning for Astronomy'],
    ['MAA-NM',  'Numerical Methods in Astrophysics'],
    ['MAA-ST',  'Statistics for Astronomy'],
    ['MAA-IN',  'Space Instrumentation'],
    ['MAA-OT',  'Optical / Infrared / Radio Observational Techniques'],
  ],
};

const YEAR_ORDER = [
  ['bsc-y1s1', 'BSc Year 1 Semester 1'],
  ['bsc-y1s2', 'BSc Year 1 Semester 2'],
  ['bsc-y2s1', 'BSc Year 2 Semester 1'],
  ['bsc-y2s2', 'BSc Year 2 Semester 2'],
  ['bsc-y3s1', 'BSc Year 3 Semester 1 (Astrophysics profile)'],
  ['bsc-y3s2', 'BSc Year 3 Semester 2 (Astrophysics profile)'],
  ['msc-y1',   'MSc Year 1 (Astronomy and Astrophysics)'],
];

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0] !== FENCE) return null;
  let close = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === FENCE) { close = i; break; }
  }
  if (close < 0) return null;
  const out = {};
  for (let i = 1; i < close; i += 1) {
    const line = lines[i];
    const m = line.match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    val = val.replace(/^(['"])([\s\S]*)\1$/, '$2');
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim();
      val = inner.length === 0 ? [] : inner.split(',').map(s => s.trim());
    }
    out[m[1]] = val;
  }
  return out;
}

function extractPitch(content) {
  const m = content.match(/Strong invariant:\s*(.+?)\.\s/);
  return m ? m[1].trim() : null;
}

// Fallback when frontmatter lacks primary_citation: scan the body's
// `## Citations` section for the first `(\`cite-key\`)` token and the
// preceding `Ch. N` if present.
function extractCitationFromBody(content) {
  const idx = content.search(/^##\s+Citations/m);
  if (idx < 0) return { key: null, chapter: null };
  const section = content.slice(idx).split(/\n##\s/)[0];
  const lines = section.split('\n');
  for (const line of lines) {
    const k = line.match(/`([a-z][a-z0-9-]{3,})`/);
    if (!k) continue;
    const c = line.match(/Ch(?:\.|apter)?\s*([0-9]+)/);
    return { key: k[1], chapter: c ? c[1] : null };
  }
  return { key: null, chapter: null };
}

const playgroundsDir = path.join(ROOT, 'playgrounds');

async function findPlaygroundDirs(d) {
  const out = [];
  async function recurse(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (e.name === '_template' || e.name === 'references' || e.name === 'golden-frames' || e.name === 'captured') continue;
      const full = path.join(dir, e.name);
      try {
        await fs.access(path.join(full, 'spec.md'));
        out.push(full);
      } catch {
        await recurse(full);
      }
    }
  }
  await recurse(d);
  return out;
}

const playgroundDirs = await findPlaygroundDirs(playgroundsDir);
playgroundDirs.sort();

const playgrounds = [];
const statusCount = { draft: 0, 'in-progress': 0, verified: 0, implemented: 0, shipped: 0 };
const orphans = [];
for (const dir of playgroundDirs) {
  const slug = path.basename(dir);
  const urlPath = path.relative(ROOT, dir).split(path.sep).join('/');
  const specPath = path.join(dir, 'spec.md');
  let raw;
  try { raw = await fs.readFile(specPath, 'utf-8'); }
  catch { orphans.push(`${slug}: missing spec.md`); continue; }
  const fm = parseFrontmatter(raw);
  if (!fm) { orphans.push(`${slug}: unparseable frontmatter`); continue; }
  if (!fm.primary_uc || !fm.curriculum_year) {
    orphans.push(`${slug}: missing primary_uc or curriculum_year`);
    continue;
  }
  const pitch = extractPitch(raw);
  const bodyCite = (!fm.primary_citation) ? extractCitationFromBody(raw) : { key: null, chapter: null };
  playgrounds.push({
    slug,
    urlPath,
    title: fm.title || slug,
    status: fm.status || 'unknown',
    primary_uc: fm.primary_uc,
    supporting_ucs: Array.isArray(fm.supporting_ucs) ? fm.supporting_ucs : [],
    curriculum_year: fm.curriculum_year,
    primary_citation: fm.primary_citation || bodyCite.key,
    primary_chapter: fm.primary_chapter || bodyCite.chapter,
    pitch,
  });
  if (statusCount[fm.status] !== undefined) statusCount[fm.status] += 1;
}

// Build the output document.
const out = [];
out.push('# UPorto FCUP Curriculum Index');
out.push('');
out.push('Chronological reference for the playground catalog, aligned to the BSc in Physics and the MSc in Astronomy and Astrophysics at FCUP, University of Porto.');
out.push('');
out.push('This file is regenerated by `scripts/build-curriculum-index.mjs`. Edits here are overwritten; the source of truth is the YAML frontmatter in each `playgrounds/<slug>/spec.md`.');
out.push('');
out.push('See `docs/BUILD_ORDER.md` for the engineering-priority view (which playground anchors which engine).');
out.push('');

// Summary table
out.push('## Summary');
out.push('');
out.push(`Total playgrounds: ${playgrounds.length}`);
out.push('');
out.push('| Status | Count |');
out.push(TABLE_SEP);
out.push(`| draft | ${statusCount.draft} |`);
out.push(`| in-progress | ${statusCount['in-progress']} |`);
out.push(`| implemented | ${statusCount.implemented} |`);
out.push(`| verified | ${statusCount.verified} |`);
out.push(`| shipped | ${statusCount.shipped} |`);
out.push('');

// Per-year per-UC sections
for (const [yearKey, yearLabel] of YEAR_ORDER) {
  const yearPlaygrounds = playgrounds.filter(p => p.curriculum_year === yearKey);
  if (yearPlaygrounds.length === 0) continue;
  out.push(`## ${yearLabel}`);
  out.push('');
  out.push(`${yearPlaygrounds.length} playgrounds.`);
  out.push('');
  const ucList = UC_ORDER[yearKey];
  if (!ucList) continue;
  for (const [ucCode, ucName] of ucList) {
    const ucPlaygrounds = yearPlaygrounds.filter(p => p.primary_uc === ucCode);
    if (ucPlaygrounds.length === 0) continue;
    out.push(`### ${ucCode} ${ucName}`);
    out.push('');
    out.push(`${ucPlaygrounds.length} primary; supporting use of this UC appears elsewhere when listed.`);
    out.push('');
    for (const p of ucPlaygrounds) {
      const citation = p.primary_citation
        ? `\`${p.primary_citation}\` ch ${p.primary_chapter ?? '?'}`
        : 'citation pending';
      const supporting = p.supporting_ucs.length > 0
        ? ` (supporting: ${p.supporting_ucs.join(', ')})`
        : '';
      const pitchTail = p.pitch ? `; ${p.pitch}` : '';
      out.push(`- **${p.title}** ([${p.slug}](../${p.urlPath}/)). Status: \`${p.status}\`. ${citation}${supporting}${pitchTail}.`);
    }
    out.push('');
  }
}

if (orphans.length > 0) {
  out.push('## Orphans');
  out.push('');
  out.push('Playgrounds without parseable frontmatter or curriculum mapping. Run Phase 1 tagging to resolve.');
  out.push('');
  for (const o of orphans) out.push(`- ${o}`);
  out.push('');
}

const text = out.join('\n');
const docsDir = path.join(ROOT, 'docs');
await fs.mkdir(docsDir, { recursive: true });
const target = path.join(docsDir, 'CURRICULUM.md');
await fs.writeFile(target, text);

console.log(`Wrote ${target}`);
console.log(`Playgrounds indexed: ${playgrounds.length}`);
for (const [k, v] of Object.entries(statusCount)) console.log(`  ${k}: ${v}`);
console.log(`Orphans: ${orphans.length}`);
for (const o of orphans) console.log(`  ${o}`);
