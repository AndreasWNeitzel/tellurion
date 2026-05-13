// Rotation Curve Explorer invariant tests at seed 0xC0FFEE.

import { describe, it, expect } from 'vitest';
import {
  vBulge2, vDisk2, vHalo2, vTotal,
  syntheticData, chiSquared,
  TRUE_PARAMS, DATA_RADII,
} from './sim.js';

describe('rotation-curve-explorer: strong invariants', () => {
  it('reduced chi^2 at true parameters is below 2.0', () => {
    const data = syntheticData(0xC0FFEE);
    const chi2 = chiSquared(TRUE_PARAMS, data);
    const dof = data.length - 4;
    expect(chi2 / dof).toBeLessThan(2.0);
  });

  it('synthetic data deterministic at seed 0xC0FFEE', () => {
    const a = syntheticData(0xC0FFEE);
    const b = syntheticData(0xC0FFEE);
    for (let i = 0; i < a.length; i += 1) {
      expect(a[i].R).toBe(b[i].R);
      expect(a[i].v).toBe(b[i].v);
    }
  });

  it('asymptotic flatness: at true params v varies < 30 km/s over R in [10, 50]', () => {
    let minV = Infinity, maxV = -Infinity;
    const p = TRUE_PARAMS;
    for (let R = 10; R <= 50; R += 1) {
      const v = vTotal(R, p);
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    expect(maxV - minV).toBeLessThan(30);
  });
});

describe('rotation-curve-explorer: limiting cases', () => {
  it('bulge-only: at R = a_b the peak rotation matches sqrt(G M_b / (4 a_b))', () => {
    const Mb = TRUE_PARAMS.Mb, ab = TRUE_PARAMS.ab;
    // v_b^2 = G M_b R / (R + a_b)^2 peaks at R = a_b giving v_b^2 = G M_b / (4 a_b).
    const v2_peak = vBulge2(ab, Mb, ab);
    const expected = 43020 * Mb / (4 * ab);
    expect(Math.abs(v2_peak - expected) / expected).toBeLessThan(1e-12);
  });

  it('disk-only: Keplerian fall at large R', () => {
    // v_d^2 -> G M_d / R as R -> infinity. So v_d^2 * R -> G M_d.
    const Md = TRUE_PARAMS.Md, ad = TRUE_PARAMS.ad, bd = TRUE_PARAMS.bd;
    const R = 200;
    const product = vDisk2(R, Md, ad, bd) * R;
    const expected = 43020 * Md;
    expect(Math.abs(product - expected) / expected).toBeLessThan(0.05);
  });

  it('halo-only: NFW gives finite v at large R (vs Keplerian Mb=Md=0)', () => {
    const v50 = Math.sqrt(vHalo2(50, TRUE_PARAMS.M200, TRUE_PARAMS.c));
    expect(v50).toBeGreaterThan(150);
    expect(v50).toBeLessThan(300);
  });

  it('worst-fit M200 sweep: chi^2 at M200 = 0.3 and 5.0 is much larger than at truth', () => {
    const data = syntheticData(0xC0FFEE);
    const chi2_true = chiSquared(TRUE_PARAMS, data);
    const chi2_low  = chiSquared({ ...TRUE_PARAMS, M200: 0.3 }, data);
    const chi2_high = chiSquared({ ...TRUE_PARAMS, M200: 5.0 }, data);
    expect(chi2_low).toBeGreaterThan(50 * chi2_true);
    expect(chi2_high).toBeGreaterThan(50 * chi2_true);
  });
});

describe('rotation-curve-explorer: data structure', () => {
  it('synthetic data has 18 points spanning roughly [1, 50] kpc', () => {
    const data = syntheticData(0xC0FFEE);
    expect(data.length).toBe(18);
    expect(data[0].R).toBeCloseTo(1, 6);
    expect(data[data.length - 1].R).toBeCloseTo(50, 6);
    expect(DATA_RADII.length).toBe(18);
  });
});
