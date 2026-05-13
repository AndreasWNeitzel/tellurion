#!/usr/bin/env node
// scripts/lint-playground-html.mjs [--fix] [<playground-slug-or-path>]
// Lints index.html files for HTML parse hazards inside KaTeX math regions.
//
// The main hazard is a raw '<' or '>' inside a $...$ block, which Vite's
// dev server parses as the start of an HTML tag and refuses to render.
// KaTeX accepts \lt and \gt as drop-in replacements, so the fix is to
// rewrite the math regions, not the surrounding prose.
//
// Run from the repo root:
//   node scripts/lint-playground-html.mjs            (check all)
//   node scripts/lint-playground-html.mjs --fix      (patch all)
//   node scripts/lint-playground-html.mjs <slug>     (single playground)
//   node scripts/lint-playground-html.mjs --fix <slug>

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const FIX = args.includes('--fix');
const target = args.find(a => a !== '--fix');

function findHazards(content) {
  const issues = [];
  let i = 0;
  while (i < content.length) {
    const ch = content[i];
    if (ch === '$') {
      const isDisplay = content[i + 1] === '$';
      const open = isDisplay ? '$$' : '$';
      const start = i + open.length;
      const end = content.indexOf(open, start);
      if (end < 0) break;
      const inner = content.slice(start, end);
      // Find unescaped < or >.
      for (let k = 0; k < inner.length; k += 1) {
        const c = inner[k];
        if ((c === '<' || c === '>') && inner[k - 1] !== '\\') {
          const lineNum = content.slice(0, start + k).split('\n').length;
          issues.push({ ch: c, lineNum, index: start + k });
        }
      }
      i = end + open.length;
    } else {
      i += 1;
    }
  }
  return issues;
}

function applyFix(content) {
  let out = '';
  let i = 0;
  while (i < content.length) {
    const ch = content[i];
    if (ch === '$') {
      const isDisplay = content[i + 1] === '$';
      const open = isDisplay ? '$$' : '$';
      const start = i + open.length;
      const end = content.indexOf(open, start);
      if (end < 0) { out += content.slice(i); break; }
      let inner = content.slice(start, end);
      inner = inner.replace(/(?<!\\)</g, '\\lt ').replace(/(?<!\\)>/g, '\\gt ');
      inner = inner.replace(/\\lt  /g, '\\lt ').replace(/\\gt  /g, '\\gt ');
      out += open + inner + open;
      i = end + open.length;
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

async function findIndexHtml(dir) {
  const out = [];
  async function recurse(d) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === '_template' || e.name === 'references' || e.name === 'golden-frames' || e.name === 'captured') continue;
        await recurse(p);
      } else if (e.isFile() && e.name === 'index.html') {
        out.push(p);
      }
    }
  }
  await recurse(dir);
  return out;
}

async function resolveTarget(t) {
  if (!t) return findIndexHtml(path.join(ROOT, 'playgrounds'));
  // Try direct path or slug.
  const direct = path.resolve(ROOT, t);
  try {
    const st = await fs.stat(direct);
    if (st.isDirectory()) return [path.join(direct, 'index.html')];
    return [direct];
  } catch {}
  // Search recursively for matching slug.
  const all = await findIndexHtml(path.join(ROOT, 'playgrounds'));
  return all.filter(p => p.includes(t));
}

const files = await resolveTarget(target);
let totalIssues = 0;
let fixedCount = 0;
for (const f of files) {
  const raw = await fs.readFile(f, 'utf-8');
  const issues = findHazards(raw);
  if (issues.length === 0) continue;
  totalIssues += issues.length;
  console.log(`${path.relative(ROOT, f)}: ${issues.length} hazard${issues.length === 1 ? '' : 's'}`);
  for (const it of issues) console.log(`  line ${it.lineNum}: raw ${it.ch} inside math`);
  if (FIX) {
    const fixed = applyFix(raw);
    await fs.writeFile(f, fixed);
    fixedCount += 1;
  }
}

if (totalIssues === 0) {
  console.log(`OK: ${files.length} files clean.`);
  process.exit(0);
}
if (FIX) {
  console.log(`Patched ${fixedCount} files.`);
  process.exit(0);
}
console.error(`FAIL: ${totalIssues} hazards in ${files.length} file(s). Re-run with --fix.`);
process.exit(2);
