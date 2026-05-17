// Heisenberg uncertainty: a Gaussian saturates sigma_x sigma_p = 1/2,
// every shape obeys >= 1/2, squeezing trades width between conjugate
// spaces at constant product, non-Gaussians strictly exceed the bound,
// the FT is unitary, and the product is shift/boost invariant.

import { describe, it, expect } from 'vitest';
import {
  makeGrid, setShape, momentumDensity, sigmaX, sigmaP, uncertaintyProduct, HBAR_OVER_2,
} from './sim.js';

describe('heisenberg-uncertainty-visualizer invariants', () => {
  it('a Gaussian saturates the bound: sigma_x sigma_p = 1/2', () => {
    for (const sig of [0.6, 1.0, 1.6]) {
      const g = makeGrid(256, 24);
      setShape(g, 'gaussian', sig);
      expect(Math.abs(uncertaintyProduct(g) - 0.5) / 0.5).toBeLessThan(0.02);
      // and the individual widths match the analytic Gaussian values
      expect(sigmaX(g).sigma).toBeCloseTo(sig, 1);
      expect(sigmaP(g).sigma).toBeCloseTo(1 / (2 * sig), 1);
    }
  });

  it('every shape obeys sigma_x sigma_p >= hbar/2', () => {
    for (const shape of ['gaussian', 'box', 'triangle', 'double']) {
      const g = makeGrid(256, 24);
      setShape(g, shape, 1.0);
      expect(uncertaintyProduct(g)).toBeGreaterThan(HBAR_OVER_2 - 1e-3);
    }
  });

  it('non-Gaussian states strictly exceed the minimum', () => {
    const gG = makeGrid(256, 24); setShape(gG, 'gaussian', 1.0);
    const pG = uncertaintyProduct(gG);
    for (const shape of ['triangle', 'double', 'box']) {
      const g = makeGrid(256, 24); setShape(g, shape, 1.0);
      expect(uncertaintyProduct(g)).toBeGreaterThan(pG + 0.02);
    }
    expect(pG).toBeCloseTo(0.5, 1);
  });

  it('squeezing trades width between x and p at constant product', () => {
    let prevX = 0, prevP = Infinity;
    for (const sig of [0.5, 0.8, 1.2, 1.8]) {
      const g = makeGrid(256, 28);
      setShape(g, 'gaussian', sig);
      const sx = sigmaX(g).sigma, sp = sigmaP(g).sigma;
      expect(sx).toBeGreaterThan(prevX);                       // wider in x
      expect(sp).toBeLessThan(prevP);                          // narrower in p
      expect(Math.abs(sx * sp - 0.5) / 0.5).toBeLessThan(0.025); // product held
      prevX = sx; prevP = sp;
    }
  });

  it('the Fourier transform is unitary (norm preserved in both spaces)', () => {
    const g = makeGrid(256, 24);
    setShape(g, 'gaussian', 1.1);
    let nX = 0; for (let i = 0; i < g.N; i += 1) nX += g.re[i] ** 2 + g.im[i] ** 2;
    expect(nX * g.dx).toBeCloseTo(1, 6);
    const pd = momentumDensity(g);
    let nP = 0; for (let m = 0; m < g.N; m += 1) nP += pd[m];
    expect(nP * g.dk).toBeCloseTo(1, 6);
  });

  it('the product is invariant under a position shift and a momentum boost', () => {
    const base = makeGrid(256, 24); setShape(base, 'gaussian', 1.0);
    const p0 = uncertaintyProduct(base), sx0 = sigmaX(base);
    const shifted = makeGrid(256, 24); setShape(shifted, 'gaussian', 1.0, 5, 0);
    expect(uncertaintyProduct(shifted)).toBeCloseTo(p0, 6);
    expect(sigmaX(shifted).mean).toBeCloseTo(5, 0);            // mean moved
    expect(sigmaX(shifted).sigma).toBeCloseTo(sx0.sigma, 6);   // width unchanged
    const boosted = makeGrid(256, 24); setShape(boosted, 'gaussian', 1.0, 0, 3);
    expect(uncertaintyProduct(boosted)).toBeCloseTo(p0, 4);
    expect(sigmaP(boosted).mean).toBeCloseTo(3, 0);            // momentum mean shifted by k0
    expect(sigmaP(boosted).sigma).toBeCloseTo(sigmaP(base).sigma, 4);
  });

  it('a Gaussian scaled by s scales sigma_x by s and sigma_p by 1/s', () => {
    const g1 = makeGrid(256, 28); setShape(g1, 'gaussian', 0.7);
    const g2 = makeGrid(256, 28); setShape(g2, 'gaussian', 1.4);   // s = 2
    expect(sigmaX(g2).sigma / sigmaX(g1).sigma).toBeCloseTo(2, 1);
    expect(sigmaP(g1).sigma / sigmaP(g2).sigma).toBeCloseTo(2, 1);
    expect(uncertaintyProduct(g1)).toBeCloseTo(uncertaintyProduct(g2), 2);
  });
});
