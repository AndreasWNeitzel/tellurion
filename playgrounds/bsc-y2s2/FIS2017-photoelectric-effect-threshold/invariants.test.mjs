// Photoelectric-effect invariants.
// (a) KE_max = 0 exactly at the threshold frequency nu_0 = phi/h.
// (b) KE_max = 0 for any nu < nu_0 (cutoff is sharp; no leakage).
// (c) Slope dKE/dnu = h above threshold (Planck constant exactly).
// (d) Threshold wavelength: lambda_0 = hc/phi, e.g. 580 nm for Cs (phi = 2.14 eV).
// (e) Energy conservation: KE_max + phi = h nu for nu > nu_0.

import { describe, it, expect } from 'vitest';
import {
  thresholdFreqPhz, thresholdWavelengthNm,
  keMaxEv, keMaxFromLambda,
  METALS, H_EV_S,
} from './sim.js';

describe('photoelectric-effect-threshold', () => {
  it('KE_max exactly zero at threshold frequency', () => {
    for (const m of METALS) {
      const nu0 = thresholdFreqPhz(m.phi);
      expect(keMaxEv(nu0, m.phi)).toBe(0);
    }
  });

  it('KE_max is zero below threshold (sharp cutoff)', () => {
    for (const m of METALS) {
      const nu0 = thresholdFreqPhz(m.phi);
      expect(keMaxEv(nu0 * 0.99, m.phi)).toBe(0);
      expect(keMaxEv(nu0 * 0.5,  m.phi)).toBe(0);
    }
  });

  it('slope dKE/dnu equals Planck constant h above threshold', () => {
    const phi = 2.14;
    const nu0 = thresholdFreqPhz(phi);
    const nu1 = nu0 * 2;
    const nu2 = nu0 * 3;
    const k1 = keMaxEv(nu1, phi);
    const k2 = keMaxEv(nu2, phi);
    const slope = (k2 - k1) / (nu2 - nu1); // eV / PHz = eV / (1e15 Hz)
    const expected = H_EV_S * 1e15; // eV per PHz
    expect(Math.abs(slope - expected) / expected).toBeLessThan(1e-12);
  });

  it('Cesium threshold wavelength ~ 580 nm (phi = 2.14 eV)', () => {
    const lam = thresholdWavelengthNm(2.14);
    expect(Math.abs(lam - 579.36)).toBeLessThan(0.1);
  });

  it('Platinum threshold wavelength ~ 195 nm (phi = 6.35 eV)', () => {
    const lam = thresholdWavelengthNm(6.35);
    expect(Math.abs(lam - 195.25)).toBeLessThan(0.5);
  });

  it('energy conservation: KE_max + phi = h nu for nu > nu_0', () => {
    const phi = 2.30;
    const nu0 = thresholdFreqPhz(phi);
    const nu = nu0 * 1.7;
    const photonE = H_EV_S * 1e15 * nu;
    const ke = keMaxEv(nu, phi);
    expect(Math.abs(ke + phi - photonE) / photonE).toBeLessThan(1e-12);
  });

  it('wavelength-input and frequency-input return same KE', () => {
    const phi = 2.36;
    const lam = 350; // nm
    const nu = (299792458 * 1e9 / lam) / 1e15; // PHz
    const k_lam = keMaxFromLambda(lam, phi);
    const k_nu = keMaxEv(nu, phi);
    expect(Math.abs(k_lam - k_nu) / k_lam).toBeLessThan(1e-9);
  });
});
