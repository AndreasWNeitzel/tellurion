#!/usr/bin/env node
// scripts/visual-deviation-check.mjs --hero <slug> [--threshold 0.15]
// Compares the most recent t-050.png capture of a hero playground to its
// target.png. If RMS pixel deviation exceeds threshold, prints a heartbeat
// directive to stdout that an external 10-minute heartbeat monitor can pipe
// to Claude Code so that visual-reviewer, aesthetics-reviewer, and
// physics-skeptic subagents get spawned. Stderr always contains the
// numerical deviation.
//
// Exit codes:
//   0  deviation within threshold (no subagent spawn needed)
//   1  deviation above threshold (heartbeat directive on stdout)
//   2  setup error (target missing, no captures, size mismatch unresolvable)

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const { values } = parseArgs({
  options: {
    hero: { type: 'string', default: 'schwarzschild-kerr-blackhole-3d' },
    threshold: { type: 'string', default: '0.15' }
  }
});

const refDir = path.join(ROOT, 'playgrounds/_heroes', values.hero, 'references');
const capturedDir = path.join(refDir, 'captured');
const targetPath = path.join(refDir, 'target.png');

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const pExecFile = promisify(execFile);

async function readPng(p) {
  let buf = await fs.readFile(p);
  // Some "target.png" files in this repo are actually WebP. Detect by the
  // first 4 bytes and route through ffmpeg to decode to real PNG.
  if (!(buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47)) {
    const tmp = path.join('/tmp', `viscmp-${process.pid}-${Date.now()}.png`);
    await pExecFile('ffmpeg', ['-y', '-loglevel', 'error', '-i', p, tmp]);
    buf = await fs.readFile(tmp);
    fs.unlink(tmp).catch(() => {});
  }
  return new Promise((resolve, reject) => {
    new PNG().parse(buf, (err, png) => err ? reject(err) : resolve(png));
  });
}

function bilinear(png, u, v) {
  const x = Math.max(0, Math.min(png.width - 1.001, u * (png.width - 1)));
  const y = Math.max(0, Math.min(png.height - 1.001, v * (png.height - 1)));
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = x0 + 1, y1 = y0 + 1;
  const fx = x - x0, fy = y - y0;
  const idx = (xx, yy) => (yy * png.width + xx) * 4;
  const r = [0, 1, 2].map(c => {
    const a = png.data[idx(x0, y0) + c];
    const b = png.data[idx(x1, y0) + c];
    const cc = png.data[idx(x0, y1) + c];
    const d = png.data[idx(x1, y1) + c];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (cc * (1 - fx) + d * fx) * fy;
  });
  return r;
}

try {
  await fs.access(targetPath);
} catch {
  console.error(`No target.png at ${targetPath}`);
  process.exit(2);
}

let entries;
try {
  entries = (await fs.readdir(capturedDir)).filter(f => /^\d{4}-\d{2}/.test(f));
} catch {
  console.error(`No captures dir at ${capturedDir}`);
  process.exit(2);
}
if (entries.length === 0) {
  console.error(`No timestamped captures in ${capturedDir}`);
  process.exit(2);
}
entries.sort();
let latestPath = null;
for (let k = entries.length - 1; k >= 0; k -= 1) {
  const candidate = path.join(capturedDir, entries[k], 't-050.png');
  try { await fs.access(candidate); latestPath = candidate; break; } catch {}
}
if (!latestPath) {
  console.error(`No timestamped capture contains t-050.png in ${capturedDir}`);
  process.exit(2);
}

const [latest, target] = await Promise.all([readPng(latestPath), readPng(targetPath)]);

const SAMPLE = 256;
let sum = 0, n = 0;
for (let j = 0; j < SAMPLE; j += 1) {
  for (let i = 0; i < SAMPLE; i += 1) {
    const u = (i + 0.5) / SAMPLE;
    const v = (j + 0.5) / SAMPLE;
    const a = bilinear(latest, u, v);
    const b = bilinear(target, u, v);
    for (let c = 0; c < 3; c += 1) {
      const d = (a[c] - b[c]) / 255;
      sum += d * d;
    }
    n += 3;
  }
}
const rms = Math.sqrt(sum / n);
const threshold = parseFloat(values.threshold);
console.error(`hero: ${values.hero}`);
console.error(`latest: ${latestPath}`);
console.error(`target: ${targetPath}`);
console.error(`RMS deviation (256x256 bilinear sample): ${rms.toFixed(4)} (threshold ${threshold})`);

if (rms > threshold) {
  const directive = [
    `Heartbeat ${new Date().toISOString()}: visual deviation gate FAIL for ${values.hero}.`,
    `RMS deviation ${rms.toFixed(4)} > threshold ${threshold}.`,
    `Capture: ${latestPath}`,
    `Target:  ${targetPath}`,
    ``,
    `Spawn three subagents in PARALLEL via Agent tool:`,
    `  1. visual-reviewer    Read both PNGs; return JSON of qualitative-feature diffs (disk texture, photon ring, star structure, galactic dust, color tone).`,
    `  2. aesthetics-reviewer Compare against Ciechanowski/Distill aesthetic; flag rectangular/banding artifacts and saturation issues.`,
    `  3. physics-skeptic    Audit current shader vs spec (photon ring at b_crit, Doppler asymmetry direction, ISCO clamp, opaque-disk first-crossing).`,
    ``,
    `After subagents return, iterate the BH renderer until RMS <= ${threshold}.`,
    `Hard rule from prior conversation: NO 2D FBM on the disk in world (x, z) coords (produces concentric rings under lensing).`,
    `NO FBM in equirectangular star texture (same reason).`,
    `Procedural stars in shader + pure-azimuthal disk noise + smooth Planck color is the known-good baseline.`,
    `Do not ask the user for input.`
  ].join('\n');
  process.stdout.write(directive + '\n');
  process.exit(1);
}
process.exit(0);
