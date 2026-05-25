#!/usr/bin/env node
// backfill-spec-references.mjs
//
// Walks playgrounds/**/spec.md. For each spec.md that has a
// `primary_citation:` bibkey in its YAML frontmatter but no
// `references:` list, derives a one-line author-title-chapter string
// from docs/CITATIONS.bib and inserts the list. The rail's REFERENCES
// section is fed exclusively from this list (see shared/js/rail.js).
//
//   node scripts/backfill-spec-references.mjs           # apply
//   node scripts/backfill-spec-references.mjs --dry-run # report only
//
// Idempotent: skips any spec.md that already has `references:`.
//
// Citation format mirrors the hand-written ones already in the repo:
//   "Author, Title, Edition, Ch. N."
// Multiple citations join their lines in a YAML block.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BIB = path.join(ROOT, 'docs', 'CITATIONS.bib');
const PG = path.join(ROOT, 'playgrounds');
const DRY = process.argv.includes('--dry-run');

// ---- bib parsing ------------------------------------------------------------
// Parses entries of the form
//   @book{key,
//     author = {...},
//     title  = {...},
//     edition = {...},
//   }
// chapter_index = {...} blocks are ignored.
function parseBib(text) {
  const out = {};
  // Find each entry by '@type{key,' and balance braces to the matching close.
  let i = 0;
  while (i < text.length) {
    const at = text.indexOf('@', i);
    if (at < 0) break;
    const openBrace = text.indexOf('{', at);
    if (openBrace < 0) break;
    const comma = text.indexOf(',', openBrace);
    if (comma < 0) break;
    const key = text.slice(openBrace + 1, comma).trim();
    // Balance braces to end of entry.
    let depth = 1, j = openBrace + 1;
    while (j < text.length && depth > 0) {
      const c = text[j];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      j++;
    }
    const body = text.slice(comma + 1, j - 1);
    out[key] = parseFields(body);
    i = j;
  }
  return out;
}

// Parse field = {value} pairs from an entry body. Handles brace-balanced values.
function parseFields(body) {
  const fields = {};
  let i = 0;
  while (i < body.length) {
    const eq = body.indexOf('=', i);
    if (eq < 0) break;
    // Strip leading comma + whitespace from the previous-field separator and
    // pick the last identifier on the line as the field name.
    const head = body.slice(i, eq).replace(/^[\s,]+/, '').trim();
    const nameMatch = head.match(/([A-Za-z_][\w-]*)\s*$/);
    const name = nameMatch ? nameMatch[1].toLowerCase() : head.toLowerCase();
    let k = eq + 1;
    while (k < body.length && /\s/.test(body[k])) k++;
    if (body[k] !== '{') { i = eq + 1; continue; }
    let depth = 1, m = k + 1;
    while (m < body.length && depth > 0) {
      if (body[m] === '{') depth++;
      else if (body[m] === '}') depth--;
      m++;
    }
    const value = body.slice(k + 1, m - 1).replace(/\s+/g, ' ').trim();
    fields[name] = value;
    i = m;
  }
  return fields;
}

// Shorten a bibtex author list to "Last, Last, Last" style.
// Input "Goldstein, H. and Poole, C. P. and Safko, J. L." -> "Goldstein, Poole, Safko".
// Two authors stay two (avoids the lonely "Cormen et al."). Four or more collapse to "First et al."
function shortenAuthors(s) {
  if (!s) return '';
  const parts = s.split(/\s+and\s+/).map((p) => p.trim()).filter(Boolean);
  const lastNames = parts.map((p) => {
    if (p.includes(',')) return p.split(',')[0].trim();        // "Last, First"
    const tokens = p.split(/\s+/);                              // "First Last"
    return tokens[tokens.length - 1];
  });
  if (lastNames.length >= 4) return `${lastNames[0]} et al.`;
  return lastNames.join(', ');
}

// "3" -> "3rd ed.", "2" -> "2nd ed.", "1" -> "1st ed.", "4th" -> "4th ed.".
function formatEdition(s) {
  if (!s) return '';
  const t = String(s).trim();
  if (/ed\.?$/i.test(t)) return t;                              // already labelled
  if (/^\d+$/.test(t)) {
    const n = Number(t);
    const suffix = n % 10 === 1 && n % 100 !== 11 ? 'st'
                : n % 10 === 2 && n % 100 !== 12 ? 'nd'
                : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th';
    return `${n}${suffix} ed.`;
  }
  return `${t} ed.`;
}

// Format a single bib entry as a short reference string.
//   "Last, Last, Title, 3rd ed., Ch. N."
// If chapter is missing, drop the trailing ", Ch. N." Edition is appended only
// when explicit. Both author and title fall back to the bibkey if absent.
function formatReference(entry, chapter, bibkey) {
  if (!entry) return null;
  const author = shortenAuthors(entry.author) || bibkey;
  const title = entry.title || '';
  const edition = formatEdition(entry.edition);
  let s = author;
  if (title) s += `, ${title}`;
  if (edition) s += `, ${edition}`;
  if (chapter !== undefined && chapter !== null && chapter !== '') {
    s += `, Ch. ${chapter}.`;
  } else if (!s.endsWith('.')) {
    s += '.';
  }
  return s;
}

