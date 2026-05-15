#!/usr/bin/env node
// generate-playground-html.mjs --slug <slug>
// Reads spec.md frontmatter and injects title, description, caption into
// shared/template/playground.html, writing playgrounds/<slug>/index.html.
// HTML-escapes text but leaves KaTeX delimiters intact so the auto-render
// pass converts $...$ and $$...$$ to math at runtime.

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(__dirname, '..');
const TEMPLATE = path.join(ROOT, 'shared/template/playground.html');
const FENCE = '-'.repeat(3);

function escapeOutsideKatex(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('$$', i)) {
      const j = s.indexOf('$$', i + 2);
      if (j < 0) { out.push(htmlEscape(s.slice(i))); break; }
      out.push(s.slice(i, j + 2));
      i = j + 2;
    } else if (s[i] === '$') {
      const j = s.indexOf('$', i + 1);
      if (j < 0) { out.push(htmlEscape(s.slice(i))); break; }
      out.push(s.slice(i, j + 1));
      i = j + 1;
    } else {
      let j = i;
      while (j < s.length && s[j] !== '$') j += 1;
      out.push(htmlEscape(s.slice(i, j)));
      i = j;
    }
  }
  return out.join('');
}

function htmlEscape(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseFrontmatter(text) {
  const re = new RegExp(`^${FENCE}\\n([\\s\\S]*?)\\n${FENCE}`);
  const m = text.match(re);
  if (!m) return {};
  const fm = {};
  for (const line of m[1].split('\n')) {
    const eq = line.indexOf(':');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    val = val.replace(/^(['"])([\s\S]*)\1$/, '$2');
    fm[key] = val;
  }
  return fm;
}

const { values } = parseArgs({ options: { slug: { type: 'string' } } });
if (!values.slug) {
  console.error('Usage: generate-playground-html.mjs --slug <slug>');
  process.exit(1);
}

async function resolveSlug(slug) {
  const direct = path.join(ROOT, 'playgrounds', slug);
  try { await fs.access(path.join(direct, 'spec.md')); return direct; } catch {}
  // Collect ALL matches across the tree so we can detect ambiguity rather
  // than silently returning the first one fs.readdir happens to return.
  const matches = [];
  async function recurse(d) {
    let entries;
    try { entries = await fs.readdir(d, { withFileTypes: true }); }
    catch { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const full = path.join(d, e.name);
      if (e.name === slug || e.name.endsWith('-' + slug)) {
        try { await fs.access(path.join(full, 'spec.md')); matches.push(full); } catch {}
      }
      await recurse(full);
    }
  }
  await recurse(path.join(ROOT, 'playgrounds'));
  if (matches.length === 0) return null;
  if (matches.length > 1) {
    console.error('ambiguous slug:', slug, 'matches:\n  ' + matches.join('\n  '));
    process.exit(2);
  }
  return matches[0];
}

const pgDir = await resolveSlug(values.slug);
if (!pgDir) { console.error('not found:', values.slug); process.exit(1); }

const spec = await fs.readFile(path.join(pgDir, 'spec.md'), 'utf-8');
const fm = parseFrontmatter(spec);
const template = await fs.readFile(TEMPLATE, 'utf-8');

const title = fm.title || values.slug;
const description = fm.description || 'Playground.';
const caption = fm.caption || `Figure 1. ${title}.`;

const html = template
  .replaceAll('__TITLE__', escapeOutsideKatex(title))
  .replaceAll('__DESCRIPTION__', escapeOutsideKatex(description))
  .replaceAll('__CAPTION__', escapeOutsideKatex(caption));

await fs.writeFile(path.join(pgDir, 'index.html'), html);
console.log(`wrote ${path.relative(ROOT, path.join(pgDir, 'index.html'))}`);
