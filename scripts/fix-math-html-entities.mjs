#!/usr/bin/env node
// scripts/fix-math-html-entities.mjs
// Walks playgrounds/**/index.html and replaces raw < or > inside KaTeX
// $...$ math regions with \lt and \gt. Plain HTML stays untouched.
// Idempotent: re-running is a no-op.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

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

function patch(content) {
  // Find $...$ regions (no nested $; the simple parser is fine).
  // Replace literal '<' with '\lt' and '>' with '\gt' inside, but NOT
  // inside $$...$$ display mode (handled by the same logic with $$).
  let out = '';
  let i = 0;
  while (i < content.length) {
    const ch = content[i];
    if (ch === '$') {
      // Locate the closing $; treat $$ as the same delimiter.
      const isDisplay = content[i + 1] === '$';
      const open = isDisplay ? '$$' : '$';
      const start = i + open.length;
      let end = content.indexOf(open, start);
      if (end < 0) {
        // No closing; copy the rest verbatim.
        out += content.slice(i);
        break;
      }
      const inner = content.slice(start, end);
      // Replace < and > with \lt and \gt unless they're already escaped or part of \lt/\gt.
      let fixed = inner;
      fixed = fixed.replace(/(?<!\\)</g, '\\lt ');
      fixed = fixed.replace(/(?<!\\)>/g, '\\gt ');
      // Trim accidental double-space introduced when followed by space.
      fixed = fixed.replace(/\\lt  /g, '\\lt ').replace(/\\gt  /g, '\\gt ');
      out += open + fixed + open;
      i = end + open.length;
    } else {
      out += ch;
      i += 1;
    }
  }
  return out;
}

const files = await findIndexHtml(path.join(ROOT, 'playgrounds'));
let touched = 0;
for (const f of files) {
  const raw = await fs.readFile(f, 'utf-8');
  const fixed = patch(raw);
  if (fixed !== raw) {
    await fs.writeFile(f, fixed);
    touched += 1;
  }
}
console.log(`Scanned ${files.length} index.html, patched ${touched}.`);
