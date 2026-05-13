// Davisson-Germer invariants.
// (a) At V = 54 V, lambda = 0.167 nm (canonical Davisson-Germer 1927).
// (b) Bragg n=1 peak at theta = asin(lambda / 2d). For Ni (111), V=54 V,
//     this puts the peak at theta = 50.7 degrees.
// (c) For lambda > 2 d, no real Bragg peak (asin > 1).
// (d) Non-rel and rel agree at low V (10 V): within 1e-4.
// (e) gratingIntensity has principal-max value N^2 at theta = 0.
// (f) Energy / wavelength scaling: V*4 gives lambda/2 (non-rel scaling).

import { describe, it, expect } from 'vitest';
import {
  electronWavelengthNm, electronWavelengthNRNm,
  braggAngleRad, gratingIntensity,
  HC_EV_NM, M_E_EV, D_NI_NM,
} from './sim.js';

const RAD2DEG = 180 / Math.PI;

describe('davisson-germer-diffraction', () => {
  it('V = 54 V gives lambda ~ 0.167 nm', () => {
    const lam = electronWavelengthNm(54);
    expect(Math.abs(lam - 0.16713)).toBeLessThan(0.001);
  });

  it('Bragg peak at theta ~ 50.7 deg for Ni(111), V=54 V', () => {
    const lam = electronWavelengthNm(54);
    const theta = braggAngleRad(lam, D_NI_NM, 1);
    const thetaDeg = theta * RAD2DEG;
    expect(Math.abs(thetaDeg - 50.83)).toBeLessThan(1.0);
  });

  it('lambda > d gives NaN (no first-order peak)', () => {
    const lam = 0.3; // > 0.215
    const theta = braggAngleRad(lam, D_NI_NM, 1);
    expect(Number.isNaN(theta)).toBe(true);
  });

  it('non-rel and rel agree at low V (10 V) within 1e-4', () => {
    const a = electronWavelengthNm(10);
    const b = electronWavelengthNRNm(10);
    expect(Math.abs(a - b) / a).toBeLessThan(1e-4);
  });

  it('non-rel scaling: V quadrupled gives lambda halved', () => {
    const lam1 = electronWavelengthNRNm(50);
    const lam2 = electronWavelengthNRNm(200);
    expect(Math.abs(lam2 - lam1 / 2) / lam1).toBeLessThan(1e-10);
  });

  it('gratingIntensity has principal max N^2 at theta = 0', () => {
    const N = 12;
    const I = gratingIntensity(0, 0.1, D_NI_NM, N);
    expect(Math.abs(I - N * N)).toBeLessThan(1e-8);
  });

  it('gratingIntensity drops below epsilon between maxima', () => {
    // First Bragg max at sin theta = lambda / d; halfway between gives ~0
    const lam = 0.1;
    const N = 20;
    const half = Math.asin(0.5 * lam / D_NI_NM);
    const I = gratingIntensity(half, lam, D_NI_NM, N);
    expect(I).toBeLessThan(1); // far below the N^2 = 400 peak
  });

  it('higher orders appear when d > n lambda', () => {
    // At V = 200 V, lambda ~ 0.087 nm; n=2 needs d > 2*0.087 = 0.174 nm < 0.215.
    const lam = electronWavelengthNm(200);
    const theta2 = braggAngleRad(lam, D_NI_NM, 2);
    expect(Number.isFinite(theta2)).toBe(true);
    expect(theta2).toBeGreaterThan(braggAngleRad(lam, D_NI_NM, 1));
  });
});
