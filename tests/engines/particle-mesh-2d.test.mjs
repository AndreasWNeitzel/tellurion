// tests/engines/particle-mesh-2d.test.mjs
// Reference-system tests for shared/js/engine/particle-mesh-2d.js.

import { describe, it, expect } from 'vitest';
import { makeRng } from '../../shared/js/render/rng.js';
import {
  solvePoisson2D, depositCIC, stepPM,
} from '../../shared/js/engine/particle-mesh-2d.js';

describe('particle-mesh-2d: Poisson solver recovers a single Fourier mode', () => {
  it('phi = -4 pi G rho / k^2 for rho = A cos(k x), to 1e-9', () => {
    const NGRID = 32, L = 4, G = 0.75, A = 1.3, n = 3;
    const k = 2 * Math.PI * n / L;
    const rho = new Float64Array(NGRID * NGRID);
    for (let j = 0; j < NGRID; j += 1) {
      for (let i = 0; i < NGRID; i += 1) {
        rho[j * NGRID + i] = A * Math.cos(2 * Math.PI * n * i / NGRID);
      }
    }
    const phi = solvePoisson2D(rho, NGRID, L, G);
    let maxErr = 0;
    for (let j = 0; j < NGRID; j += 1) {
      for (let i = 0; i < NGRID; i += 1) {
        const want = -4 * Math.PI * G * A * Math.cos(2 * Math.PI * n * i / NGRID) / (k * k);
        maxErr = Math.max(maxErr, Math.abs(phi[j * NGRID + i] - want));
      }
    }
    expect(maxErr).toBeLessThan(1e-9);
  });

  it('zero-mean is enforced (the k=0 mode is removed)', () => {
    const NGRID = 16, L = 2, G = 1;
    const rho = new Float64Array(NGRID * NGRID).fill(2.5);   // pure DC
    const phi = solvePoisson2D(rho, NGRID, L, G);
    let s = 0;
    for (let i = 0; i < phi.length; i += 1) s += phi[i];
    expect(Math.abs(s)).toBeLessThan(1e-9);
  });
});

describe('particle-mesh-2d: CIC deposit conserves mass (zero-mean grid)', () => {
  it('the deposited rho sums to zero (DC subtracted) and is finite', () => {
    const NGRID = 16, L = 3, N = 200;
    const rng = makeRng(0xC0FFEE);
    const x = new Float64Array(2 * N), m = new Float64Array(N);
    for (let p = 0; p < N; p += 1) {
      x[2 * p] = rng() * L; x[2 * p + 1] = rng() * L; m[p] = 1 / N;
    }
    const rho = depositCIC(x, m, N, NGRID, L);
    let s = 0; let finite = true;
    for (let i = 0; i < rho.length; i += 1) { s += rho[i]; if (!Number.isFinite(rho[i])) finite = false; }
    expect(finite).toBe(true);
    expect(Math.abs(s)).toBeLessThan(1e-9);
  });
});

describe('particle-mesh-2d: leapfrog conserves total momentum', () => {
  it('|sum m v| drift stays below 1e-6 over 200 steps', () => {
    const NGRID = 32, L = 6, G = 1, N = 400;
    const rng = makeRng(0x1234);
    const x = new Float64Array(2 * N), v = new Float64Array(2 * N), m = new Float64Array(N);
    for (let p = 0; p < N; p += 1) {
      x[2 * p] = L / 2 + (rng() - 0.5) * 1.5;
      x[2 * p + 1] = L / 2 + (rng() - 0.5) * 1.5;
      v[2 * p] = (rng() - 0.5) * 0.2;
      v[2 * p + 1] = (rng() - 0.5) * 0.2;
      m[p] = 1 / N;
    }
    const st = { x, v, m, N, t: 0, nSteps: 0 };
    const p0 = [0, 0];
    for (let p = 0; p < N; p += 1) { p0[0] += m[p] * v[2 * p]; p0[1] += m[p] * v[2 * p + 1]; }
    for (let s = 0; s < 200; s += 1) stepPM(st, 0.02, { NGRID, L, G });
    let px = 0, py = 0;
    for (let p = 0; p < N; p += 1) { px += m[p] * st.v[2 * p]; py += m[p] * st.v[2 * p + 1]; }
    expect(Math.abs(px - p0[0]) + Math.abs(py - p0[1])).toBeLessThan(1e-6);
  });
});

describe('particle-mesh-2d: a cold blob self-gravitates inward', () => {
  it('RMS radius shrinks after release from rest', () => {
    const NGRID = 32, L = 8, G = 1, N = 500;
    const rng = makeRng(0xBEEF);
    const cx = L / 2, cy = L / 2;
    const x = new Float64Array(2 * N), v = new Float64Array(2 * N), m = new Float64Array(N);
    for (let p = 0; p < N; p += 1) {
      const r = 1.2 * Math.sqrt(rng()), th = 2 * Math.PI * rng();
      x[2 * p] = cx + r * Math.cos(th);
      x[2 * p + 1] = cy + r * Math.sin(th);
      m[p] = 1 / N;                               // cold: v = 0
    }
    const rms = (st) => {
      let s = 0;
      for (let p = 0; p < N; p += 1) {
        const dx = st.x[2 * p] - cx, dy = st.x[2 * p + 1] - cy;
        s += dx * dx + dy * dy;
      }
      return Math.sqrt(s / N);
    };
    const st = { x, v, m, N, t: 0, nSteps: 0 };
    const r0 = rms(st);
    for (let s = 0; s < 60; s += 1) stepPM(st, 0.02, { NGRID, L, G });
    expect(rms(st)).toBeLessThan(r0);            // gravity pulled it in
  });
});

describe('particle-mesh-2d: determinism', () => {
  it('identical inputs reproduce the state bit-for-bit', () => {
    function run() {
      const NGRID = 16, L = 5, G = 1, N = 120;
      const rng = makeRng(0xC0FFEE);
      const x = new Float64Array(2 * N), v = new Float64Array(2 * N), m = new Float64Array(N);
      for (let p = 0; p < N; p += 1) {
        x[2 * p] = rng() * L; x[2 * p + 1] = rng() * L;
        v[2 * p] = (rng() - 0.5) * 0.1; v[2 * p + 1] = (rng() - 0.5) * 0.1;
        m[p] = 1 / N;
      }
      const st = { x, v, m, N, t: 0, nSteps: 0 };
      for (let s = 0; s < 50; s += 1) stepPM(st, 0.02, { NGRID, L, G });
      return Float64Array.from(st.x);
    }
    const a = run(), b = run();
    let same = true;
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) same = false;
    expect(same).toBe(true);
  });
});
