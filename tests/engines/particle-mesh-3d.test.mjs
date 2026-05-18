// tests/engines/particle-mesh-3d.test.mjs
// Reference-system tests for shared/js/engine/particle-mesh-3d.js.

import { describe, it, expect } from 'vitest';
import { makeRng } from '../../shared/js/render/rng.js';
import {
  solvePoissonIsolated3D, depositCIC3D, stepPM3D,
} from '../../shared/js/engine/particle-mesh-3d.js';

describe('particle-mesh-3d: isolated Poisson gives the free-space monopole', () => {
  it('phi(r) follows -G M / r far from a central point mass', () => {
    const M = 16, L = 8, G = 1, Mtot = 5, eps = 0.03 * L / M;
    const DX = L / M, c = M / 2;
    const rho = new Float64Array(M * M * M);
    rho[(c * M + c) * M + c] = Mtot / (DX * DX * DX);   // one central cell
    const phi = solvePoissonIsolated3D(rho, M, L, G, eps);
    const at = (i) => phi[(c * M + c) * M + (c + i)];
    const r1 = 3, r2 = 6;
    const p1 = at(r1), p2 = at(r2);
    const want = -G * Mtot * (1 / (r2 * DX) - 1 / (r1 * DX));
    expect(Math.abs((p2 - p1) - want) / Math.abs(want)).toBeLessThan(0.15);
    expect(p1).toBeLessThan(0);            // attractive: phi < 0
  });
});

describe('particle-mesh-3d: leapfrog conserves momentum and is deterministic', () => {
  it('|sum m v| drift < 1e-6 over 60 steps and bit-identical reruns', () => {
    function run() {
      const M = 16, L = 8, G = 1, N = 300, eps = 0.05 * L / M;
      const rng = makeRng(0xC0FFEE);
      const x = new Float64Array(3 * N), v = new Float64Array(3 * N), m = new Float64Array(N);
      for (let p = 0; p < N; p += 1) {
        for (let d = 0; d < 3; d += 1) {
          x[3 * p + d] = L / 2 + (rng() - 0.5) * 2;
          v[3 * p + d] = (rng() - 0.5) * 0.1;
        }
        m[p] = 1 / N;
      }
      const st = { x, v, m, N, t: 0, nSteps: 0 };
      const p0 = [0, 0, 0];
      for (let p = 0; p < N; p += 1) for (let d = 0; d < 3; d += 1) p0[d] += m[p] * v[3 * p + d];
      for (let s = 0; s < 60; s += 1) stepPM3D(st, 0.02, { M, L, G, eps });
      const pp = [0, 0, 0];
      for (let p = 0; p < N; p += 1) for (let d = 0; d < 3; d += 1) pp[d] += m[p] * st.v[3 * p + d];
      return { drift: Math.abs(pp[0] - p0[0]) + Math.abs(pp[1] - p0[1]) + Math.abs(pp[2] - p0[2]),
               x: Float64Array.from(st.x) };
    }
    const a = run(), b = run();
    expect(a.drift).toBeLessThan(1e-6);
    let same = true;
    for (let i = 0; i < a.x.length; i += 1) if (a.x[i] !== b.x[i]) same = false;
    expect(same).toBe(true);
  });
});

describe('particle-mesh-3d: a cold sphere self-gravitates inward', () => {
  it('RMS radius shrinks after release from rest', () => {
    const M = 16, L = 10, G = 1, N = 400, eps = 0.05 * L / M;
    const rng = makeRng(0xBEEF);
    const cx = L / 2;
    const x = new Float64Array(3 * N), v = new Float64Array(3 * N), m = new Float64Array(N);
    for (let p = 0; p < N; p += 1) {
      const r = 1.4 * Math.cbrt(rng());
      const u = 2 * rng() - 1, ph = 2 * Math.PI * rng(), s = Math.sqrt(1 - u * u);
      x[3 * p] = cx + r * s * Math.cos(ph);
      x[3 * p + 1] = cx + r * s * Math.sin(ph);
      x[3 * p + 2] = cx + r * u;
      m[p] = 1 / N;
    }
    const rms = (st) => {
      let q = 0;
      for (let p = 0; p < N; p += 1) {
        q += (st.x[3 * p] - cx) ** 2 + (st.x[3 * p + 1] - cx) ** 2 + (st.x[3 * p + 2] - cx) ** 2;
      }
      return Math.sqrt(q / N);
    };
    const st = { x, v, m, N, t: 0, nSteps: 0 };
    const r0 = rms(st);
    for (let s = 0; s < 50; s += 1) stepPM3D(st, 0.02, { M, L, G, eps });
    expect(rms(st)).toBeLessThan(r0);
  });
});

describe('particle-mesh-3d: open deposit drops particles outside the grid', () => {
  it('only the inside particle contributes mass (no wrap)', () => {
    const M = 8, L = 4, N = 2;
    const x = Float64Array.from([L / 2, L / 2, L / 2, -1, -1, -1]);
    const m = Float64Array.from([1, 1]);
    const rho = depositCIC3D(x, m, N, M, L);
    let s = 0;
    for (let i = 0; i < rho.length; i += 1) s += rho[i];
    expect(s).toBeCloseTo(1, 9);
  });
});
