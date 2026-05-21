#!/usr/bin/env node
// lint-layout-v2.mjs
// Static lint checks for the Playground Layout System v2 (spec Section 11).
// Importable (gate.mjs uses check 11.1) and runnable as a CLI:
//
//   node scripts/lint-layout-v2.mjs --canvas-fonts        scan every
//        playground .js for hardcoded ctx.font pixel sizes (check 11.1)
//   node scripts/lint-layout-v2.mjs --playground <dir>    run all
//        checks on one playground directory
//
// During the migration, checks 11.2-11.4 only hold for playgrounds
// already migrated to v2; check 11.1 holds for every playground.

import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(__dirname, '..');

// 11.1 hardcoded canvas font size. Spec-mandated pattern (authoritative).
const HARDCODED_FONT_RE = /ctx\.font\s*=\s*["'`].*\d+(\.\d+)?px/;

// Recursively collect files under dir whose name matches a predicate.
export function collectFiles(dir, predicate, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return acc; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'references' || e.name === '.git') continue;
      collectFiles(full, predicate, acc);
    } else if (predicate(e.name)) {
      acc.push(full);
    }
  }
  return acc;
}

// CHECK 11.1: no literal pixel size in any ctx.font assignment.
// Returns [{ file, line, text }].
export function lintCanvasFonts(files) {
  const violations = [];
  for (const file of files) {
    let src;
    try { src = fs.readFileSync(file, 'utf8'); } catch { continue; }
    src.split('\n').forEach((text, i) => {
      if (HARDCODED_FONT_RE.test(text)) {
        violations.push({ file, line: i + 1, text: text.trim() });
      }
    });
  }
  return violations;
}

// CHECK 11.2: the playground assigns the diagnostics interface.
export function lintDiagnosticFns(jsText) {
  const missing = [];
  if (!/window\.playground\.getState\s*=/.test(jsText)) missing.push('window.playground.getState');
  if (!/window\.playground\.getInvariants\s*=/.test(jsText)) missing.push('window.playground.getInvariants');
  return missing;
}

// CHECK 11.3: canonical HTML structure present.
export function lintCanonicalHtml(htmlText) {
  const required = [
    'playground-layout', 'playground-center', 'playground-rail',
    'playground-canvas-frame', 'playground-focus-toggle',
    'playground-canvas', 'playground-controls',
  ];
  return required.filter((cls) => !htmlText.includes(cls));
}

// CHECK 11.4: spec.md has invariants (>=3) and what_to_try (>=2).
// Counts list items under each frontmatter/section key. Tolerant of
// both YAML-list and markdown-list styles.
export function lintSpecFields(specText) {
  const problems = [];
  const countList = (key) => {
    const re = new RegExp(`(^|\\n)\\s*${key}\\s*:`, 'i');
    const m = specText.match(re);
    if (!m) return -1;                       // key absent
    const after = specText.slice(m.index + m[0].length);
    const block = after.split(/\n(?=\S)/)[0] || '';
    return (block.match(/(^|\n)\s*[-*]\s+/g) || []).length;
  };
  const inv = countList('invariants');
  if (inv === -1) problems.push('spec.md missing "invariants"');
  else if (inv < 3) problems.push(`spec.md invariants has ${inv} items (need >= 3)`);
  const wtt = countList('what_to_try');
  if (wtt === -1) problems.push('spec.md missing "what_to_try"');
  else if (wtt < 2) problems.push(`spec.md what_to_try has ${wtt} items (need >= 2)`);
  return problems;
}

// CHECK 11.5: overlay state text (warning only). Flags ctx.fillText
// calls whose literal contains "=" adjacent to a value, which is the
// usual shape of a removed-style state overlay.
export function lintOverlayText(files) {
  const warnings = [];
  const re = /ctx\.fillText\s*\(\s*[`'"][^`'"]*=\s*\$?\{?/;
  for (const file of files) {
    let src;
    try { src = fs.readFileSync(file, 'utf8'); } catch { continue; }
    src.split('\n').forEach((text, i) => {
      if (re.test(text)) warnings.push({ file, line: i + 1, text: text.trim() });
    });
  }
  return warnings;
}

// ---- CLI -----------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  if (args.includes('--canvas-fonts')) {
    const files = collectFiles(path.join(ROOT, 'playgrounds'), (n) => n.endsWith('.js'));
    const v = lintCanvasFonts(files);
    if (v.length === 0) {
      console.log(`OK lint 11.1: no hardcoded ctx.font sizes in ${files.length} files`);
      process.exit(0);
    }
    console.error(`FAIL lint 11.1: ${v.length} hardcoded ctx.font size(s)`);
    for (const x of v) console.error(`  ${path.relative(ROOT, x.file)}:${x.line}  ${x.text}`);
    process.exit(1);
  }
  if (args.includes('--playground')) {
    const dir = args[args.indexOf('--playground') + 1];
    if (!dir) { console.error('Usage: --playground <dir>'); process.exit(2); }
    const abs = path.resolve(ROOT, dir);
    const jsFiles = collectFiles(abs, (n) => n.endsWith('.js'));
    let fail = 0;
    const fontV = lintCanvasFonts(jsFiles);
    if (fontV.length) {
      fail += 1;
      console.error(`FAIL 11.1: ${fontV.length} hardcoded ctx.font size(s)`);
      for (const x of fontV) console.error(`  ${path.relative(ROOT, x.file)}:${x.line}`);
    } else console.log('OK 11.1: canvas fonts');
    const mainJs = path.join(abs, 'playground.js');
    if (fs.existsSync(mainJs)) {
      const miss = lintDiagnosticFns(fs.readFileSync(mainJs, 'utf8'));
      if (miss.length) { fail += 1; console.error(`FAIL 11.2: missing ${miss.join(', ')}`); }
      else console.log('OK 11.2: diagnostics interface');
    }
    const html = path.join(abs, 'index.html');
    if (fs.existsSync(html)) {
      const miss = lintCanonicalHtml(fs.readFileSync(html, 'utf8'));
      if (miss.length) { fail += 1; console.error(`FAIL 11.3: missing ${miss.join(', ')}`); }
      else console.log('OK 11.3: canonical HTML');
    }
    const spec = path.join(abs, 'spec.md');
    if (fs.existsSync(spec)) {
      const probs = lintSpecFields(fs.readFileSync(spec, 'utf8'));
      if (probs.length) { fail += 1; probs.forEach((p) => console.error(`FAIL 11.4: ${p}`)); }
      else console.log('OK 11.4: spec.md fields');
    }
    const warns = lintOverlayText(jsFiles);
    for (const w of warns) console.warn(`WARN 11.5 overlay text: ${path.relative(ROOT, w.file)}:${w.line}`);
    process.exit(fail > 0 ? 1 : 0);
  }
  console.error('Usage: lint-layout-v2.mjs --canvas-fonts | --playground <dir>');
  process.exit(2);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
