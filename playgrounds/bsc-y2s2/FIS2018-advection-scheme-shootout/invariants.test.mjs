// Advection scheme invariant tests.
// (a) Upwind is TVD: total variation never grows.
// (b) FTCS blows up: TV grows arbitrarily large.
// (c) Lax-Wendroff has bounded TV on smooth data.
// (d) Upwind preserves mass.
// (e) Exact solution wraps periodically.

import { describe, it, expect } from 'vitest';
import {
  initSquare, initGaussian, exactSolution,
  stepFTCS, stepUpwind, stepLaxWendroff, stepMacCormack,
  totalVariation, l2Error, NX, DX,
} from './sim.js';

describe('Advection: upwind is TVD', () => {
  it('total variation never grows over 100 steps', () => {
    const u = initSquare();
    let tvPrev = totalVariation(u);
    for (let i = 0; i < 100; i += 1) {
      stepUpwind(u, 1.0, 0.8 * DX / 1.0);
      const tv = totalVariation(u);
      expect(tv).toBeLessThanOrEqual(tvPrev + 1e-10);
      tvPrev = tv;
    }
  });
});

describe('Advection: FTCS is unstable', () => {
  it('TV grows by > 5x over 200 steps', () => {
    const u = initSquare();
    const tv0 = totalVariation(u);
    for (let i = 0; i < 200; i += 1) stepFTCS(u, 1.0, 0.5 * DX / 1.0);
    const tvFinal = totalVariation(u);
    expect(tvFinal).toBeGreaterThan(tv0 * 5);
  });
});

describe('Advection: Lax-Wendroff bounded TV on smooth data', () => {
  it('on Gaussian: TV grows by < 5 percent over 200 steps', () => {
    const u = initGaussian();
    const tv0 = totalVariation(u);
    for (let i = 0; i < 200; i += 1) stepLaxWendroff(u, 1.0, 0.8 * DX / 1.0);
    const tvFinal = totalVariation(u);
    expect(tvFinal).toBeLessThan(tv0 * 1.05);
  });
});

describe('Advection: mass conservation', () => {
  it('upwind conserves integral u over 200 steps', () => {
    const u = initSquare();
    let m0 = 0;
    for (let i = 0; i < NX; i += 1) m0 += u[i] * DX;
    for (let i = 0; i < 200; i += 1) stepUpwind(u, 1.0, 0.8 * DX / 1.0);
    let mF = 0;
    for (let i = 0; i < NX; i += 1) mF += u[i] * DX;
    expect(Math.abs(mF - m0)).toBeLessThan(1e-10);
  });
});

describe('Advection: exact solution wraps periodically', () => {
  it('exactSolution(u0, c, period) gives back u0 (up to index discretization)', () => {
    const u0 = initGaussian();
    const period = 1.0;
    const c = 1.0;
    const u = exactSolution(u0, c, period);
    let maxDiff = 0;
    for (let i = 0; i < NX; i += 1) { const d = Math.abs(u[i] - u0[i]); if (d > maxDiff) maxDiff = d; }
    expect(maxDiff).toBeLessThan(0.01);
  });
});
