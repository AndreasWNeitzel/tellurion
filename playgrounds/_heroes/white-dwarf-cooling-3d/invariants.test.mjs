import { describe, it, expect } from 'vitest';
import {
  eggletonRadius_Rsun, mestelLuminosity_Lsun, mestelTime_yr,
  effectiveTemperature_K, crystalFraction, blackbodyColor,
  DISK_AGE_GYR, M_CHANDRA,
} from './sim.js';

describe('white-dwarf-cooling-3d', () => {
  it('Chandrasekhar mass is 1.44 M_sun', () => {
    expect(M_CHANDRA).toBeCloseTo(1.44, 6);
  });

  it('Eggleton: a 0.6 M_sun WD has R ~ 0.013 R_sun', () => {
    expect(eggletonRadius_Rsun(0.6)).toBeGreaterThan(0.011);
    expect(eggletonRadius_Rsun(0.6)).toBeLessThan(0.014);
  });

  it('more massive WDs are smaller (mass-radius inversion)', () => {
    expect(eggletonRadius_Rsun(0.4)).toBeGreaterThan(eggletonRadius_Rsun(1.0));
    expect(eggletonRadius_Rsun(1.0)).toBeGreaterThan(eggletonRadius_Rsun(1.3));
  });

  it('radius -> 0 as M -> Chandrasekhar limit', () => {
    expect(eggletonRadius_Rsun(M_CHANDRA - 0.0001)).toBeLessThan(0.003);
  });

  it('Mestel cooling: 0.6 M_sun at 1 Gyr gives L ~ 1.6e-3 L_sun', () => {
    expect(mestelLuminosity_Lsun(0.6, 1e9)).toBeCloseTo(1.6e-3, 3);
  });

  it('Mestel L scales as t^(-7/5)', () => {
    const L1 = mestelLuminosity_Lsun(0.6, 1e9);
    const L10 = mestelLuminosity_Lsun(0.6, 1e10);
    expect(L1 / L10).toBeCloseTo(Math.pow(10, 7 / 5), 1);
  });

  it('Mestel L scales linearly with mass', () => {
    const L_low = mestelLuminosity_Lsun(0.4, 1e9);
    const L_high = mestelLuminosity_Lsun(0.8, 1e9);
    expect(L_high / L_low).toBeCloseTo(2, 6);
  });

  it('Mestel time inverse: mestelTime(L) recovers original t', () => {
    const t = 5e9;
    const L = mestelLuminosity_Lsun(0.6, t);
    expect(mestelTime_yr(0.6, L)).toBeCloseTo(t, 2);
  });

  it('effective temperature decreases as L decreases (at fixed R)', () => {
    const R = 0.013;
    expect(effectiveTemperature_K(0.1, R)).toBeGreaterThan(effectiveTemperature_K(0.001, R));
  });

  it('hot WD (L = 1 L_sun, R ~ 0.013 R_sun) has T_eff in 20000 to 60000 K', () => {
    const T = effectiveTemperature_K(1.0, 0.013);
    expect(T).toBeGreaterThan(20000);
    expect(T).toBeLessThan(60000);
  });

  it('crystallization is zero at very early ages', () => {
    expect(crystalFraction(1e7, 0.6)).toBe(0);
  });

  it('crystallization grows to ~ 1 by 10 Gyr for a 0.6 M_sun WD', () => {
    expect(crystalFraction(1e10, 0.6)).toBeGreaterThan(0.95);
  });

  it('crystallization is monotonic in time', () => {
    let prev = -1;
    for (let lt = 7; lt <= 10.2; lt += 0.1) {
      const f = crystalFraction(Math.pow(10, lt), 0.6);
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
    }
  });

  it('more massive WDs crystallize earlier (at fixed age)', () => {
    const f_lo = crystalFraction(2e9, 0.4);
    const f_hi = crystalFraction(2e9, 1.0);
    expect(f_hi).toBeGreaterThan(f_lo);
  });

  it('blackbody color: hot is bluer (high B, lower R)', () => {
    const cool = blackbodyColor(3000);
    const hot = blackbodyColor(30000);
    expect(hot.b).toBeGreaterThan(cool.b);
    expect(hot.r).toBeLessThanOrEqual(cool.r);
  });

  it('disk-age cutoff is ~ 9 Gyr', () => {
    expect(DISK_AGE_GYR).toBeCloseTo(9.0, 1);
  });
});
