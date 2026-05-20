import { describe, it, expect } from 'vitest';
import {
  intensity, sinc2, multiSlitFactor, principalMaximumAngle, braggAngle,
  singleSlitFirstMinAngle, deBroglieElectron_m, sampleHit, makeRng,
  NICKEL_LATTICE_M, WAVELENGTH_PRESETS,
} from './sim.js';

describe('slit-experiment-legend-3d', () => {
  it('sinc^2 at 0 is 1', () => {
    expect(sinc2(0)).toBeCloseTo(1, 9);
  });

  it('sinc^2 at pi is 0', () => {
    expect(sinc2(Math.PI)).toBeCloseTo(0, 9);
  });

  it('multi-slit factor at beta = 0 equals N^2', () => {
    expect(multiSlitFactor(5, 1e-12)).toBeCloseTo(25, 6);
  });

  it('intensity at theta = 0 is 1 for any N (normalized)', () => {
    expect(intensity(0, 1, 2e-6, 10e-6, 500e-9)).toBeCloseTo(1, 9);
    expect(intensity(0, 3, 2e-6, 10e-6, 500e-9) / 9).toBeCloseTo(1, 9);
  });

  it('first single-slit minimum at a sin theta = lambda', () => {
    const a = 5e-6, lam = 500e-9;
    const th = singleSlitFirstMinAngle(a, lam);
    expect(intensity(th, 1, a, 10e-6, lam)).toBeLessThan(1e-9);
  });

  it('first principal maximum at d sin theta = lambda', () => {
    const d = 10e-6, lam = 500e-9;
    expect(principalMaximumAngle(1, d, lam)).toBeCloseTo(Math.asin(lam / d), 9);
  });

  it('Bragg angle at 2 d sin theta = lambda', () => {
    expect(braggAngle(1, 1e-10, 1e-10)).toBeCloseTo(Math.asin(0.5), 9);
  });

  it('de Broglie: 54 eV electron has lambda ~ 0.167 nm', () => {
    const lam = deBroglieElectron_m(54);
    expect(lam).toBeGreaterThan(1.5e-10);
    expect(lam).toBeLessThan(1.9e-10);
  });

  it('de Broglie scales as 1/sqrt(E)', () => {
    const l1 = deBroglieElectron_m(10);
    const l4 = deBroglieElectron_m(40);
    expect(l1 / l4).toBeCloseTo(2, 4);
  });

  it('Davisson-Germer canonical: 54 eV + Ni (2.15 A) gives Bragg ~ 23 deg first order', () => {
    const lam = deBroglieElectron_m(54);
    const th = braggAngle(1, NICKEL_LATTICE_M, lam);
    // first-order Bragg angle for normal-incidence beam: 23 deg
    // (scattering angle = 2 theta_B = 46 to 50 deg matching 1927 experiment)
    expect(th / (Math.PI / 180)).toBeGreaterThan(20);
    expect(th / (Math.PI / 180)).toBeLessThan(30);
  });

  it('N = 2 reduces to double-slit (sin alpha / alpha)^2 * 4 cos^2 beta', () => {
    const N = 2, a = 2e-6, d = 10e-6, lam = 500e-9;
    const th = 0.01;
    const alpha = Math.PI * a * Math.sin(th) / lam;
    const beta = Math.PI * d * Math.sin(th) / lam;
    const expected = sinc2(alpha) * 4 * Math.cos(beta) * Math.cos(beta);
    expect(intensity(th, N, a, d, lam)).toBeCloseTo(expected, 6);
  });

  it('N = 1 reduces to single-slit envelope', () => {
    const N = 1, a = 2e-6, d = 10e-6, lam = 500e-9;
    for (const th of [0.001, 0.01, 0.05]) {
      const alpha = Math.PI * a * Math.sin(th) / lam;
      expect(intensity(th, N, a, d, lam)).toBeCloseTo(sinc2(alpha), 6);
    }
  });

  it('intensity is symmetric in theta', () => {
    const N = 3, a = 2e-6, d = 10e-6, lam = 500e-9;
    expect(intensity(0.02, N, a, d, lam)).toBeCloseTo(intensity(-0.02, N, a, d, lam), 9);
  });

  it('grating sharpens: I(theta_1) for N = 10 > I(theta_1) for N = 2', () => {
    const a = 2e-6, d = 10e-6, lam = 500e-9;
    const th1 = principalMaximumAngle(1, d, lam);
    expect(intensity(th1, 10, a, d, lam)).toBeGreaterThan(intensity(th1, 2, a, d, lam));
  });

  it('rejection sampler returns y within expected range', () => {
    const rng = makeRng(0xC0FFEE);
    for (let i = 0; i < 100; i++) {
      const y = sampleHit(2, 2e-6, 10e-6, 500e-9, 0.5, rng);
      expect(Math.abs(y)).toBeLessThan(0.5);   // within +/- 50 cm on a 50-cm screen
    }
  });

  it('preset wavelengths are in the visible range', () => {
    expect(WAVELENGTH_PRESETS.red).toBeGreaterThan(620e-9);
    expect(WAVELENGTH_PRESETS.blue).toBeLessThan(470e-9);
  });

  it('Ni lattice spacing is 2.15 Angstrom', () => {
    expect(NICKEL_LATTICE_M).toBeCloseTo(2.15e-10, 12);
  });
});
