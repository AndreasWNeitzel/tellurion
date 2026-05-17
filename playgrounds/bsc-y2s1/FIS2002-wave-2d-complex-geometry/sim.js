// Scenario layer for the 2D wave playground. The numerics live in the
// shared engine shared/js/engine/wave-2d-cpu.js (leapfrog 2D wave
// equation with rigid barriers and an absorbing sponge); this module
// only assembles the named scenes (free point source, single slit,
// double slit, obstacle) and exposes the scene-level diagnostics the
// playground and its invariants use. Reference: Crawford, Waves
// (Berkeley Physics Course Vol. 3), Ch. 7 (Huygens, diffraction);
// Hecht, Optics (5th ed.), Ch. 10.

import {
  makeGrid, makeBarrier, addWallWithSlits, makeSponge,
  stepBarriered, addSourceRing, totalEnergy,
} from '../../../shared/js/engine/wave-2d-cpu.js';

export const PRESETS = ['free', 'single-slit', 'double-slit', 'obstacle'];

// 2D wave CFL: dt < dx / (c sqrt 2). Safety 0.9.
export function cflDt(c, dx = 1, safety = 0.9) { return safety * dx / (c * Math.SQRT2); }

// Assemble a scene. lambda sets the monochromatic source wavelength;
// slitSep / slitHalf are in grid cells.
export function buildScene(N, preset, opts = {}) {
  const { lambda = 18, slitSep = 46, slitHalf = 4, c = 1 } = opts;
  const state = makeGrid(N);
  const barrier = makeBarrier(N);
  const sponge = makeSponge(N, Math.round(N * 0.11), 0.9);
  const cyMid = Math.round((N - 1) / 2);
  const xWall = Math.round(N * 0.34);
  const srcX = Math.round(N * 0.13);
  if (preset === 'single-slit') {
    addWallWithSlits(barrier, N, xWall, [[cyMid, slitHalf]], 3);
  } else if (preset === 'double-slit') {
    addWallWithSlits(barrier, N, xWall, [[cyMid - slitSep / 2, slitHalf], [cyMid + slitSep / 2, slitHalf]], 3);
  } else if (preset === 'obstacle') {
    for (let y = cyMid - 26; y <= cyMid + 26; y += 1)
      for (let x = xWall; x < xWall + 14; x += 1) barrier[y * N + x] = 1;
  }
  const k = 2 * Math.PI / lambda, omega = c * k;
  return {
    state, barrier, sponge, N, cyMid, srcX, xWall, omega,
    drive(phase, A = 0.7) { addSourceRing(state, srcX, cyMid, A, phase); },
  };
}

export function stepScene(scene, c, gamma, dt) {
  stepBarriered(scene.state, c, gamma, dt, scene.barrier, scene.sponge);
}

export function energy(scene, c) { return totalEnergy(scene.state, c, 1); }

// Angular coefficient of variation of |u| sampled on a ring of radius R
// about the source. Small => isotropic (circular) wavefront.
export function ringAnisotropy(scene, R, nAng = 72) {
  const { state, N, srcX, cyMid } = scene, u = state.u;
  const vals = [];
  for (let a = 0; a < nAng; a += 1) {
    const th = (2 * Math.PI * a) / nAng;
    const x = Math.round(srcX + R * Math.cos(th)), y = Math.round(cyMid + R * Math.sin(th));
    if (x < 1 || y < 1 || x >= N - 1 || y >= N - 1) continue;
    vals.push(Math.abs(u[y * N + x]));
  }
  const m = vals.reduce((p, q) => p + q, 0) / vals.length;
  if (m < 1e-9) return 1;
  let v = 0; for (const z of vals) v += (z - m) ** 2;
  return Math.sqrt(v / vals.length) / m;
}

// Angular CoV of the time-peak |u| on a ring of radius R about the
// source, driven monochromatically. Small => the radiated amplitude is
// angle-independent (a circular wavefront). This envelope measure is
// the physically correct isotropy test (a single snapshot is phase-
// sensitive near the source).
export function ringAnisotropyEnvelope(scene, R, c, dt, opts = {}) {
  const { steps = 360, sampleAfter = 220, nAng = 72 } = opts;
  const { state, N, srcX, cyMid } = scene;
  const peak = new Float64Array(nAng);
  let phase = 0;
  for (let n = 0; n < steps; n += 1) {
    scene.drive(phase); phase += scene.omega * dt;
    stepScene(scene, c, 0, dt);
    if (n < sampleAfter) continue;
    for (let a = 0; a < nAng; a += 1) {
      const th = (2 * Math.PI * a) / nAng;
      const x = Math.round(srcX + R * Math.cos(th)), y = Math.round(cyMid + R * Math.sin(th));
      if (x < 1 || y < 1 || x >= N - 1 || y >= N - 1) continue;
      peak[a] = Math.max(peak[a], Math.abs(state.u[y * N + x]));
    }
  }
  const m = peak.reduce((p, q) => p + q, 0) / nAng;
  if (m < 1e-9) return 1;
  let v = 0; for (const z of peak) v += (z - m) ** 2;
  return Math.sqrt(v / nAng) / m;
}

// Peak |u| envelope along a vertical screen column over a late window.
export function screenAmplitude(scene, c, gamma, dt, opts = {}) {
  const { steps = 1500, sampleAfter = 1000, xScreen = Math.round(scene.N * 0.86) } = opts;
  const { state, N } = scene;
  let phase = 0; const amp = new Float64Array(N);
  for (let n = 0; n < steps; n += 1) {
    scene.drive(phase); phase += scene.omega * dt;
    stepBarriered(state, c, gamma, dt, scene.barrier, scene.sponge);
    if (n >= sampleAfter) for (let y = 0; y < N; y += 1) amp[y] = Math.max(amp[y], Math.abs(state.u[y * N + xScreen]));
  }
  return amp;
}

// Energy in the region behind the wall/obstacle (downstream half).
export function farEnergy(scene, xFrom) {
  const { state, N } = scene, u = state.u; let e = 0;
  for (let y = 1; y < N - 1; y += 1) for (let x = xFrom; x < N - 1; x += 1) e += u[y * N + x] ** 2;
  return e;
}
