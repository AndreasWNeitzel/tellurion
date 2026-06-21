// p- and g-mode cavity invariant tests. The structure functions and the Cowling
// cavity classification are exercised headlessly against the real n=3 polytrope.

import { describe, it, expect } from 'vitest';
import {
  bruntN, lambS, krSquared, cavities, modeType, turningPoints,
  eigenfunction, energySplit, N_SURFACE_CAP,
} from './sim.js';

describe('Structure functions of the polytrope', () => {
  it('Brunt-Vaisala frequency is positive in the interior and capped', () => {
    for (let x = 0.05; x < 0.99; x += 0.05) {
      expect(bruntN(x)).toBeGreaterThan(0);
      expect(bruntN(x)).toBeLessThanOrEqual(N_SURFACE_CAP + 1e-9);
    }
  });
  it('Lamb frequency decreases outward and vanishes for l=0', () => {
    expect(lambS(0.1, 1)).toBeGreaterThan(lambS(0.9, 1));
    expect(lambS(0.5, 0)).toBe(0);
  });
});

describe('Cowling dispersion and cavities', () => {
  it('k_r^2 > 0 exactly inside a classified cavity, < 0 in the gap', () => {
    const omega = 2.4, l = 1;
    const { pCavities, gCavities } = cavities(omega, l);
    const inSeg = (x, segs) => segs.some(([a, b]) => x > a + 0.01 && x < b - 0.01);
    for (let x = 0.02; x < 0.98; x += 0.01) {
      const k2 = krSquared(x, omega, l);
      if (inSeg(x, pCavities) || inSeg(x, gCavities)) expect(k2).toBeGreaterThan(0);
    }
    // a point in the evanescent gap between the two cavities.
    expect(krSquared(0.43, omega, l)).toBeLessThan(0);
  });
  it('low frequency is a pure g-mode (core), no p-cavity', () => {
    const c = cavities(1.0, 1);
    expect(c.gCavities.length).toBeGreaterThan(0);
    expect(c.pCavities.length).toBe(0);
    expect(modeType(1.0, 1)).toBe('g');
    // the g-cavity is in the inner star.
    expect(c.gCavities[0][0]).toBeLessThan(0.3);
  });
  it('high frequency is a pure p-mode (envelope), no g-cavity', () => {
    const c = cavities(4.0, 1);
    expect(c.pCavities.length).toBeGreaterThan(0);
    expect(c.gCavities.length).toBe(0);
    expect(modeType(4.0, 1)).toBe('p');
    // the p-cavity reaches the outer envelope.
    expect(c.pCavities[c.pCavities.length - 1][1]).toBeGreaterThan(0.8);
  });
  it('intermediate frequency is a mixed mode with both cavities', () => {
    const c = cavities(2.4, 1);
    expect(c.pCavities.length).toBeGreaterThan(0);
    expect(c.gCavities.length).toBeGreaterThan(0);
    expect(modeType(2.4, 1)).toBe('mixed');
    // the g-cavity sits inside the p-cavity (core vs envelope).
    expect(c.gCavities[0][1]).toBeLessThan(c.pCavities[0][0]);
  });
  it('raising l pushes the p-cavity outward (S_l rises)', () => {
    const inner1 = cavities(2.4, 1).pCavities[0][0];
    const inner2 = cavities(2.4, 2).pCavities[0][0];
    expect(inner2).toBeGreaterThan(inner1);
  });
});

describe('Eigenfunction and energy', () => {
  it('is normalised to unit peak', () => {
    const { xi } = eigenfunction(2.4, 1);
    let peak = 0; for (const v of xi) peak = Math.max(peak, Math.abs(v));
    expect(peak).toBeCloseTo(1, 6);
  });
  it('puts its energy in the core for a g-mode and the envelope for a p-mode', () => {
    const g = energySplit(1.0, 1);
    expect(g.g).toBeGreaterThan(g.p);
    const p = energySplit(4.0, 1);
    expect(p.p).toBeGreaterThan(p.g);
  });
  it('turning points lie strictly inside the star', () => {
    for (const tp of turningPoints(2.4, 1)) {
      expect(tp).toBeGreaterThan(0);
      expect(tp).toBeLessThan(1);
    }
  });
});
