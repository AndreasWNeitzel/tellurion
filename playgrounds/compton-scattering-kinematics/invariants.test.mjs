// Compton scattering invariants.
// (a) Forward scatter (theta = 0) gives zero shift.
// (b) Backscatter (theta = pi) gives max shift 2 lambda_C.
// (c) Right-angle scatter (theta = pi/2) gives shift = lambda_C exactly.
// (d) Energy conservation: h nu = h nu' + T_electron.
// (e) Recoil angle limit: theta = pi -> phi = 0 (electron goes forward).
// (f) Recoil angle limit: theta -> 0 -> phi -> pi/2 (electron stays put).

import { describe, it, expect } from 'vitest';
import {
  comptonShift, scatteredWavelength, electronKE, electronRecoilAngle,
  photonEnergy, maxShift, LAMBDA_C_NM, HC_EV_NM,
} from './sim.js';

describe('compton-scattering-kinematics', () => {
  it('forward scatter gives zero shift', () => {
    expect(Math.abs(comptonShift(0))).toBeLessThan(1e-15);
  });

  it('backscatter gives shift = 2 lambda_C exactly', () => {
    const shift = comptonShift(Math.PI);
    expect(Math.abs(shift - 2 * LAMBDA_C_NM)).toBeLessThan(1e-15);
    expect(Math.abs(shift - maxShift())).toBeLessThan(1e-15);
  });

  it('right-angle scatter gives shift = lambda_C exactly', () => {
    const shift = comptonShift(Math.PI / 2);
    expect(Math.abs(shift - LAMBDA_C_NM)).toBeLessThan(1e-15);
  });

  it('energy conservation: h nu = h nu prime + T_electron', () => {
    const lambdaNm = 0.001; // X-ray, 1 pm
    const theta = 1.2;
    const E_in = photonEnergy(lambdaNm);
    const E_out = photonEnergy(scatteredWavelength(lambdaNm, theta));
    const T = electronKE(lambdaNm, theta);
    expect(Math.abs(E_in - E_out - T) / E_in).toBeLessThan(1e-12);
  });

  it('electron recoil angle approaches 0 as theta -> pi', () => {
    const lambdaNm = 0.001;
    const phi = electronRecoilAngle(lambdaNm, Math.PI - 1e-9);
    expect(phi).toBeLessThan(1e-6);
  });

  it('electron recoil angle approaches pi/2 as theta -> 0', () => {
    const lambdaNm = 0.001;
    const phi = electronRecoilAngle(lambdaNm, 1e-8);
    expect(Math.abs(phi - Math.PI / 2)).toBeLessThan(1e-4);
  });

  it('cot(phi) = (1 + alpha) tan(theta/2) closed form', () => {
    const lambdaNm = 0.001;
    const theta = 0.8;
    const alpha = LAMBDA_C_NM / lambdaNm;
    const cotExpected = (1 + alpha) * Math.tan(theta / 2);
    const phi = electronRecoilAngle(lambdaNm, theta);
    const cotActual = 1 / Math.tan(phi);
    expect(Math.abs(cotActual - cotExpected) / cotExpected).toBeLessThan(1e-12);
  });
});