// ---- spec scan + rewrite ----------------------------------------------------
function* walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name === 'spec.md') yield p;
  }
}

function parseFrontmatter(text) {
  // Tolerant scan: expect leading '---\n', return { yaml, body, endIdx }.
  if (!text.startsWith('---')) return null;
  const after = text.indexOf('\n---', 3);
  if (after < 0) return null;
  const yaml = text.slice(3, after).replace(/^\n/, '');
  const bodyStart = after + 4;                  // skip "\n---"
  return { yaml, bodyStart };
}

// Pluck a top-level scalar key from YAML frontmatter. Returns string or null.
function pluck(yaml, key) {
  const m = yaml.match(new RegExp(`(^|\\n)\\s*${key}\\s*:\\s*([^\\n]*)`, 'i'));
  if (!m) return null;
  let v = m[2].trim();
  v = v.replace(/^["']|["']$/g, '');
  return v || null;
}

// Pluck a list-valued key like "supporting_citations: [a, b]" OR
//   supporting_citations:
//     - a
//     - b
function pluckList(yaml, key) {
  // Inline form.
  const inline = yaml.match(new RegExp(`(^|\\n)\\s*${key}\\s*:\\s*\\[([^\\]]*)\\]`, 'i'));
  if (inline) {
    return inline[2].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  }
  // Block form.
  const m = yaml.match(new RegExp(`(^|\\n)\\s*${key}\\s*:\\s*(.*)`, 'i'));
  if (!m) return [];
  if (m[2].trim()) return [m[2].trim().replace(/^["']|["']$/g, '')];
  const idx = yaml.indexOf(m[0]) + m[0].length;
  const tail = yaml.slice(idx);
  const block = tail.split(/\n(?=\S)/)[0] || '';
  return block.split('\n')
    .map((l) => l.match(/^\s*[-*]\s+(.+)$/))
    .filter(Boolean)
    .map((m) => m[1].trim().replace(/^["']|["']$/g, ''));
}

// Build the YAML block. Strings are quoted; semicolons or colons in the
// references would otherwise re-parse as nested YAML.
function emitReferencesBlock(refs) {
  return ['references:', ...refs.map((r) => `  - ${JSON.stringify(r)}`)].join('\n');
}

function processSpec(specPath, bib) {
  const text = fs.readFileSync(specPath, 'utf8');
  const fm = parseFrontmatter(text);
  if (!fm) return { skipped: 'no-frontmatter' };
  // Already has references? Skip.
  if (/(^|\n)references\s*:/i.test(fm.yaml)) return { skipped: 'has-references' };

  const primary = pluck(fm.yaml, 'primary_citation');
  if (!primary) return { skipped: 'no-primary-citation' };
  const chapter = pluck(fm.yaml, 'primary_chapter');
  const supporting = pluckList(fm.yaml, 'supporting_citations');

  const refs = [];
  for (const [bibkey, ch] of [[primary, chapter], ...supporting.map((s) => [s, null])]) {
    const r = formatReference(bib[bibkey], ch, bibkey);
    if (r) refs.push(r);
  }
  if (refs.length === 0) return { skipped: 'no-bib-match', primary };

  const newYaml = fm.yaml.replace(/\s*$/, '') + '\n' + emitReferencesBlock(refs) + '\n';
  const rewritten = '---\n' + newYaml + '---' + text.slice(fm.bodyStart);
  if (!DRY) fs.writeFileSync(specPath, rewritten);
  return { added: refs.length, refs };
}

// ---- main -------------------------------------------------------------------
function main() {
  const bibText = fs.readFileSync(BIB, 'utf8');
  const bib = parseBib(bibText);
  console.log(`bib: ${Object.keys(bib).length} entries`);
  const skipReasons = {};
  let updated = 0, totalRefs = 0, totalSpecs = 0;
  for (const sp of walk(PG)) {
    totalSpecs++;
    const r = processSpec(sp, bib);
    if (r.skipped) {
      skipReasons[r.skipped] = (skipReasons[r.skipped] || 0) + 1;
      if (r.skipped === 'no-bib-match') {
        console.log(`  miss: ${path.relative(ROOT, sp)} (primary=${r.primary})`);
      }
      continue;
    }
    updated++;
    totalRefs += r.added;
  }
  console.log(`scanned: ${totalSpecs} spec.md files`);
  console.log(`updated: ${updated} (added ${totalRefs} reference entries)`);
  console.log('skipped:', JSON.stringify(skipReasons));
  if (DRY) console.log('(dry-run: no files were modified)');
}

main();
