// build-card-thumbs.mjs
// Derives the card-banner thumbnails from the raw source drop in
// images/playground_cards/ into assets/thumbs/.
//
// Two output families:
//   1. Category banners (MAP)     thumb-<category>.jpg      one image per
//                                                            canonical tag.
//   2. Per-playground overrides   card-<slug>.jpg            picked up by
//      (CARD_OVERRIDE)                                        landing build,
//                                                            takes priority
//                                                            over the
//                                                            category banner.
//
// Optimal format: 1000 x 360 JPEG (~2.78:1, covers the card .cimg box
// at retina), center-cropped from any source aspect, quality q:v 3.
// Drop more PNG/JPG into images/playground_cards/, add a mapping line
// below (or a new TAG_THUMB category in build-landing.mjs), and rerun:
//   node scripts/build-card-thumbs.mjs
//
// Only ffmpeg is required (no ImageMagick/sharp on this machine).
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path'; import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'images', 'playground_cards');
const OUT = path.join(ROOT, 'assets', 'thumbs');

// source basename (no ext) -> category thumb filename (TAG_THUMB).
const MAP = {
  dense_flock: 'thumb-statistical-physics.jpg',   // murmuration / active matter
  atmospheric_vortices: 'thumb-fluids.jpg',       // vortex pair / turbulence
  black_hole: 'thumb-relativity.jpg',             // accretion disk + photon ring
  brain_scan: 'thumb-medical-physics.jpg',        // MRI slices
  star_field: 'thumb-stellar.jpg',                // globular cluster
  math_field: 'thumb-numerics.jpg',               // flow field / vector field
  orbits: 'thumb-mechanics.jpg',                  // orbital trails
  bioluminescent_field: 'thumb-quantum.jpg',      // wavefunction / field surface
  interference_pattern: 'thumb-optics.jpg',       // double-slit fringes (.webp)
  tesla_coil: 'thumb-electromagnetism.jpg',       // arc discharge
  glowing_hot_metal: 'thumb-thermodynamics.jpg',  // hot billet / heat
  bismuth: 'thumb-condensed-matter.jpg',          // iridescent crystal (solid-state)
  deep_field: 'thumb-cosmology.jpg',              // JWST/Hubble galaxy field
  // Spares (held for future per-card overrides or new categories):
  //   gravitational_grid: spacetime curvature sheet (alt relativity)
  //   two_galaxies_merging: galaxy-pair card (alt cosmology)
  //   spacecraft_fast: warp-cockpit (alt relativity / special-relativity)
  //   red_laser: laser-beam-in-smoke (alt optics; clean photo)
  //   cryogenic_superconductor: Meissner levitation (alt solid-state)
  //   exoplanet_transit: planet silhouette on disc (alt stellar/exoplanet)
  //   water_channel: shoreline waves (alt fluids; solitons)
  //   eclipse: solar corona (held for occultation / 3D Earth card)
  //   pyrite, crystal_lattice: cubic / hexagonal lattices (alt solid-state)
  //   frost_crystals: ice ferns (future nucleation / phase-transition)
  //   cloud_wall: dramatic cumulus (weak match; held as last-resort fallback)
};

