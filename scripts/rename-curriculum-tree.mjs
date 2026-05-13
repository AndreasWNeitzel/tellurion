#!/usr/bin/env node
// scripts/rename-curriculum-tree.mjs
// Phase 5 of the UPorto FCUP curriculum reorganization.
// Moves every playground folder from playgrounds/<slug>/ to
// playgrounds/<curriculum_year>/<primary_uc>-<slug>/, preserving git
// history via `git mv`. Patches every file inside the moved folder so
// the relative imports / hrefs / static paths still resolve. The
// _template directory stays at playgrounds/_template/ (its scaffolder
// is updated separately).
//
// Idempotent: if a playground already lives in the new tree, it is
// left alone.
//
// Run from the repo root: `node scripts/rename-curriculum-tree.mjs`.

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FENCE = '-'.repeat(3);

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
    const m = lines[i].match(/^([a-z_]+):\s*(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].trim();
  }
  return out;
}

async function walkFiles(dir) {
  const out = [];
  async function recurse(d) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await recurse(p);
      else if (e.isFile()) out.push(p);
    }
  }
  await recurse(dir);
  return out;
}

const TEXT_EXTS = new Set(['.html', '.js', '.mjs', '.md', '.json', '.txt', '.css']);
function isTextFile(p) {
  return TEXT_EXTS.has(path.extname(p).toLowerCase());
}

function patchFileContent(content) {
  let s = content;

  // Lift relative imports one level deeper.
  s = s.replace(/(['"`])\.\.\/\.\.\/shared\//g, '$1../../../shared/');
  s = s.replace(/(['"`])\.\.\/\.\.\/tests\//g, '$1../../../tests/');

  // Raw href / src in HTML (no quotes).
  s = s.replace(/href="\.\.\/\.\.\/shared\//g, 'href="../../../shared/');
  s = s.replace(/src="\.\.\/\.\.\/shared\//g, 'src="../../../shared/');

  // visual.test.mjs PROJECT_ROOT pattern: path.resolve(..., '..', '..')
  // becomes path.resolve(..., '..', '..', '..'). Match the exact line.
  s = s.replace(
    /const PROJECT_ROOT\s*=\s*path\.resolve\(PLAYGROUND_DIR, '\.\.', '\.\.'\);/g,
    "const PROJECT_ROOT   = path.resolve(PLAYGROUND_DIR, '..', '..', '..');"
  );

  // visual.test.mjs URL pattern: use path.relative so the URL adjusts
  // automatically to nesting depth, regardless of where the playground
  // ends up.
  const urlAddon = '\nconst URL_PATH = path.relative(PROJECT_ROOT, PLAYGROUND_DIR).split(path.sep).join(\'/\');';
  if (s.includes('const PG_SLUG = path.basename(PLAYGROUND_DIR);')) {
    // Inject URL_PATH right after PG_SLUG.
    s = s.replace(
      'const PG_SLUG = path.basename(PLAYGROUND_DIR);',
      `const PG_SLUG = path.basename(PLAYGROUND_DIR);${urlAddon}`
    );
    // Replace the URL template literal to use URL_PATH.
    s = s.replace(
      /\$\{baseUrl\}\/playgrounds\/\$\{PG_SLUG\}\/index\.html/g,
      '${baseUrl}/${URL_PATH}/index.html'
    );
  }

  return s;
}

async function patchFolder(dir) {
  const files = await walkFiles(dir);
  let touched = 0;
  for (const f of files) {
    if (!isTextFile(f)) continue;
    let raw;
    try { raw = await fs.readFile(f, 'utf-8'); } catch { continue; }
    const patched = patchFileContent(raw);
    if (patched !== raw) {
      await fs.writeFile(f, patched);
      touched += 1;
    }
  }
  return touched;
}

function gitMv(src, dst) {
  // Create parent directory first; git mv refuses to create intermediate dirs.
  return spawnSync('bash', ['-c', `mkdir -p "$(dirname "${dst}")" && git mv "${src}" "${dst}"`], {
    cwd: ROOT, encoding: 'utf-8',
  });
}

const playgroundsDir = path.join(ROOT, 'playgrounds');
const slugs = (await fs.readdir(playgroundsDir, { withFileTypes: true }))
  .filter(d => d.isDirectory() && d.name !== '_template')
  .map(d => d.name)
  .sort();

let moved = 0;
let already = 0;
let failed = [];
let touchedFiles = 0;
for (const slug of slugs) {
  // Skip if it looks like a year directory (already moved).
  if (slug.startsWith('bsc-') || slug.startsWith('msc-')) {
    already += 1;
    continue;
  }
  const oldDir = path.join(playgroundsDir, slug);
  const specPath = path.join(oldDir, 'spec.md');
  let raw;
  try { raw = await fs.readFile(specPath, 'utf-8'); }
  catch { failed.push(`${slug}: missing spec.md`); continue; }
  const fm = parseFrontmatter(raw);
  if (!fm || !fm.primary_uc || !fm.curriculum_year) {
    failed.push(`${slug}: missing curriculum frontmatter`);
    continue;
  }
  const newRel = path.join('playgrounds', fm.curriculum_year, `${fm.primary_uc}-${slug}`);
  const newDir = path.join(ROOT, newRel);
  const r = gitMv(path.join('playgrounds', slug), newRel);
  if (r.status !== 0) {
    failed.push(`${slug}: git mv failed: ${r.stderr.trim()}`);
    continue;
  }
  const t = await patchFolder(newDir);
  touchedFiles += t;
  moved += 1;
}

console.log(`Moved: ${moved}`);
console.log(`Already in new tree: ${already}`);
console.log(`Failed: ${failed.length}`);
for (const f of failed) console.log(`  ${f}`);
console.log(`Files patched in moved folders: ${touchedFiles}`);
