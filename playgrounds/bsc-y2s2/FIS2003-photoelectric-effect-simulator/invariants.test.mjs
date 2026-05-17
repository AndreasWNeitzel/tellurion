// Photoelectric effect: K_max = h nu - phi, no emission below the
// threshold at any intensity, K_max independent of intensity, the
// Einstein line slope is the universal h/e, and the saturation
// current scales with intensity while the cutoff does not.

import { describe, it, expect } from 'vitest';
import {
  H_EV, METALS, photonEnergy, thresholdFreqPHz, kMax, emits,
  stoppingVoltage, photocurrent, fitEinstein,
} from './sim.js';

describe('photoelectric-effect-simulator invariants', () => {
  it('K_max = h nu - phi above threshold, no emission below', () => {
    const phi = METALS.sodium;                 // 2.28 eV
    const nu0 = thresholdFreqPHz(phi);
    expect(emits(nu0 * 1.2, phi)).toBe(true);
    expect(kMax(nu0 * 1.2, phi)).toBeCloseTo(photonEnergy(nu0 * 1.2) - phi, 9);
    expect(emits(nu0 * 0.8, phi)).toBe(false);
    expect(kMax(nu0 * 0.8, phi)).toBeLessThan(0);
    // at exactly the threshold K_max -> 0
    expect(kMax(nu0, phi)).toBeCloseTo(0, 9);
  });

  it('no photoelectrons below threshold at ANY intensity', () => {
    const phi = METALS.copper, nuLow = thresholdFreqPHz(phi) * 0.7;
    for (const I of [0.1, 1, 10, 1000]) {
      for (const V of [-5, -1, 0, 2, 50]) expect(photocurrent(V, nuLow, phi, I)).toBe(0);
    }
  });

  it('K_max depends only on nu and phi, never on intensity', () => {
    const phi = METALS.zinc, nu = thresholdFreqPHz(phi) * 1.5;
    const k = kMax(nu, phi);
    // K_max has no intensity argument; the stopping voltage equals it
    expect(stoppingVoltage(nu, phi)).toBeCloseTo(k, 12);
    // and the I-V cutoff sits at -V_stop for every intensity
    for (const I of [0.5, 2, 20]) {
      expect(photocurrent(-k - 1e-6, nu, phi, I)).toBe(0);
      expect(photocurrent(-k + 0.5, nu, phi, I)).toBeGreaterThan(0);
    }
  });

  it('Einstein line slope is the universal h/e (metal-independent)', () => {
    for (const phi of [METALS.cesium, METALS.zinc, METALS.platinum]) {
      const nu0 = thresholdFreqPHz(phi);
      const fit = fitEinstein(phi, nu0 * 1.05, nu0 * 2.5);
      expect(Math.abs(fit.slope - H_EV) / H_EV).toBeLessThan(1e-6);   // slope = h/e
      expect(Math.abs(fit.nu0 - nu0 * 1e15) / (nu0 * 1e15)).toBeLessThan(1e-3);
    }
  });

  it('saturation current scales with intensity; the cutoff voltage does not', () => {
    const phi = METALS.sodium, nu = thresholdFreqPHz(phi) * 1.8, Vs = stoppingVoltage(nu, phi);
    const i1 = photocurrent(5, nu, phi, 1), i2 = photocurrent(5, nu, phi, 2), i4 = photocurrent(5, nu, phi, 4);
    expect(i2 / i1).toBeCloseTo(2, 6);
    expect(i4 / i1).toBeCloseTo(4, 6);
    // cutoff at -V_stop regardless of intensity
    for (const I of [1, 5, 50]) {
      expect(photocurrent(-Vs - 0.01, nu, phi, I)).toBe(0);
      expect(photocurrent(-Vs + 0.01, nu, phi, I)).toBeGreaterThan(0);
    }
  });

  it('higher photon frequency raises K_max and the stopping voltage', () => {
    const phi = METALS.sodium, nu0 = thresholdFreqPHz(phi);
    let prev = -1;
    for (const f of [1.1, 1.5, 2.0, 3.0]) {
      const Vs = stoppingVoltage(nu0 * f, phi);
      expect(Vs).toBeGreaterThan(prev);
      prev = Vs;
    }
    // a larger work function needs a higher threshold frequency
    expect(thresholdFreqPHz(METALS.platinum)).toBeGreaterThan(thresholdFreqPHz(METALS.cesium));
  });
});
