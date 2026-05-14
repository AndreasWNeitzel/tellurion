// Fabry-Perot invariants.
// (a) T(0) = 1 exactly.
// (b) T(pi) = 1 / (1 + F).
// (c) T(2 pi) = 1 again (resonance).
// (d) Finesse formula: F_* = pi sqrt(R) / (1 - R).
// (e) FSR in frequency: c / (2 n L).
// (f) FWHM in phi ~ 4 / sqrt(F) for high R.

import { describe, it, expect } from 'vitest';
import {
  coefficientFinesse, finesse, transmission,
  fsrWavelengthNm, fsrFreqHz, fwhmPhi,
} from './sim.js';

describe('fabry-perot-finesse', () => {
  it('T(0) = 1 exactly', () => {
    expect(Math.abs(transmission(0, 0.9) - 1)).toBeLessThan(1e-15);
  });

  it('T(pi) = 1 / (1 + F)', () => {
    const R = 0.9;
    const F = coefficientFinesse(R);
    const expected = 1 / (1 + F);
    expect(Math.abs(transmission(Math.PI, R) - expected)).toBeLessThan(1e-12);
  });

  it('T(2 pi) = 1 (resonance returns)', () => {
    expect(Math.abs(transmission(2 * Math.PI, 0.9) - 1)).toBeLessThan(1e-12);
  });

  it('finesse F_* = pi sqrt(R) / (1 - R)', () => {
    const R = 0.95;
    const expected = Math.PI * Math.sqrt(R) / (1 - R);
    expect(Math.abs(finesse(R) - expected)).toBeLessThan(1e-12);
  });

  it('FSR in frequency = c / (2 n L)', () => {
    const c = 299792458;
    expect(Math.abs(fsrFreqHz(1.5, 1e-2) - c / (2 * 1.5 * 1e-2))).toBeLessThan(1e-6);
  });

  it('FSR scaling: doubling L halves FSR', () => {
    const f1 = fsrFreqHz(1, 1e-2);
    const f2 = fsrFreqHz(1, 2e-2);
    expect(Math.abs(f2 - f1 / 2) / f1).toBeLessThan(1e-12);
  });

  it('FWHM in phi shrinks as R approaches 1', () => {
    const w1 = fwhmPhi(0.5);
    const w2 = fwhmPhi(0.95);
    expect(w2).toBeLessThan(w1);
  });

  it('coefficient finesse F = 4R / (1-R)^2', () => {
    const R = 0.8;
    expect(Math.abs(coefficientFinesse(R) - 4 * R / Math.pow(1 - R, 2))).toBeLessThan(1e-12);
  });
});
