import { describe, it, expect } from 'vitest';
import {
  schwarzschildRadius_m, hawkingTemperature_K, hawkingPower_W,
  evaporationTime_s, evaporationTime_yr, massAtTime_kg,
  peakFrequency_Hz, PRIMORDIAL_BH_KG, massInSolar, solarToKg,
} from './sim.js';

const M_SUN = 1.989e30;

describe('hawking-radiation-bh-evaporation-3d', () => {
  it('Schwarzschild radius: 1 solar mass gives r_s ~ 2.95 km', () => {
    const rs = schwarzschildRadius_m(M_SUN);
    expect(rs).toBeGreaterThan(2900);
    expect(rs).toBeLessThan(3000);
  });

  it('r_s scales linearly with M', () => {
    expect(schwarzschildRadius_m(2 * M_SUN)).toBeCloseTo(2 * schwarzschildRadius_m(M_SUN), 6);
  });

  it('Hawking temperature: 1 solar mass gives T_H ~ 6e-8 K', () => {
    const T = hawkingTemperature_K(M_SUN);
    expect(T).toBeGreaterThan(5e-8);
    expect(T).toBeLessThan(7e-8);
  });

  it('Hawking temperature scales as 1/M', () => {
    const T1 = hawkingTemperature_K(M_SUN);
    const T2 = hawkingTemperature_K(2 * M_SUN);
    expect(T1 / T2).toBeCloseTo(2, 6);
  });

  it('Hawking power scales as 1/M^2', () => {
    const P1 = hawkingPower_W(M_SUN);
    const P2 = hawkingPower_W(2 * M_SUN);
    expect(P1 / P2).toBeCloseTo(4, 4);
  });

  it('Evaporation time: solar-mass BH lifetime ~ 2e67 yr', () => {
    const t_yr = evaporationTime_yr(M_SUN);
    expect(t_yr).toBeGreaterThan(1e67);
    expect(t_yr).toBeLessThan(1e68);
  });

  it('Evaporation time scales as M^3', () => {
    const t1 = evaporationTime_s(M_SUN);
    const t2 = evaporationTime_s(2 * M_SUN);
    expect(t2 / t1).toBeCloseTo(8, 4);
  });

  it('Primordial BH (M = 1.7e11 kg) has t_evap ~ age of universe', () => {
    const t_yr = evaporationTime_yr(PRIMORDIAL_BH_KG);
    expect(t_yr).toBeGreaterThan(1e9);
    expect(t_yr).toBeLessThan(1e11);
  });

  it('M(t = 0) = M_0 (initial condition)', () => {
    const M = massAtTime_kg(M_SUN, 0);
    expect(Math.abs(M - M_SUN) / M_SUN).toBeLessThan(1e-6);
  });

  it('M(t = t_evap) = 0', () => {
    const tev = evaporationTime_s(M_SUN);
    expect(massAtTime_kg(M_SUN, tev)).toBe(0);
  });

  it('M(t) decreases monotonically with t', () => {
    const M0 = 1e12;       // small enough to evaporate in reasonable proper time
    const tev = evaporationTime_s(M0);
    let prev = M0 + 1;
    for (let f = 0.05; f <= 0.95; f += 0.1) {
      const M = massAtTime_kg(M0, f * tev);
      expect(M).toBeLessThan(prev);
      if (M > 0) prev = M;
    }
  });

  it('M^3 + 3 K t = M_0^3 (conservation of cube)', () => {
    const M0 = 1e15;
    const tev = evaporationTime_s(M0);
    const t = 0.5 * tev;
    const M = massAtTime_kg(M0, t);
    // M0^3 - M^3 ~ 3 K t = 0.5 M0^3
    const ratio = (Math.pow(M0, 3) - Math.pow(M, 3)) / Math.pow(M0, 3);
    expect(ratio).toBeCloseTo(0.5, 3);
  });

  it('Peak frequency Wien: nu_peak / T = const', () => {
    expect(peakFrequency_Hz(100) / 100).toBeCloseTo(peakFrequency_Hz(50) / 50, 6);
  });

  it('Mass converters round-trip: solarToKg(massInSolar(M)) = M', () => {
    expect(solarToKg(massInSolar(1.7e30))).toBeCloseTo(1.7e30, 0);
  });

  it('Power: solar BH is ~ 1e-29 W (utterly undetectable)', () => {
    const P = hawkingPower_W(M_SUN);
    expect(P).toBeGreaterThan(1e-30);
    expect(P).toBeLessThan(1e-27);
  });
});
