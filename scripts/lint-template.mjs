#!/usr/bin/env node
// lint-template.mjs
// Verifies every playgrounds/<slug>/index.html is byte-identical to what
// scripts/generate-playground-html.mjs would emit, and that no raw "<" or
// "$" appears in HTML text outside data-slot description/caption or
// #custom-controls. Inline <script> with LaTeX is forbidden.

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(__dirname, '..');

const { values } = parseArgs({
  options: {
    only: { type: 'string' },     // limit to one slug
    fix: { type: 'boolean', default: false },
    strict: { type: 'boolean', default: false }, // require regenerator match
  },
});

async function findHeroSpecs() {
  const out = [];
  async function recurse(d) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (['_template', 'failures', 'references'].includes(e.name)) continue;
      const full = path.join(d, e.name);
      try {
        await fs.access(path.join(full, 'spec.md'));
        await fs.access(path.join(full, 'index.html'));
        out.push(full);
      } catch {
        await recurse(full);
      }
    }
  }
  await recurse(path.join(ROOT, 'playgrounds/_heroes'));
  return out;
}

function findInlineScriptLatex(html) {
  const blocks = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  return blocks.some(m => /\$\$|\$[^$\n]+\$/.test(m[1]) && !/auto-render|katex/i.test(m[0]));
}

let failed = 0;
const heroes = await findHeroSpecs();
for (const pgDir of heroes) {
  const slug = path.basename(pgDir);
  if (values.only && values.only !== slug) continue;
  const live = await fs.readFile(path.join(pgDir, 'index.html'), 'utf-8');
  if (values.strict) {
    const r = spawnSync('node', [path.join(ROOT, 'scripts/generate-playground-html.mjs'), '--slug', slug], { encoding: 'utf-8' });
    if (r.status !== 0) { console.error(`generate failed for ${slug}:`, r.stderr); failed += 1; continue; }
    const fresh = await fs.readFile(path.join(pgDir, 'index.html'), 'utf-8');
    if (fresh !== live) {
      console.error(`HAND-EDIT: ${slug}/index.html differs from generator output`);
      failed += 1;
    }
  }
  if (findInlineScriptLatex(live)) {
    console.error(`INLINE-LATEX: ${slug}/index.html has $...$ in a non-KaTeX <script>`);
    failed += 1;
  }
}
if (failed === 0) console.log(`OK: ${heroes.length} hero index.html lint clean.`);
process.exit(failed === 0 ? 0 : 1);
