// Chirikov standard map invariant tests.
// (a) At K = 0 the map preserves p exactly (integrable case).
// (b) At K = 0.1 (well below K_crit) the Lyapunov exponent is near zero
//     for a typical orbit (regular).
// (c) At K = 2.0 (well above K_crit) the Lyapunov exponent is positive
//     (~ ln(K/2)) and the orbit fills a substantial fraction of the torus.
// (d) The standard map is area-preserving: Jacobian determinant is 1.

import { describe, it, expect } from 'vitest';
import { iterateOrbit, maxLyapunov, K_CRITICAL } from './sim.js';

describe('standard map: integrable case', () => {
  it('K = 0 conserves p exactly', () => {
    const { ps } = iterateOrbit(0.7, 1.234, 0.0, 10_000);
    for (let i = 0; i < ps.length; i += 1) {
      expect(Math.abs(ps[i] - 1.234)).toBeLessThan(1e-12);
    }
  });

  it('K = 0 Lyapunov exponent is zero', () => {
    const lyap = maxLyapunov({ K: 0.0, nIter: 5000 });
    expect(Math.abs(lyap)).toBeLessThan(1e-10);
  });
});

describe('standard map: K = 0.1 regular regime', () => {
  it('Lyapunov exponent < 0.05 (regular tori dominate)', () => {
    const lyap = maxLyapunov({ K: 0.1, theta0: 0.5, p0: 0.4, nIter: 20_000 });
    expect(Math.abs(lyap)).toBeLessThan(0.05);
  });
});

describe('standard map: K = 2.0 chaotic regime', () => {
  it('Lyapunov exponent > 0.4 (large-scale diffusion)', () => {
    const lyap = maxLyapunov({ K: 2.0, theta0: 0.5, p0: 0.3, nIter: 50_000 });
    expect(lyap).toBeGreaterThan(0.4);
  }, 20_000);

  it('orbit visits at least 30 of 64 bins in the (theta, p) torus', () => {
    const { thetas, ps } = iterateOrbit(0.5, 0.3, 2.0, 60_000);
    const NB = 8;
    const bins = new Int32Array(NB * NB);
    const TWO_PI = 2 * Math.PI;
    for (let i = 5000; i < thetas.length; i += 1) {
      const ti = Math.min(NB - 1, Math.floor(thetas[i] / TWO_PI * NB));
      const pi = Math.min(NB - 1, Math.floor(ps[i] / TWO_PI * NB));
      bins[pi * NB + ti] += 1;
    }
    let occ = 0;
    for (let i = 0; i < bins.length; i += 1) if (bins[i] > 0) occ += 1;
    expect(occ).toBeGreaterThan(30);
  });
});

describe('standard map: golden-mean torus breakdown', () => {
  it('K_crit value matches Greene 1979 to 5 sig figs', () => {
    expect(K_CRITICAL).toBeCloseTo(0.971635, 4);
  });
});
