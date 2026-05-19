// build-card-thumbs.mjs
// Derives the per-category card banner thumbnails from the raw source
// drop in images/playground_cards/ into assets/thumbs/. The landing
// build (build-landing.mjs, TAG_THUMB) wires assets/thumbs/<file>
// onto every card whose primary category matches; the .cimg box uses
// background center/cover, so the optimal source is a wide banner.
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
  interference_pattern: 'thumb-optics.jpg',       // fringes (optics)
  // eclipse: held for a future solar / occultation card.
};

mkdirSync(OUT, { recursive: true });
let n = 0;
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
console.log(`Wrote ${n} card thumbnails to assets/thumbs/`);