// Per-playground custom thumbnails. Key = source basename (no ext) in
// images/playground_cards/. Value = list of playground slugs that should
// receive a card-<slug>.jpg generated from this source. build-landing.mjs
// checks for card-<slug>.jpg first and falls back to the category banner.
const CARD_OVERRIDE = {
  // Eclipse: only one card and the photo is unambiguous.
  eclipse: ['earth-eclipse-prediction-3d'],

  // Exoplanet transit: silhouette on the stellar disc.
  exoplanet_transit: [
    'exoplanet-transit-3d',
    'radial-velocity-exoplanet-detection-3d',
    'AST2004-transit-mandel-agol-analytic',
    'AST2004-radial-velocity-orbital-trace',
  ],

  // Soliton canal: real shoreline waves at dusk.
  water_channel: ['soliton-canal-3d'],

  // Special-relativity starship: warp-cockpit view.
  spacecraft_fast: [
    'special-relativity-starship-3d',
    'FIS2003-special-relativity-spacetime-lab',
    'FIS3028-aberration-of-light-stellar',
    'FIS3028-relativistic-doppler',
  ],

  // Red laser through smoke.
  red_laser: [
    'laser-cavity-3d',
    'FIS3019-laser-gaussian-beam-propagation',
    'FIS4035-laser-rate-equations-dynamics',
    'FIS4035-nonlinear-optics-shg',
  ],

  // Galaxy merger: the twin spirals.
  two_galaxies_merging: [
    'galaxy-collision-3d',
    'MAA-GD-galaxy-merger-nbody',
    'MAA-GD-chandrasekhar-dynamical-friction',
  ],

  // Meissner levitation: the cube on the LN2 cylinder.
  cryogenic_superconductor: [
    'superconductor-meissner-3d',
    'FIS3005-superconductivity-meissner-3d',
    'FIS3020-bcs-gap-self-consistent',
    'FIS3020-cooper-pair-binding-energy',
  ],

  // Curved-spacetime grid: relativity geometry icon.
  gravitational_grid: [
    'schwarzschild-kerr-blackhole-3d',
    'gravitational-lensing-3d',
    'gravity-in-n-dimensions-3d',
    'MF-GR-geodesics-curved-spacetime-3d',
    'M3007-curvature-tensor-2d-surfaces',
    'M3007-geodesic-deviation-equation',
    'M3007-parallel-transport-on-sphere',
    'AST3017-schwarzschild-geodesics',
    'AST3017-shapiro-time-delay',
    'AST3017-gravitational-redshift',
    'AST3017-gravitational-microlensing-event',
  ],

  // Pyrite cubic crystal: crystallography card alternate.
  pyrite: ['FIS3005-crystal-structure-3d-explorer'],

  // Hexagonal/graphene lattice: band-structure card.
  crystal_lattice: [
    'FIS3005-band-structure-tight-binding',
    'FIS3020-phonon-dispersion-1d-monatomic-diatomic',
    'FIS3020-fermi-surface-2d-square',
    'FIS3020-bloch-oscillations',
  ],
};

mkdirSync(OUT, { recursive: true });
let n = 0;

// Category banners.
for (const [base, out] of Object.entries(MAP)) {
  const src = ['png', 'jpg', 'jpeg', 'webp'].map((e) => path.join(SRC, `${base}.${e}`)).find(existsSync);
  if (!src) { console.warn(`skip ${base}: no source in images/playground_cards/`); continue; }
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', src,
    '-vf', 'scale=1000:360:force_original_aspect_ratio=increase,crop=1000:360,format=yuvj420p',
    '-q:v', '3', path.join(OUT, out),
  ]);
  n += 1;
  console.log(`${base} -> assets/thumbs/${out}`);
}

// Per-playground overrides.
let m = 0;
for (const [base, slugs] of Object.entries(CARD_OVERRIDE)) {
  const src = ['png', 'jpg', 'jpeg', 'webp'].map((e) => path.join(SRC, `${base}.${e}`)).find(existsSync);
  if (!src) { console.warn(`skip override ${base}: no source in images/playground_cards/`); continue; }
  // Make ONE intermediate (the cropped JPG) and copy it for every slug.
  // Saves N-1 ffmpeg invocations per source.
  const firstSlug = slugs[0];
  const firstOut = path.join(OUT, `card-${firstSlug}.jpg`);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error', '-i', src,
    '-vf', 'scale=1000:360:force_original_aspect_ratio=increase,crop=1000:360,format=yuvj420p',
    '-q:v', '3', firstOut,
  ]);
  m += 1;
  console.log(`${base} -> assets/thumbs/card-${firstSlug}.jpg`);
  for (let i = 1; i < slugs.length; i++) {
    const outPath = path.join(OUT, `card-${slugs[i]}.jpg`);
    execFileSync('cp', ['-f', firstOut, outPath]);
    m += 1;
    console.log(`     (link) assets/thumbs/card-${slugs[i]}.jpg`);
  }
}

console.log(`Wrote ${n} category banners and ${m} per-card overrides to assets/thumbs/`);
