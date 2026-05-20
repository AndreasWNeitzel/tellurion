import { describe, it, expect } from 'vitest';
import {
  larmorFrequency_Hz, gyroRadius_m, beamingHalfAngle_rad,
  criticalFrequency_Hz, specShape, singleElectronPower_W,
  pulseWidth_s, orbitPeriod_s,
} from './sim.js';

describe('synchrotron-radiation-cone-3d', () => {
  it('beaming half-angle is 1/gamma in radians', () => {
    expect(beamingHalfAngle_rad(10)).toBeCloseTo(0.1, 9);
    expect(beamingHalfAngle_rad(1000)).toBeCloseTo(0.001, 9);
  });

  it('beaming half-angle = infinity at gamma = 1 (non-relativistic)', () => {
    expect(beamingHalfAngle_rad(1)).toBe(Infinity);
  });

  it('Larmor frequency scales as B / gamma', () => {
    const a = larmorFrequency_Hz(10, 1e-4);
    const b = larmorFrequency_Hz(10, 2e-4);
    expect(b / a).toBeCloseTo(2, 6);
    const c = larmorFrequency_Hz(20, 1e-4);
    expect(c / a).toBeCloseTo(0.5, 6);
  });

  it('gyro radius scales as gamma / B', () => {
    const a = gyroRadius_m(10, 1e-4);
    const b = gyroRadius_m(20, 1e-4);
    expect(b / a).toBeCloseTo(2, 6);
    const c = gyroRadius_m(10, 2e-4);
    expect(c / a).toBeCloseTo(0.5, 6);
  });

  it('critical frequency: gamma = 10^4, B = 1e-8 T (PWN) gives nu_c in the radio band', () => {
    const nu_c = criticalFrequency_Hz(1e4, 1e-8);
    expect(nu_c).toBeGreaterThan(1e9);
    expect(nu_c).toBeLessThan(1e12);
  });

  it('critical frequency: gamma = 10^6, B = 1 T (laboratory ring) gives nu_c above keV', () => {
    const nu_c = criticalFrequency_Hz(1e6, 1);
    expect(nu_c).toBeGreaterThan(1e18);
  });

  it('critical frequency scales as gamma^2 * B (since nu_c = 1.5 gamma^3 nu_L and nu_L ~ B/gamma)', () => {
    const a = criticalFrequency_Hz(10, 1e-4);
    const b = criticalFrequency_Hz(20, 1e-4);
    expect(b / a).toBeCloseTo(4, 4);
    const c = criticalFrequency_Hz(10, 2e-4);
    expect(c / a).toBeCloseTo(2, 4);
  });

  it('spec shape: F(1) is positive', () => {
    expect(specShape(1)).toBeGreaterThan(0);
  });

  it('spec shape: F(x) ~ x^(1/3) at low x', () => {
    const F1 = specShape(0.001);
    const F2 = specShape(0.008);     // 8x larger x
    expect(F2 / F1).toBeCloseTo(Math.pow(8, 1 / 3), 1);
  });

  it('spec shape: F(x) -> 0 exponentially at high x', () => {
    expect(specShape(10)).toBeLessThan(1e-3);
    expect(specShape(20)).toBeLessThan(1e-7);
  });

  it('synchrotron power scales as gamma^2 (relativistic)', () => {
    const P1 = singleElectronPower_W(100, 1);
    const P2 = singleElectronPower_W(200, 1);
    expect(P2 / P1).toBeCloseTo(4, 3);
  });

  it('synchrotron power scales as B^2', () => {
    const P1 = singleElectronPower_W(100, 1);
    const P2 = singleElectronPower_W(100, 2);
    expect(P2 / P1).toBeCloseTo(4, 3);
  });

  it('pulse width is much shorter than orbital period for relativistic electron', () => {
    const T = orbitPeriod_s(100, 1e-4);
    const dt = pulseWidth_s(100, 1e-4);
    expect(dt / T).toBeLessThan(0.01);
  });

  it('pulse-width-to-orbit-period ratio is ~ 1/gamma (lab frame, before Doppler compression)', () => {
    const ratio_10 = pulseWidth_s(10, 1e-4) / orbitPeriod_s(10, 1e-4);
    const ratio_100 = pulseWidth_s(100, 1e-4) / orbitPeriod_s(100, 1e-4);
    expect(ratio_10 / ratio_100).toBeCloseTo(10, 1);
  });
});
