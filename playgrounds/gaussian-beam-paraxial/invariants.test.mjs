// Paraxial Gaussian beam invariant tests.
// (a) Rayleigh range z_R = pi w0^2 / lambda.
// (b) Spot radius w(z) = w0 sqrt(1 + (z/z_R)^2).
// (c) At z = z_R: w = sqrt(2) w0.
// (d) Far field: w(z) -> z lambda / (pi w0).
// (e) Power through aperture of radius R = w(z): 1 - e^{-2} ~ 0.865.

import { describe, it, expect } from 'vitest';
import {
  spotRadius, rayleighRange, divergenceAngle, powerThroughAperture,
  intensityField,
} from './sim.js';

describe('Gaussian beam: closed-form quantities', () => {
  it('z_R = pi w0^2 / lambda', () => {
    const zR = rayleighRange(0.20, 0.020);
    expect(zR).toBeCloseTo(Math.PI * 0.04 / 0.020, 12);
  });

  it('w(0) = w0', () => {
    const zR = rayleighRange(0.2, 0.02);
    expect(spotRadius(0, 0.2, zR)).toBeCloseTo(0.2, 12);
  });

  it('w(z_R) = sqrt(2) w0', () => {
    const zR = rayleighRange(0.2, 0.02);
    expect(spotRadius(zR, 0.2, zR)).toBeCloseTo(Math.sqrt(2) * 0.2, 12);
  });

  it('far-field: w(z) -> z lambda / (pi w0)', () => {
    const w0 = 0.10, lambda = 0.04;
    const zR = rayleighRange(w0, lambda);
    const z = 50 * zR;
    const w = spotRadius(z, w0, zR);
    const wFar = z * lambda / (Math.PI * w0);
    expect(Math.abs(w - wFar) / wFar).toBeLessThan(1e-3);
  });

  it('divergence theta = lambda / (pi w0)', () => {
    expect(divergenceAngle(0.20, 0.020)).toBeCloseTo(0.020 / (Math.PI * 0.20), 12);
  });
});

describe('Gaussian beam: power through aperture', () => {
  it('R = w(z) captures 1 - e^{-2} ~ 0.865 of total power', () => {
    const w0 = 0.20, lambda = 0.02;
    const zR = rayleighRange(w0, lambda);
    for (const z of [0, 0.5 * zR, zR, 2 * zR, 5 * zR]) {
      const w = spotRadius(z, w0, zR);
      const f = powerThroughAperture(w, z, w0, zR);
      expect(f).toBeCloseTo(1 - Math.exp(-2), 10);
    }
  });

  it('R = 0 captures 0 power', () => {
    expect(powerThroughAperture(0, 0, 0.2, 1.0)).toBe(0);
  });

  it('R -> infinity captures 1.0 of power', () => {
    expect(powerThroughAperture(1000, 0, 0.2, 1.0)).toBeCloseTo(1.0, 12);
  });
});

describe('Gaussian beam: intensity field consistency', () => {
  it('peak intensity at (z=0, r=0)', () => {
    const out = intensityField({ Nz: 64, Nr: 64, zMax: 2, rMax: 1, w0: 0.2, lambda: 0.02 });
    let bestI = 0, bestIdx = -1;
    for (let i = 0; i < out.field.length; i += 1) {
      if (out.field[i] > bestI) { bestI = out.field[i]; bestIdx = i; }
    }
    const iZ = bestIdx % out.Nz;
    const iR = Math.floor(bestIdx / out.Nz);
    const z = -out.zMax + (2 * out.zMax) * (iZ / (out.Nz - 1));
    const r = -out.rMax + (2 * out.rMax) * (iR / (out.Nr - 1));
    expect(Math.abs(z)).toBeLessThan(0.1);
    expect(Math.abs(r)).toBeLessThan(0.05);
    expect(bestI).toBeGreaterThan(0.95);
    expect(bestI).toBeLessThan(1.01);
  });
});
