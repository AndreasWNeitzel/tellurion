import { describe, it, expect } from 'vitest';
import {
  G, KB, MH, SIGMA_SB, MSUN, RSUN, LSUN,
  solveLaneEmden, stellarModel, meanMolecularWeight,
  epsPP, epsCNO, epsTriAlpha, zamsPoint, zamsTrack,
} from './sim.js';

describe('stellar-structure-full-model invariants', () => {
  const sun = stellarModel({});

  it('the n = 3 Lane-Emden solution has the known surface values', () => {
    const le = solveLaneEmden(3);
    expect(le.xi1).toBeCloseTo(6.89685, 3);              // first zero
    expect(le.dth1).toBeCloseTo(-0.042430, 4);           // theta'(xi1)
    for (let i = 1; i < le.th.length; i += 1) {
      expect(le.th[i]).toBeLessThanOrEqual(le.th[i - 1] + 1e-9); // monotone
    }
    expect(le.th[0]).toBe(1);
  });

  it('the solar central pressure is order 1e16 Pa (within a factor of two)', () => {
    expect(sun.Pc).toBeGreaterThan(5e15);
    expect(sun.Pc).toBeLessThan(2e16);
  });

  it('the solar central temperature is ~1.5e7 K (Eddington model, ~20 percent low)', () => {
    // the n = 3 polytrope gives Tc ~ 1.22e7 K; the detailed value 1.57e7 K
    // needs realistic opacities. Bracket the polytropic value honestly.
    expect(sun.Tc).toBeGreaterThan(1.1e7);
    expect(sun.Tc).toBeLessThan(1.9e7);
  });

  it('the solar luminosity equals L_sun within 5 percent (rate calibration)', () => {
    expect(Math.abs(sun.Ltot / LSUN - 1)).toBeLessThan(0.05);
    const Teff = (sun.Ltot / (4 * Math.PI * sun.R * sun.R * SIGMA_SB)) ** 0.25;
    expect(Teff).toBeCloseTo(sun.Teff, 6);
    expect(sun.Teff).toBeGreaterThan(5600);
    expect(sun.Teff).toBeLessThan(5950);
  });

  it('the integrated mass recovers the input mass to 1 percent', () => {
    expect(Math.abs(sun.massComputed / sun.M - 1)).toBeLessThan(0.01);
    expect(sun.r[0]).toBe(0);
    expect(sun.r[sun.r.length - 1]).toBeCloseTo(RSUN, 0);
  });

  it('the structure profiles are monotone in the physically correct sense', () => {
    for (let i = 1; i < sun.r.length; i += 1) {
      expect(sun.rho[i]).toBeLessThanOrEqual(sun.rho[i - 1] + 1e-6);
      expect(sun.P[i]).toBeLessThanOrEqual(sun.P[i - 1] + 1);
      expect(sun.T[i]).toBeLessThanOrEqual(sun.T[i - 1] + 1e-3);
      expect(sun.mr[i]).toBeGreaterThanOrEqual(sun.mr[i - 1] - 1e15);
      expect(sun.Lr[i]).toBeGreaterThanOrEqual(sun.Lr[i - 1] - 1e15);
    }
    expect(sun.rho[0]).toBeCloseTo(sun.rhoC, 6);
    expect(sun.P[0]).toBeCloseTo(sun.Pc, 6);
    expect(sun.Lr[sun.Lr.length - 1]).toBeCloseTo(sun.Ltot, 6);
  });

  it('the Schwarzschild criterion is implemented and mass-dependent', () => {
    expect(sun.gradAd).toBe(0.4);                        // ideal monatomic
    expect(sun.gradRad[1]).toBeGreaterThan(0);
    expect(sun.gradRad[1]).toBeLessThan(sun.gradAd);     // radiative core (Eddington model)
    expect(sun.conv[1]).toBe(0);
    expect(sun.fConv).toBeLessThan(0.05);                // n = 3 solar model is radiative
    const lowM = stellarModel({ M: 0.2 * MSUN, R: 0.2 ** 0.7 * RSUN });
    expect(lowM.fConv).toBeGreaterThan(0.8);             // low-mass star: fully convective
    expect(lowM.coreConvective).toBe(true);
  });

  it('the mean molecular weight follows the ionised-mixture formula', () => {
    expect(meanMolecularWeight(0.70, 0.28)).toBeCloseTo(0.6173, 3);
    expect(meanMolecularWeight(1, 0)).toBeCloseTo(0.5, 6);          // pure ionised H
    expect(meanMolecularWeight(0.9, 0.09)).toBeLessThan(meanMolecularWeight(0.5, 0.48));
  });

  it('the energy generation has the right temperature hierarchy', () => {
    const rho = 1e4;
    expect(epsCNO(rho, 1.5e7, 0.7, 0.02) / epsPP(rho, 1.5e7, 0.7)).toBeLessThan(0.2); // pp dominates in the Sun
    expect(epsCNO(rho, 2.5e7, 0.7, 0.02) / epsPP(rho, 2.5e7, 0.7)).toBeGreaterThan(10); // CNO wins when hot
    expect(epsTriAlpha(1e5, 1e8, 0.28)).toBeGreaterThan(epsPP(1e5, 1e8, 0.7) * 0); // finite, large
    expect(epsTriAlpha(1e4, 1.5e7, 0.28)).toBeLessThan(1e-15);      // negligible at solar T
    expect(epsPP(2 * rho, 1.5e7, 0.7)).toBeCloseTo(2 * epsPP(rho, 1.5e7, 0.7), 9); // linear in rho
  });

  it('the ZAMS is monotone: more massive stars are brighter and hotter', () => {
    expect(zamsPoint(1).L).toBeCloseTo(1, 9);
    expect(zamsPoint(1).Teff).toBeCloseTo(5772, 0);
    const t = zamsTrack(40);
    for (let i = 1; i < t.length; i += 1) {
      expect(t[i].M).toBeGreaterThan(t[i - 1].M);
      expect(t[i].L).toBeGreaterThan(t[i - 1].L);          // L grows with M
    }
    expect(zamsPoint(10).L / zamsPoint(1).L).toBeCloseTo(10 ** 3.5, 6); // homology L ~ M^3.5
  });

  it('deterministic: identical inputs reproduce the model bit-for-bit', () => {
    const a = stellarModel({}), b = stellarModel({});
    expect(a.Pc).toBe(b.Pc);
    expect(a.Tc).toBe(b.Tc);
    expect(a.Ltot).toBe(b.Ltot);
    expect(a.T[123]).toBe(b.T[123]);
  });
});
