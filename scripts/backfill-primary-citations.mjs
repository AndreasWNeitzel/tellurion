#!/usr/bin/env node
// backfill-primary-citations.mjs
//
// Walks playgrounds/**/spec.md. For each spec.md that lacks a
// `primary_citation:` in its YAML frontmatter, looks up the
// canonical reference for its `primary_uc:` (course code) and
// injects `primary_citation: <bibkey>`. Then the existing
// backfill-spec-references.mjs can emit the `references:` block.
//
//   node scripts/backfill-primary-citations.mjs             # apply
//   node scripts/backfill-primary-citations.mjs --dry-run   # report only
//
// The UC -> bibkey table below maps Universidade do Porto physics
// course codes to their canonical textbook. Codes that fall through
// the table get no citation and are reported as misses; those are
// usually master-level seminars where a single canonical text does
// not exist.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PG = path.join(ROOT, 'playgrounds');
const DRY = process.argv.includes('--dry-run');

// UC code -> canonical textbook bibkey. Each entry is the standard
// reference for a Universidade do Porto physics or astrophysics
// course. Pick the most widely-used graduate or advanced-undergrad
// text per topic; supporting citations stay manual per playground.
const UC_TO_CITATION = {
  // BSc Year 1 mechanics
  FIS1013: 'taylor-mech',
  FIS1014: 'taylor-mech',
  FIS1004: 'marion-thornton',
  F1006:   'marion-thornton',

  // BSc Year 2 core
  FIS2001: 'griffithsem2017',  // Electrodynamics I
  FIS2002: 'french-waves',     // Waves
  FIS2003: 'callen',           // Thermodynamics
  FIS2006: 'griffithsqm2018',  // Quantum I
  FIS2013: 'pathria',          // Statistical Mechanics
  FIS2014: 'newmanbarkema1999',// Stat phys / phase transitions
  FIS2016: 'ashcroft-mermin',  // Solid State
  FIS2018: 'hecht-optics',     // Optics
  FIS2021: 'griffithsqm2018',  // Quantum Mechanics

  // BSc Year 3 advanced
  FIS3003: 'griffiths-particles', // Particle Physics
  FIS3005: 'krane-nuclear',       // Nuclear Physics
  FIS3008: 'carroll-spacetime',   // General Relativity
  FIS3019: 'newman2013',          // Computational Physics
  FIS3029: 'chen1984',            // Plasma Physics

  // BSc Astronomy
  AST2004: 'carroll-ostlie',   // Astrophysics intro
  AST3014: 'kulsrud-plasma-astro', // MHD
  AST3015: 'kippenhahn-weigert',   // Stellar
  AST3016: 'dodelson-cosmology',   // Cosmology
  AST3017: 'kippenhahn-weigert',   // Stellar astrophysics

  // Math methods
  M3012:   'arfken-weber',

  // Master Astrofísica (MAA-*)
  'MAA-AS': 'aerts2010',          // Asteroseismology
  'MAA-CO': 'dodelson2020',       // Cosmology
  'MAA-DM': 'bishop2006',         // Data mining / ML
  'MAA-GD': 'binney-tremaine',    // Galactic dynamics
  'MAA-HE': 'frank-king-raine',   // High-energy astrophysics
  'MAA-OT': 'lorimer-kramer',     // Observational techniques (radio/pulsars)
  'MAA-SS': 'kippenhahn-weigert', // Stellar structure
  'MAA-ST': 'mackay2003',         // Information theory / stats
};

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.isFile() && e.name === 'spec.md') yield p;
  }
}

function parseFrontmatter(text) {
  if (!text.startsWith('---\n')) return null;
  const end = text.indexOf('\n---', 4);
  if (end < 0) return null;
  return { yaml: text.slice(4, end), bodyStart: end + 4 };
}

function pluckScalar(yaml, key) {
  const m = yaml.match(new RegExp(`(^|\\n)\\s*${key}\\s*:\\s*(.+)`));
  if (!m) return null;
  return m[2].trim().replace(/^["']|["']$/g, '');
}

function processSpec(specPath) {
  const text = fs.readFileSync(specPath, 'utf8');
  const fm = parseFrontmatter(text);
  if (!fm) return { skipped: 'no-frontmatter' };
  if (/(^|\n)primary_citation\s*:/.test(fm.yaml)) return { skipped: 'has-citation' };
  const uc = pluckScalar(fm.yaml, 'primary_uc');
  if (!uc) return { skipped: 'no-primary-uc' };
  const bibkey = UC_TO_CITATION[uc];
  if (!bibkey) return { skipped: 'no-mapping', uc };

  // Insert primary_citation right after the primary_uc line so the
  // pair stays visually grouped in the frontmatter.
  const insertion = `primary_citation: ${bibkey}\n`;
  const newYaml = fm.yaml.replace(
    new RegExp(`((^|\\n)\\s*primary_uc\\s*:\\s*.+\\n)`),
    (m) => m + insertion,
  );
  if (newYaml === fm.yaml) return { skipped: 'replace-failed', uc };
  // Ensure exactly one newline between the YAML block and the closing
  // delimiter, matching the formatting used by backfill-spec-references.
  const trimmedYaml = newYaml.replace(/\s*$/, '') + '\n';
  const rewritten = '---\n' + trimmedYaml + '---' + text.slice(fm.bodyStart);
  if (!DRY) fs.writeFileSync(specPath, rewritten);
  return { added: 1, uc, bibkey };
}

function main() {
  const skipReasons = {};
  const missingMappings = new Map();
  let updated = 0, totalSpecs = 0;
  for (const sp of walk(PG)) {
    totalSpecs++;
    const r = processSpec(sp);
    if (r.skipped) {
      skipReasons[r.skipped] = (skipReasons[r.skipped] || 0) + 1;
      if (r.skipped === 'no-mapping') {
        missingMappings.set(r.uc, (missingMappings.get(r.uc) || 0) + 1);
      }
      continue;
    }
    updated++;
  }
  console.log(`scanned: ${totalSpecs} spec.md files`);
  console.log(`updated: ${updated}`);
  console.log('skipped:', JSON.stringify(skipReasons));
  if (missingMappings.size > 0) {
    console.log('UC codes without a mapping:');
    for (const [uc, n] of [...missingMappings.entries()].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${uc}: ${n}`);
    }
  }
  if (DRY) console.log('(dry-run: no files were modified)');
}

main();
