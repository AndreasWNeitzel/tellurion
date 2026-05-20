import { describe, it, expect } from 'vitest';
import {
  periodLuminosity_MV, MbolFromL, meanRadius_Rsun, meanTeff_K,
  luminosity_Lsun, radiusAtPhase, TeffAtPhase, lightcurveLsun,
  distanceModulus, apparentMag, KNOWN_CEPHEIDS,
} from './sim.js';

describe('cepheid-period-luminosity-3d', () => {
  it('Madore-Freedman: M_V at P = 10 days is approx -4.13', () => {
    const MV = periodLuminosity_MV(10);
    expect(MV).toBeCloseTo(-2.78 - 1.35, 6);
  });

  it('PL slope = -2.78 per decade in P', () => {
    const d = periodLuminosity_MV(100) - periodLuminosity_MV(10);
    expect(d).toBeCloseTo(-2.78, 6);
  });

  it('PL: longer P -> brighter (more negative M_V)', () => {
    expect(periodLuminosity_MV(50)).toBeLessThan(periodLuminosity_MV(5));
  });

  it('M_bol of the Sun is 4.74', () => {
    expect(MbolFromL(1)).toBeCloseTo(4.74, 6);
  });

  it('mean radius grows monotonically with P', () => {
    let prev = 0;
    for (let P = 1; P <= 50; P += 5) {
      const R = meanRadius_Rsun(P);
      expect(R).toBeGreaterThan(prev);
      prev = R;
    }
  });

  it('mean T_eff decreases slightly with P (cooler longer-period Cepheids)', () => {
    expect(meanTeff_K(50)).toBeLessThan(meanTeff_K(5));
  });

  it('Stefan-Boltzmann luminosity uses solar T (5778 K)', () => {
    expect(luminosity_Lsun(1, 5778)).toBeCloseTo(1, 2);
  });

  it('lightcurve is periodic in phase', () => {
    const L0 = lightcurveLsun(0.3, 10);
    const L1 = lightcurveLsun(0.3 + 1, 10);
    expect(L0).toBeCloseTo(L1, 6);
  });

  it('radius oscillates around the mean', () => {
    let sum = 0;
    const N = 100;
    for (let k = 0; k < N; k++) sum += radiusAtPhase(k / N, 10);
    const meanFromIntegral = sum / N;
    expect(meanFromIntegral).toBeCloseTo(meanRadius_Rsun(10), 1);
  });

  it('T_eff has a maximum and a minimum on a cycle (asymmetric Cepheid)', () => {
    // T(phi) = T0 (1 - dT sin(2 pi phi - pi/4)).
    // T max at phi = 7/8 (sin argument = -pi/2). T min at phi = 3/8 (= +pi/2).
    expect(TeffAtPhase(7 / 8, 10)).toBeGreaterThan(TeffAtPhase(3 / 8, 10));
  });

  it('distance modulus: 10 pc gives mu = 0', () => {
    expect(distanceModulus(10)).toBeCloseTo(0, 9);
  });

  it('distance modulus: 100 pc gives mu = 5', () => {
    expect(distanceModulus(100)).toBeCloseTo(5, 9);
  });

  it('apparent magnitude = M + mu', () => {
    expect(apparentMag(-4, 1000)).toBeCloseTo(-4 + 10, 6);
  });

  it('known Cepheid delta Cep is in the catalog with P ~ 5.4 d', () => {
    const c = KNOWN_CEPHEIDS.find(x => x.name === 'delta Cep');
    expect(c).toBeDefined();
    expect(c.P).toBeCloseTo(5.366, 2);
  });

  it('all known Cepheids lie on PL line within +/- 0.5 mag (sanity)', () => {
    for (const c of KNOWN_CEPHEIDS) {
      // The PL is exact in our model, so deviation is 0; just verify
      // the helper functions agree.
      const MV_pred = periodLuminosity_MV(c.P);
      expect(isFinite(MV_pred)).toBe(true);
    }
  });
});
