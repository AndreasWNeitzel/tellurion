import { describe, it, expect } from 'vitest';
import { accelBH, accelDirect, stepBH } from '../../shared/js/engine/barnes-hut-3d.js';

// Deterministic LCG so the tests are reproducible.
function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function cloud(N, seed, R = 1) {
  const rng = lcg(seed);
  const x = new Float64Array(3 * N), m = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const u = rng(), w = rng(), t = rng();
    const r = R * Math.cbrt(u), th = Math.acos(2 * w - 1), ph = 2 * Math.PI * t;
    x[3 * i] = r * Math.sin(th) * Math.cos(ph);
    x[3 * i + 1] = r * Math.sin(th) * Math.sin(ph);
    x[3 * i + 2] = r * Math.cos(th);
    m[i] = 1 / N;
  }
  return { x, m };
}

describe('barnes-hut-3d: accuracy vs direct summation', () => {
  it('matches O(N^2) within a few percent at theta = 0.5', () => {
    const N = 800;
    const { x, m } = cloud(N, 12345);
    const opt = { G: 1, theta: 0.5, eps: 0.02 };
    const aBH = accelBH(x, m, N, opt);
    const aD = accelDirect(x, m, N, opt);
    let sumRel = 0, maxRel = 0;
    for (let i = 0; i < N; i += 1) {
      const dx = aBH[3 * i] - aD[3 * i];
      const dy = aBH[3 * i + 1] - aD[3 * i + 1];
      const dz = aBH[3 * i + 2] - aD[3 * i + 2];
      const mag = Math.hypot(aD[3 * i], aD[3 * i + 1], aD[3 * i + 2]) + 1e-12;
      const rel = Math.hypot(dx, dy, dz) / mag;
      sumRel += rel; if (rel > maxRel) maxRel = rel;
    }
    const meanRel = sumRel / N;
    expect(meanRel).toBeLessThan(0.02);
    expect(maxRel).toBeLessThan(0.15);
  });

  it('theta = 0 reduces essentially to direct summation', () => {
    const N = 200;
    const { x, m } = cloud(N, 999);
    const opt = { G: 1, theta: 0, eps: 0.05 };
    const aBH = accelBH(x, m, N, opt);
    const aD = accelDirect(x, m, N, opt);
    for (let k = 0; k < 3 * N; k += 1) {
      expect(Math.abs(aBH[k] - aD[k])).toBeLessThan(1e-9);
    }
  });
});

describe('barnes-hut-3d: conservation and determinism', () => {
  // A tree code does NOT conserve momentum to machine precision: the
  // body-cell monopole force is not exactly pairwise antisymmetric. The
  // correct invariants are (a) the drift stays small and bounded, and
  // (b) it vanishes as theta -> 0 (where the method becomes the exact,
  // antisymmetric direct sum). See Hernquist 1987; Springel 2005.
  it('momentum drift is small and bounded for theta > 0', () => {
    const N = 400;
    const { x, m } = cloud(N, 7);
    const v = new Float64Array(3 * N);
    const st = { x, v, m, N, t: 0, nSteps: 0 };
    const opt = { G: 1, theta: 0.6, eps: 0.03 };
    for (let s = 0; s < 200; s += 1) stepBH(st, 0.005, opt);
    let p = 0;
    for (let i = 0; i < N; i += 1) {
      p += Math.abs(m[i] * v[3 * i]) + Math.abs(m[i] * v[3 * i + 1]) + Math.abs(m[i] * v[3 * i + 2]);
    }
    // Net momentum (started at zero) stays a small fraction of the total
    // momentum magnitude that has developed.
    let net = [0, 0, 0];
    for (let i = 0; i < N; i += 1) for (let d = 0; d < 3; d += 1) net[d] += m[i] * v[3 * i + d];
    const netAbs = Math.abs(net[0]) + Math.abs(net[1]) + Math.abs(net[2]);
    expect(netAbs).toBeLessThan(0.01);
    expect(netAbs).toBeLessThan(0.05 * p);
  });

  it('momentum is conserved to roundoff at theta = 0 (exact direct sum)', () => {
    const N = 150;
    const { x, m } = cloud(N, 21);
    const v = new Float64Array(3 * N);
    const st = { x, v, m, N, t: 0, nSteps: 0 };
    const opt = { G: 1, theta: 0, eps: 0.05 };
    for (let s = 0; s < 60; s += 1) stepBH(st, 0.004, opt);
    let net = [0, 0, 0];
    for (let i = 0; i < N; i += 1) for (let d = 0; d < 3; d += 1) net[d] += m[i] * v[3 * i + d];
    const drift = Math.abs(net[0]) + Math.abs(net[1]) + Math.abs(net[2]);
    expect(drift).toBeLessThan(1e-9);
  });

  it('is deterministic (identical inputs reproduce the accel bit-for-bit)', () => {
    const N = 300;
    const { x, m } = cloud(N, 42);
    const a1 = accelBH(x, m, N, { G: 1, theta: 0.6, eps: 0.04 });
    const a2 = accelBH(x, m, N, { G: 1, theta: 0.6, eps: 0.04 });
    for (let k = 0; k < 3 * N; k += 1) expect(a1[k]).toBe(a2[k]);
  });
});

describe('barnes-hut-3d: physical behaviour', () => {
  it('a cold sphere self-gravitates inward (RMS radius shrinks)', () => {
    const N = 600;
    const { x, m } = cloud(N, 3, 1);
    const v = new Float64Array(3 * N);
    const st = { x, v, m, N, t: 0, nSteps: 0 };
    const opt = { G: 1, theta: 0.6, eps: 0.01 };
    const rms = () => {
      let s = 0;
      for (let i = 0; i < N; i += 1) {
        s += x[3 * i] ** 2 + x[3 * i + 1] ** 2 + x[3 * i + 2] ** 2;
      }
      return Math.sqrt(s / N);
    };
    const r0 = rms();
    for (let s = 0; s < 120; s += 1) stepBH(st, 0.01, opt);
    expect(rms()).toBeLessThan(r0);
  });
});
