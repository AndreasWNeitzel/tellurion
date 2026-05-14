import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (entry === 'spec.md') yield p;
  }
}

// Heuristic tag inference from primary_uc.
const UC_TAGS = {
  FIS1013: ['mechanics'],
  FIS1014: ['electromagnetism'],
  FIS1015: ['optics', 'waves'],
  FIS2013: ['electromagnetism'],
  FIS2014: ['thermodynamics', 'statistical-physics'],
  FIS2016: ['waves'],
  FIS2017: ['quantum'],
  FIS2018: ['numerics'],
  FIS2021: ['mechanics'],
  FIS3019: ['optics'],
  FIS3020: ['solid-state'],
  FIS3028: ['relativity'],
  FIS3029: ['quantum', 'atomic-molecular'],
  FIS3030: ['nuclear-particle'],
  AST2004: ['stellar', 'exoplanets'],
  AST3014: ['fluids-mhd', 'stellar'],
  AST3015: ['exoplanets', 'numerics'],
  AST3016: ['stellar'],
  AST3017: ['cosmology'],
  M1015: ['numerics'],
  M1017: ['numerics'],
  M1038: ['numerics'],
  M2037: ['numerics'],
  M3007: ['relativity'],
  M3012: ['numerics'],
  CC1017: ['numerics'],
  'MAA-AS': ['stellar'],
  'MAA-CS': ['cosmology'],
  'MAA-GD': ['galactic'],
  'MAA-HE': ['stellar', 'fluids-mhd'],
  'MAA-OT': ['optics'],
  'MAA-SA': ['stellar'],
  'MAA-SP': ['stellar'],
  'MAA-SS': ['exoplanets'],
  'MAA-AB': ['exoplanets'],
  'MAA-ST': ['numerics'],
  'MAA-NM': ['numerics'],
};

const STYLE_DEFAULT = ['animation', 'live-readout'];

function parseYaml(text) {
  const out = {};
  const lines = text.split('\n');
  let key = null;
  for (const line of lines) {
    if (/^[a-zA-Z_]+:/.test(line)) {
      const [k, ...rest] = line.split(':');
      out[k.trim()] = rest.join(':').trim();
    }
  }
  return out;
}

const files = Array.from(walk('playgrounds'));

let updated = 0;
for (const path of files) {
  const text = readFileSync(path, 'utf8');
  const fenceEnd = text.indexOf('\n---', 4);
  if (fenceEnd < 0) continue;
  const fm = text.slice(4, fenceEnd);
  const body = text.slice(fenceEnd + 4);
  const parsed = parseYaml(fm);
  // Skip if already has hook field.
  if (parsed.hook) continue;

  const uc = parsed.primary_uc || '';
  const topicTags = UC_TAGS[uc] || ['numerics'];
  const tags = [...topicTags, ...STYLE_DEFAULT].join(', ');

  const newFm = [
    fm.trimEnd(),
    `hook: 'STATUS: needs_hook'`,
    `one_paragraph: 'STATUS: needs_paragraph'`,
    `tags: [${tags}]`,
    `difficulty: 3`,
    `tier: simple`,
    `hero_candidate: false`,
    `renderer: canvas2d`,
    `estimated_engagement_minutes: 3`,
    `share_state_keys: []`,
  ].join('\n');

  const FENCE = '-'.repeat(3);
  const out = `${FENCE}\n${newFm}\n${FENCE}${body}`;
  writeFileSync(path, out);
  updated += 1;
}
console.log(`Updated ${updated} spec.md frontmatters with dissemination metadata.`);
