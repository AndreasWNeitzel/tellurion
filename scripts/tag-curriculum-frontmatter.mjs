#!/usr/bin/env node
// scripts/tag-curriculum-frontmatter.mjs
// Phase 1 of the UPorto curriculum reorganization.
// For each playground spec.md, inject:
//   primary_uc:    <one UC code>
//   supporting_ucs: [<list>]
//   curriculum_year: <bsc-y1s1 ... msc-y1>
// directly before the closing YAML fence, preserving everything else.
// Idempotent: if primary_uc is already present, the file is left untouched.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FENCE = '-'.repeat(3);

const MAP = {
  // FIS1013 Mechanics (bsc-y1s1)
  'double-pendulum':              ['FIS1013', ['FIS2021'],           'bsc-y1s1'],
  'projectile-with-air-drag':     ['FIS1013', [],                    'bsc-y1s1'],
  'pendulum-on-moving-cart':      ['FIS1013', ['FIS2021'],           'bsc-y1s1'],
  'foucault-pendulum':            ['FIS1013', [],                    'bsc-y1s1'],
  'magnus-effect-spinning-ball':  ['FIS1013', ['AST3014'],           'bsc-y1s1'],
  'brachistochrone-cycloid':      ['FIS1013', ['FIS2021'],           'bsc-y1s1'],
  'tautochrone-isochronism':      ['FIS1013', ['FIS2021'],           'bsc-y1s1'],
  'catenary-hanging-chain':       ['FIS1013', ['FIS2021'],           'bsc-y1s1'],
  'gyroscope-precession':         ['FIS1013', ['FIS2021'],           'bsc-y1s1'],
  'inverted-pendulum-kapitza':    ['FIS1013', ['FIS2021'],           'bsc-y1s1'],
  'coupled-springs-normal-modes': ['FIS1013', ['FIS2016', 'FIS2021'],'bsc-y1s1'],
  'damped-driven-oscillator':     ['FIS1013', ['FIS2016', 'FIS1015'],'bsc-y1s1'],
  'beats-superposition':          ['FIS1013', ['FIS2016'],           'bsc-y1s1'],
  'lissajous-figures':            ['FIS1013', ['FIS1015'],           'bsc-y1s1'],

  // FIS1014 Electromagnetism I (bsc-y1s2)
  'electric-field-lines-charges': ['FIS1014', [],                    'bsc-y1s2'],
  'brewster-angle-fresnel':       ['FIS1014', ['FIS3019'],           'bsc-y1s2'],

  // FIS2013 Electromagnetism II (bsc-y2s1)
  'cyclotron-uniform-b':          ['FIS2013', ['MAA-PL'],            'bsc-y2s1'],
  'exb-drift-cycloid':            ['FIS2013', ['MAA-PL'],            'bsc-y2s1'],

  // FIS2014 Thermal Physics (bsc-y2s1)
  'maxwell-boltzmann-emergence':  ['FIS2014', [],                    'bsc-y2s1'],
  'ising-triangular':             ['FIS2014', ['FIS2018', 'MAA-NM'], 'bsc-y2s1'],
  'xy-model-bkt':                 ['FIS2014', ['FIS2018', 'MAA-NM'], 'bsc-y2s1'],
  'potts-q-state-transition':     ['FIS2014', ['FIS2018', 'MAA-NM'], 'bsc-y2s1'],
  'percolation-2d':               ['FIS2014', ['FIS2018', 'MAA-NM'], 'bsc-y2s1'],
  'frustrated-triangular-af':     ['FIS2014', ['FIS2018', 'MAA-NM'], 'bsc-y2s1'],
  'abelian-sandpile-btw':         ['FIS2014', ['FIS2018', 'MAA-NM'], 'bsc-y2s1'],

  // FIS2016 Waves and Continuous Media (bsc-y2s1)
  'wave-on-string-reflection':       ['FIS2016', [],                          'bsc-y2s1'],
  'standing-waves-string-modes':     ['FIS2016', [],                          'bsc-y2s1'],
  'doppler-effect':                  ['FIS2016', ['AST2004'],                 'bsc-y2s1'],
  'single-double-multi-slit':        ['FIS2016', ['FIS3019'],                 'bsc-y2s1'],
  'airy-pattern-circular-aperture':  ['FIS2016', ['FIS3019', 'MAA-OT'],       'bsc-y2s1'],

  // AST2004 Astrophysics (bsc-y2s1)
  'rotation-curve-explorer':           ['AST2004', ['MAA-GD'],          'bsc-y2s1'],
  'lagrange-points-cr3bp':             ['AST2004', ['FIS2021'],         'bsc-y2s1'],
  'mercury-precession-pn':             ['AST2004', ['AST3017'],         'bsc-y2s1'],
  'roche-tidal-disruption':            ['AST2004', ['MAA-HE'],          'bsc-y2s1'],
  'schwarzschild-effective-potential': ['AST2004', ['AST3017'],         'bsc-y2s1'],
  'kepler-orbit-explorer':             ['AST2004', [],                  'bsc-y2s1'],
  'three-body-orbit':                  ['AST2004', ['FIS2021', 'FIS1013'],'bsc-y2s1'],

  // FIS2018 Computational Physics (bsc-y2s2)
  'advection-scheme-shootout':       ['FIS2018', ['MAA-NM'],            'bsc-y2s2'],
  'mc-integration-convergence':      ['FIS2018', ['MAA-NM', 'MAA-ST'],  'bsc-y2s2'],
  'runge-vs-chebyshev':              ['FIS2018', ['M3012', 'MAA-NM'],   'bsc-y2s2'],
  'gauss-quadrature-vs-trapezoid':   ['FIS2018', ['M3012', 'MAA-NM'],   'bsc-y2s2'],

  // FIS2021 Analytical Mechanics (bsc-y2s2)
  'lorenz-attractor':              ['FIS2021', [],                'bsc-y2s2'],
  'rossler-funnel':                ['FIS2021', [],                'bsc-y2s2'],
  'henon-strange-attractor':       ['FIS2021', [],                'bsc-y2s2'],
  'billiards-circle-stadium-sinai':['FIS2021', [],                'bsc-y2s2'],
  'standard-map-kam':              ['FIS2021', [],                'bsc-y2s2'],
  'duffing-oscillator':            ['FIS2021', ['FIS1013'],       'bsc-y2s2'],
  'arnold-cat-map':                ['FIS2021', [],                'bsc-y2s2'],
  'van-der-pol-relaxation':        ['FIS2021', ['FIS1013'],       'bsc-y2s2'],
  'fitzhugh-nagumo-excitable':     ['FIS2021', [],                'bsc-y2s2'],
  'predator-prey-hopf':            ['FIS2021', [],                'bsc-y2s2'],
  'logistic-cobweb':               ['FIS2021', ['FIS2018'],       'bsc-y2s2'],
  'coupled-kuramoto-oscillators':  ['FIS2021', [],                'bsc-y2s2'],
  'liouvillian-flow':              ['FIS2021', [],                'bsc-y2s2'],
  'mandelbrot-explorer':           ['FIS2021', ['FIS2018'],       'bsc-y2s2'],
  'lyapunov-spectrum':             ['FIS2021', [],                'bsc-y2s2'],

  // AST3014 Fluids and Plasmas (bsc-y3s1)
  'sph-sod-shock-tube':   ['AST3014', ['FIS2018'],  'bsc-y3s1'],
  'two-stream-pic-plasma':['AST3014', ['MAA-PL'],   'bsc-y3s1'],

  // AST3015 Computational Astronomy (bsc-y3s1)
  'particle-mesh-2d-disk':['AST3015', ['MAA-GD'],   'bsc-y3s1'],

  // FIS3019 Optics and Photonics (bsc-y3s1)
  'gaussian-beam-paraxial': ['FIS3019', [],         'bsc-y3s1'],
  'thin-film-interference': ['FIS3019', [],         'bsc-y3s1'],

  // AST3016 Radiative Processes (bsc-y3s2)
  'relativistic-beaming-azimuth':['AST3016', ['MAA-HE'], 'bsc-y3s2'],

  // AST3017 Relativistic Cosmology and Astrophysics (bsc-y3s2)
  'shapiro-time-delay':       ['AST3017', [],       'bsc-y3s2'],
  'gravitational-redshift':   ['AST3017', [],       'bsc-y3s2'],
  'schwarzschild-geodesics':  ['AST3017', [],       'bsc-y3s2'],

  // FIS3029 Quantum Mechanics II (bsc-y3s2)
  'bloch-sphere-qubit-gates':            ['FIS3029', [],            'bsc-y3s2'],
  'harmonic-oscillator-coherent-state':  ['FIS3029', ['FIS2017'],   'bsc-y3s2'],
  'particle-in-a-well-zoo':              ['FIS3029', ['FIS2017'],   'bsc-y3s2'],
  'hydrogen-orbital-cross-sections-2d':  ['FIS3029', ['FIS2017'],   'bsc-y3s2'],
  '1d-tdse-scattering-comparator':       ['FIS3029', ['FIS2018'],   'bsc-y3s2'],
  'kronig-penney-bands':                 ['FIS3029', ['FIS3020'],   'bsc-y3s2'],
  'tunneling-rectangular-barrier':       ['FIS3029', ['FIS2017'],   'bsc-y3s2'],
  'wkb-vs-shooting':                     ['FIS3029', ['FIS2018'],   'bsc-y3s2'],

  // MAA-DM Data Mining and ML (msc-y1)
  'tsne-vs-umap-vs-isomap':    ['MAA-DM', [],          'msc-y1'],
  'backprop-tiny-net':         ['MAA-DM', [],          'msc-y1'],
  'mean-field-vi-on-banana':   ['MAA-DM', ['MAA-ST'],  'msc-y1'],
  'gp-kernel-zoo':             ['MAA-DM', ['MAA-ST'],  'msc-y1'],
  'em-on-gmm-2d':              ['MAA-DM', [],          'msc-y1'],
  'bayesian-coin-update':      ['MAA-DM', ['MAA-ST'],  'msc-y1'],
  'attention-as-soft-retrieval':['MAA-DM',[],          'msc-y1'],

  // MAA-ST Statistics for Astronomy (msc-y1)
  'kl-divergence-asymmetry':   ['MAA-ST', ['MAA-DM'],  'msc-y1'],
  'mutual-information-2d':     ['MAA-ST', ['MAA-DM'],  'msc-y1'],
  'maxent-distribution-zoo':   ['MAA-ST', [],          'msc-y1'],
  'channel-capacity-bsc':      ['MAA-ST', [],          'msc-y1'],
  'mcmc-comparator':           ['MAA-ST', ['MAA-DM'],  'msc-y1'],

  // MAA-HE High-Energy Astrophysics (msc-y1)
  'accretion-disk-temperature-profile':['MAA-HE', [],  'msc-y1'],
};

