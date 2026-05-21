#!/usr/bin/env node
// audit-playgrounds.mjs
// Walks playgrounds/ and writes playgrounds/_audit.json, the migration
// manifest for the Playground Layout System v2 (spec Section 10.1).
//
// For every playground (a directory containing index.html) it records
// the structural facts the migration protocol needs, plus a per-
// playground migration status. Re-running the script PRESERVES any
// existing status values; it only refreshes the detected fields.
//
//   node scripts/audit-playgrounds.mjs

import fs from 'node:fs';
import path from 'node:path';
import {
  collectFiles, lintCanvasFonts, lintOverlayText,
  lintDiagnosticFns,
} from './lint-layout-v2.mjs';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(__dirname, '..');
const PG_ROOT = path.join(ROOT, 'playgrounds');
const MANIFEST = path.join(PG_ROOT, '_audit.json');

// Find every playground directory (one that directly contains index.html).
function findPlaygrounds(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return acc; }
  if (entries.some((e) => e.isFile() && e.name === 'index.html')) {
    acc.push(dir);
    return acc;                              // playgrounds do not nest
  }
  for (const e of entries) {
    if (e.isDirectory() && e.name !== 'references' && e.name !== 'node_modules') {
      findPlaygrounds(path.join(dir, e.name), acc);
    }
  }
  return acc;
}

function read(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

// Has a frontmatter / section key with at least one non-empty value.
function hasSpecField(specText, key) {
  const re = new RegExp(`(^|\\n)\\s*${key}\\s*:(.*)`, 'i');
  const m = specText.match(re);
  if (!m) return false;
  if (m[2] && m[2].trim() && m[2].trim() !== '[]') return true;   // inline value
  // Otherwise look for a list under the key.
  const after = specText.slice(m.index + m[0].length);
  const block = after.split(/\n(?=\S)/)[0] || '';
  return /(^|\n)\s*[-*]\s+\S/.test(block);
}

function auditOne(dir) {
  const rel = path.relative(ROOT, dir);
  const id = path.basename(dir);
  const primaryTag = path.basename(path.dirname(dir));   // section directory
  const html = read(path.join(dir, 'index.html'));
  const specText = read(path.join(dir, 'spec.md'));
  const mainJs = read(path.join(dir, 'playground.js'));
  const jsFiles = collectFiles(dir, (n) => n.endsWith('.js'));

  const canvasCount = (html.match(/<canvas/gi) || []).length;
  const diagFns = lintDiagnosticFns(mainJs);

  return {
    id,
    path: rel,
    primary_tag: primaryTag,
    canvas_count: canvasCount,
    hardcoded_fonts: lintCanvasFonts(jsFiles).length > 0,
    overlay_text: lintOverlayText(jsFiles).length > 0,
    spec: {
      prerequisites: hasSpecField(specText, 'prerequisites'),
      what_to_try: hasSpecField(specText, 'what_to_try'),
      invariants: hasSpecField(specText, 'invariants'),
      references: hasSpecField(specText, 'references'),
    },
    has_get_state: !diagFns.includes('window.playground.getState'),
    has_get_invariants: !diagFns.includes('window.playground.getInvariants'),
    status: 'pending',     // pending | migrated | needs-attention | skipped
  };
}

function main() {
  // Preserve existing per-id statuses across re-runs.
  let priorStatus = {};
  if (fs.existsSync(MANIFEST)) {
    try {
      const prior = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
      for (const p of prior.playgrounds || []) priorStatus[p.id] = p.status;
    } catch { /* regenerate from scratch */ }
  }

  const dirs = findPlaygrounds(PG_ROOT).sort();
  const playgrounds = dirs.map((d) => {
    const rec = auditOne(d);
    if (priorStatus[rec.id]) rec.status = priorStatus[rec.id];
    return rec;
  });

  const counts = playgrounds.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const manifest = {
    generated: new Date().toISOString(),
    total: playgrounds.length,
    status_counts: counts,
    playgrounds,
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`audit: ${playgrounds.length} playgrounds -> ${path.relative(ROOT, MANIFEST)}`);
  console.log(`status: ${JSON.stringify(counts)}`);
  const withFonts = playgrounds.filter((p) => p.hardcoded_fonts).length;
  console.log(`hardcoded ctx.font sizes present in ${withFonts} playgrounds`);
}

main();
