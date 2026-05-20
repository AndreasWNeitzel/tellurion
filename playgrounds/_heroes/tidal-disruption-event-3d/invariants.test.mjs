import { describe, it, expect } from 'vitest';
import {
  tidalRadius_m, schwarzschildRadius_m, isDisrupted, maxDisruptingBH_solar,
  peakFallbackTime_days, peakFallbackTime_s, fallbackRate, lightcurve_W,
  peakLuminosity_W, eddingtonLuminosity_W,
} from './sim.js';

describe('tidal-disruption-event-3d', () => {
  it('R_T scales as (M_BH / M_star)^(1/3)', () => {
    const r1 = tidalRadius_m(1e6, 1, 1);
    const r2 = tidalRadius_m(1e7, 1, 1);
    expect(r2 / r1).toBeCloseTo(Math.pow(10, 1 / 3), 6);
  });

  it('R_T scales linearly with R_star', () => {
    const r1 = tidalRadius_m(1e6, 1, 1);
    const r2 = tidalRadius_m(1e6, 1, 2);
    expect(r2 / r1).toBeCloseTo(2, 6);
  });

  it('1 M_sun star + 10^6 M_sun BH gives R_T ~ 100 R_sun ~ 0.5 AU', () => {
    const R_T = tidalRadius_m(1e6, 1, 1);
    expect(R_T).toBeGreaterThan(0.3 * 1.496e11);
    expect(R_T).toBeLessThan(1.0 * 1.496e11);
  });

  it('sun-like star disrupted by 10^6 SMBH (R_T > R_S)', () => {
    expect(isDisrupted(1e6, 1, 1)).toBe(true);
  });

  it('sun-like star swallowed whole by 10^9 SMBH (R_T < R_S)', () => {
    expect(isDisrupted(1e9, 1, 1)).toBe(false);
  });

  it('critical disrupting BH mass for sun-like is ~ 10^8 M_sun', () => {
    const Mmax = maxDisruptingBH_solar(1, 1);
    expect(Mmax).toBeGreaterThan(3e7);
    expect(Mmax).toBeLessThan(3e8);
  });

  it('peak fallback time ~ 40 days for canonical TDE', () => {
    const t = peakFallbackTime_days(1e6, 1, 1);
    expect(t).toBeGreaterThan(20);
    expect(t).toBeLessThan(80);
  });

  it('peak time scales as sqrt(M_BH) at fixed star', () => {
    const t1 = peakFallbackTime_days(1e6, 1, 1);
    const t2 = peakFallbackTime_days(4e6, 1, 1);
    expect(t2 / t1).toBeCloseTo(2, 1);
  });

  it('fallback rate at t = 0 is 0 (pre-disruption)', () => {
    expect(fallbackRate(0, 1e6, 1, 1)).toBe(0);
  });

  it('fallback rate decays as t^(-5/3) after the peak', () => {
    const tp = peakFallbackTime_s(1e6, 1, 1);
    const r_peak = fallbackRate(tp, 1e6, 1, 1);
    const r_4p = fallbackRate(4 * tp, 1e6, 1, 1);
    // ratio = (4)^(-5/3) ~ 0.0992
    expect(r_4p / r_peak).toBeCloseTo(Math.pow(4, -5 / 3), 3);
  });

  it('lightcurve drops to ~ 10% of peak at t = 4 t_peak', () => {
    const tp = peakFallbackTime_s(1e6, 1, 1);
    const L_peak = lightcurve_W(tp, 1e6, 1, 1);
    const L_4p = lightcurve_W(4 * tp, 1e6, 1, 1);
    expect(L_4p / L_peak).toBeCloseTo(Math.pow(4, -5 / 3), 3);
  });

  it('Eddington luminosity is 1.26e31 W / M_sun', () => {
    expect(eddingtonLuminosity_W(1)).toBeCloseTo(1.26e31, -29);
  });

  it('L_Edd scales linearly with mass', () => {
    expect(eddingtonLuminosity_W(2)).toBeCloseTo(2 * eddingtonLuminosity_W(1), 4);
  });

  it('peak luminosity is capped at L_Edd', () => {
    const Lp = peakLuminosity_W(1e6, 1, 1);
    expect(Lp).toBeLessThanOrEqual(eddingtonLuminosity_W(1e6));
  });

  it('peak luminosity is positive for canonical TDE', () => {
    expect(peakLuminosity_W(1e6, 1, 1)).toBeGreaterThan(0);
  });

  it('R_T = R_S exactly at the Hills mass cutoff', () => {
    const Mhills = maxDisruptingBH_solar(1, 1);
    const R_T = tidalRadius_m(Mhills, 1, 1);
    const R_S = schwarzschildRadius_m(Mhills);
    expect(R_T / R_S).toBeCloseTo(1, 3);
  });
});
