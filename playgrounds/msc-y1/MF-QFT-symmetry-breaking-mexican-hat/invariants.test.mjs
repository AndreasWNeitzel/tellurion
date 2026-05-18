import { describe, it, expect } from 'vitest';
import {
  V, vev, depth, radialCurvature, higgsMass, GOLDSTONE_MASS,
  Vfinite, Tc, vevT, Vxy, radialProfile,
} from './sim.js';

describe('symmetry-breaking-mexican-hat invariants', () => {
  it('the vacuum sits at v = sqrt(mu^2 / 2 lambda) (0.1%) and is a stable minimum', () => {
    for (const [mu2, lam] of [[2, 0.5], [1, 1], [4, 0.25]]) {
      const v = vev(mu2, lam);
      expect(v).toBeCloseTo(Math.sqrt(mu2 / (2 * lam)), 9);
      const dV = (V(v + 1e-6, mu2, lam) - V(v - 1e-6, mu2, lam)) / 2e-6;
      expect(Math.abs(dV)).toBeLessThan(1e-3);                       // dV/drho = 0
      expect(radialCurvature(v, mu2, lam)).toBeGreaterThan(0);       // stable
      expect(radialCurvature(0, mu2, lam)).toBeLessThan(0);          // rho=0 unstable max
    }
  });

  it('the Higgs mass is sqrt(2) mu and the Goldstone mode is massless', () => {
    for (const mu2 of [1, 2, 5]) {
      expect(higgsMass(mu2)).toBeCloseTo(Math.sqrt(2 * mu2), 12);    // m_H = sqrt(2 mu^2)
      expect(higgsMass(mu2) ** 2).toBeCloseTo(2 * mu2, 9);
    }
    expect(GOLDSTONE_MASS).toBe(0);
    // the angular direction is flat at the brim: V independent of theta
    const mu2 = 2, lam = 0.5, v = vev(mu2, lam);
    for (const th of [0.3, 1.1, 2.7, 5.0]) {
      expect(Vxy(v * Math.cos(th), v * Math.sin(th), mu2, lam))
        .toBeCloseTo(depth(mu2, lam), 9);                            // same depth all around
    }
  });

  it('the broken vacuum is lower than the symmetric point: V(v) = -mu^4/4 lambda < V(0)', () => {
    for (const [mu2, lam] of [[2, 0.5], [3, 1.5]]) {
      expect(depth(mu2, lam)).toBeCloseTo(-mu2 * mu2 / (4 * lam), 9);
      expect(depth(mu2, lam)).toBeLessThan(0);
      expect(V(0, mu2, lam)).toBe(0);
      expect(depth(mu2, lam)).toBeLessThan(V(0, mu2, lam));
    }
  });

  it('temperature restores the symmetry at T_c = sqrt(mu^2/c) (second order)', () => {
    const mu2 = 2, lam = 0.5, c = 1;
    const tc = Tc(mu2, c);
    expect(tc).toBeCloseTo(Math.sqrt(mu2 / c), 12);
    expect(vevT(mu2, lam, 0, c)).toBeCloseTo(vev(mu2, lam), 9);      // T=0: full vev
    let prev = vevT(mu2, lam, 0, c);
    for (let T = 0.1; T < tc; T += 0.1) {
      const vt = vevT(mu2, lam, T, c);
      expect(vt).toBeLessThanOrEqual(prev + 1e-9);                   // monotone decreasing
      prev = vt;
    }
    expect(vevT(mu2, lam, tc, c)).toBeCloseTo(0, 9);                 // symmetric at Tc
    expect(vevT(mu2, lam, 2 * tc, c)).toBe(0);                       // restored above
    // second-order critical scaling v ~ sqrt(Tc - T): halving the
    // distance to Tc scales the order parameter by 1/sqrt(2)
    const r = vevT(mu2, lam, tc - 5e-4, c) / vevT(mu2, lam, tc - 1e-3, c);
    expect(r).toBeCloseTo(1 / Math.SQRT2, 2);
  });

  it('the finite-T potential is a wine bottle below Tc and a single bowl above', () => {
    const mu2 = 2, lam = 0.5;
    const below = radialProfile(2.5, 200, mu2, lam, 0.5);
    let argmin = 0; for (let i = 1; i < below.v.length; i += 1) if (below.v[i] < below.v[argmin]) argmin = i;
    expect(below.r[argmin]).toBeGreaterThan(0.2);                    // minimum off-centre (broken)
    const above = radialProfile(2.5, 200, mu2, lam, Tc(mu2) * 1.5);
    let argmin2 = 0; for (let i = 1; i < above.v.length; i += 1) if (above.v[i] < above.v[argmin2]) argmin2 = i;
    expect(above.r[argmin2]).toBeCloseTo(0, 2);                      // minimum at the centre (symmetric)
  });

  it('the potential is axially symmetric (depends only on |phi|)', () => {
    const mu2 = 3, lam = 0.8, rho = 1.1;
    const ref = Vxy(rho, 0, mu2, lam);
    for (const th of [0.5, 1.7, 3.3, 4.9]) {
      expect(Vxy(rho * Math.cos(th), rho * Math.sin(th), mu2, lam)).toBeCloseTo(ref, 9);
    }
  });

  it('scaling: m_H proportional to mu, v ~ 1/sqrt(lambda), depth ~ mu^4/lambda', () => {
    expect(higgsMass(8) / higgsMass(2)).toBeCloseTo(2, 9);           // m_H ~ sqrt(mu^2)
    expect(vev(2, 0.25) / vev(2, 1)).toBeCloseTo(2, 9);              // v ~ 1/sqrt(lambda)
    expect(depth(4, 1) / depth(2, 1)).toBeCloseTo(4, 9);             // depth ~ mu^4
  });

  it('deterministic: identical inputs reproduce the vev and profile', () => {
    expect(vev(2, 0.5)).toBe(vev(2, 0.5));
    expect(vevT(2, 0.5, 0.7)).toBe(vevT(2, 0.5, 0.7));
    const a = radialProfile(2, 100, 2, 0.5, 0.3), b = radialProfile(2, 100, 2, 0.5, 0.3);
    for (let i = 0; i <= 100; i += 1) expect(a.v[i]).toBe(b.v[i]);
  });
});
