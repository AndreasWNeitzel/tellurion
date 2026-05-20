import { describe, it, expect } from 'vitest';
import {
  spindownDotP, spindownAge_yr, magneticEnergy_J, B_QED_G,
  isInBurstingRegime, burstLightcurve, KNOWN_MAGNETARS,
} from './sim.js';

describe('magnetar-burst-3d', () => {
  it('B_QED is 4.4e13 G', () => {
    expect(B_QED_G).toBeCloseTo(4.413e13, -10);
  });

  it('spindown dot P scales as B^2 at fixed P', () => {
    const a = spindownDotP(1e14, 5);
    const b = spindownDotP(2e14, 5);
    expect(b / a).toBeCloseTo(4, 4);
  });

  it('spindown dot P inversely with P at fixed B', () => {
    const a = spindownDotP(1e15, 1);
    const b = spindownDotP(1e15, 4);
    expect(a / b).toBeCloseTo(4, 4);
  });

  it('spindown age tau scales as 1/B^2', () => {
    const a = spindownAge_yr(1e14, 5);
    const b = spindownAge_yr(2e14, 5);
    expect(a / b).toBeCloseTo(4, 1);
  });

  it('SGR 1806-20 canonical: tau in 100 to 10000 yr (magnetar age range)', () => {
    const tau = spindownAge_yr(2e15, 7.55);
    expect(tau).toBeGreaterThan(100);
    expect(tau).toBeLessThan(10000);
  });

  it('magnetic energy scales as B^2', () => {
    const a = magneticEnergy_J(1e14);
    const b = magneticEnergy_J(2e14);
    expect(b / a).toBeCloseTo(4, 4);
  });

  it('B = 1e15 G gives E_B ~ 1e40 J = 1e47 erg', () => {
    const E = magneticEnergy_J(1e15);
    expect(E).toBeGreaterThan(1e39);
    expect(E).toBeLessThan(1e41);
  });

  it('bursting regime threshold above 1e13 G', () => {
    expect(isInBurstingRegime(1e12)).toBe(false);
    expect(isInBurstingRegime(1e14)).toBe(true);
  });

  it('burst lightcurve rises as t^2 before peak', () => {
    const t_peak = 0.1;
    const L1 = burstLightcurve(0.025, t_peak);
    const L2 = burstLightcurve(0.050, t_peak);
    expect(L2 / L1).toBeCloseTo(4, 3);
  });

  it('burst lightcurve decays as t^(-3/2) after peak', () => {
    const t_peak = 0.1;
    const L1 = burstLightcurve(0.4, t_peak);
    const L2 = burstLightcurve(1.6, t_peak);   // 4x later
    expect(L1 / L2).toBeCloseTo(Math.pow(4, 1.5), 2);
  });

  it('burst lightcurve at t < 0 is 0', () => {
    expect(burstLightcurve(-0.1, 0.1)).toBe(0);
  });

  it('peak lightcurve value is 1 at t_peak (unit normalization)', () => {
    expect(burstLightcurve(0.05, 0.05)).toBeCloseTo(1, 6);
  });

  it('KNOWN_MAGNETARS contains SGR 1806-20', () => {
    const sgr = KNOWN_MAGNETARS.find(m => m.name === 'SGR 1806-20');
    expect(sgr).toBeDefined();
    expect(sgr.B_G).toBeGreaterThan(1e15);
  });

  it('normal pulsar (B = 1e12 G) is not in bursting regime', () => {
    expect(isInBurstingRegime(1e12)).toBe(false);
  });
});