function injectFrontmatter(content, primary, supporting, year) {
  if (content.includes('primary_uc:')) return { changed: false, content };
  const lines = content.split('\n');
  if (lines[0] !== FENCE) return { changed: false, content };
  let close = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === FENCE) { close = i; break; }
  }
  if (close < 0) return { changed: false, content };
  const supportingFmt = supporting.length === 0
    ? '[]'
    : `[${supporting.join(', ')}]`;
  const injection = [
    `primary_uc: ${primary}`,
    `supporting_ucs: ${supportingFmt}`,
    `curriculum_year: ${year}`,
  ];
  const out = [...lines.slice(0, close), ...injection, ...lines.slice(close)];
  return { changed: true, content: out.join('\n') };
}

const playgroundsDir = path.join(ROOT, 'playgrounds');
const entries = (await fs.readdir(playgroundsDir, { withFileTypes: true }))
  .filter(d => d.isDirectory() && d.name !== '_template')
  .map(d => d.name)
  .sort();

let tagged = 0;
let skipped = 0;
const orphans = [];
for (const slug of entries) {
  const specPath = path.join(playgroundsDir, slug, 'spec.md');
  let raw;
  try { raw = await fs.readFile(specPath, 'utf-8'); }
  catch { orphans.push(`${slug}: no spec.md`); continue; }
  const mapping = MAP[slug];
  if (!mapping) { orphans.push(`${slug}: no UC mapping`); continue; }
  const [primary, supporting, year] = mapping;
  const { changed, content } = injectFrontmatter(raw, primary, supporting, year);
  if (!changed) { skipped += 1; continue; }
  await fs.writeFile(specPath, content);
  tagged += 1;
}

console.log(`Tagged: ${tagged}`);
console.log(`Skipped (already tagged): ${skipped}`);
console.log(`Total mappings defined: ${Object.keys(MAP).length}`);
console.log(`Orphans (no mapping or no spec.md): ${orphans.length}`);
for (const o of orphans) console.log(`  ${o}`);
