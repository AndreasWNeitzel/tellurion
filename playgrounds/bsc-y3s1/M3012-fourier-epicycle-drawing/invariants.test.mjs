// Fourier epicycle drawing: invariant tests.
// Imports the DOM-free core (sim.js, shared with playground.js). Each
// test asserts an exact property of the discrete Fourier transform of a
// closed planar path, at the thresholds in spec.md. No mocks: the same
// dft/reconstruct the renderer uses is exercised here.

import { test, expect } from 'vitest';
import { samplePath, dft, reconstruct, rmsError } from './sim.js';

const N = 256;

test('pure circle has a single Fourier mode at k = +1, amplitude 1', () => {
  // z_j = exp(2 pi i j / N)  =>  C_k = delta_{k,1}. This is the
  // textbook one-circle reconstruction: a single epicycle of unit
  // radius spinning once per period draws a circle exactly.
  const coeffs = dft(samplePath('circle', N));
  expect(coeffs[0].k).toBe(1);
  expect(Math.abs(coeffs[0].amp - 1)).toBeLessThan(1e-9);
  expect(Math.abs(coeffs[0].re - 1)).toBeLessThan(1e-9);
  expect(Math.abs(coeffs[0].im)).toBeLessThan(1e-9);
  // Every other mode is numerically zero.
  expect(coeffs[1].amp).toBeLessThan(1e-9);
});

test('reconstruction with one term reproduces the circle exactly', () => {
  // The epicycle tip after M=1 arm equals C_1 exp(2 pi i t); for the
  // circle that is (cos 2 pi t, sin 2 pi t) with no truncation error.
  const path = samplePath('circle', N);
  const coeffs = dft(path);
  for (const t of [0, 0.123, 0.5, 0.777, 0.999]) {
    const z = reconstruct(coeffs, 1, t);
    expect(Math.abs(z.x - Math.cos(2 * Math.PI * t))).toBeLessThan(1e-9);
    expect(Math.abs(z.y - Math.sin(2 * Math.PI * t))).toBeLessThan(1e-9);
  }
});

test('DC coefficient equals the path centroid', () => {
  // C_0 = (1/N) sum z_j is the mean position: the centre of the
  // epicycle chain sits at the centroid of the drawn shape.
  const path = samplePath('earth', N);
  const coeffs = dft(path);
  const c0 = coeffs.find((c) => c.k === 0);
  expect(c0).toBeDefined();
  let mx = 0, my = 0;
  for (const p of path) { mx += p.x; my += p.y; }
  mx /= path.length; my /= path.length;
  expect(Math.abs(c0.re - mx)).toBeLessThan(1e-12);
  expect(Math.abs(c0.im - my)).toBeLessThan(1e-12);
});

test('Parseval: sum |C_k|^2 = (1/N) sum |z_j|^2', () => {
  // Energy is conserved between the path samples and the Fourier
  // coefficients (orthonormality of the DFT basis). Independent of
  // coefficient ordering, so it also guards the amplitude sort.
  const path = samplePath('star-5', N);
  const coeffs = dft(path);
  let lhs = 0;
  for (const c of coeffs) lhs += c.amp * c.amp;
  let rhs = 0;
  for (const p of path) rhs += p.x * p.x + p.y * p.y;
  rhs /= path.length;
  expect(Math.abs(lhs - rhs) / Math.max(rhs, 1e-12)).toBeLessThan(1e-9);
});

test('full N-term reconstruction interpolates every sample exactly', () => {
  // With all N coefficients the inverse DFT recovers z_j at the sample
  // nodes t = j/N to floating-point precision (the epicycle tip passes
  // through every traced point).
  for (const name of ['heart', 'figure-eight', 'letter-A']) {
    const path = samplePath(name, N);
    const coeffs = dft(path);
    expect(rmsError(coeffs, N, path)).toBeLessThan(1e-8);
  }
});

test('truncation error is non-increasing in the number of epicycles', () => {
  // Adding epicycles (Fourier terms) never worsens the fit, and a
  // smooth shape strictly improves with more terms. This is the
  // qualitative behaviour the M slider demonstrates.
  const path = samplePath('earth', N);
  const coeffs = dft(path);
  const Ms = [1, 2, 4, 8, 16, 32, 64, 128, 256];
  const errs = Ms.map((M) => rmsError(coeffs, M, path));
  for (let i = 1; i < errs.length; i += 1) {
    expect(errs[i]).toBeLessThanOrEqual(errs[i - 1] + 1e-12);
  }
  expect(errs[errs.length - 1]).toBeLessThan(errs[0]);
});

test('coefficients are amplitude-sorted descending and dft is deterministic', () => {
  // The renderer walks the chain largest-circle-first; the sort
  // contract must hold. The transform has no RNG, so repeated calls
  // are bit-identical.
  const path = samplePath('heart', N);
  const a = dft(path);
  const b = dft(path);
  expect(a.length).toBe(N);
  for (let i = 1; i < a.length; i += 1) {
    expect(a[i].amp).toBeLessThanOrEqual(a[i - 1].amp + 1e-15);
  }
  expect(b).toEqual(a);
});
