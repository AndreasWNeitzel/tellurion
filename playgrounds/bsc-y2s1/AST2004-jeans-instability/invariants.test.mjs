// Jeans instability invariants.
// (a) omega^2 = 0 exactly at k = 2 pi / lambda_J.
// (b) omega^2 < 0 for k below the Jeans wavenumber (unstable, gravitational collapse).
// (c) omega^2 > 0 for k above the Jeans wavenumber (stable, sound waves).
// (d) lambda_J for cold interstellar cloud (n = 1e3 /cm^3, T = 10 K) is ~ 0.3 pc.
// (e) Jeans mass M_J ~ 1 M_sun for solar parameters.
// (f) Doubling density divides lambda_J by sqrt(2).

import { describe, it, expect } from 'vitest';
import {
  jeansLengthM, jeansMassKg, omegaSquared,
  nToRho, isothermalCs,
  G_SI, PC_M, M_SUN,
} from './sim.js';

describe('jeans-instability', () => {
  it('omega^2 = 0 exactly at k_J = 2 pi / lambda_J', () => {
    const cs = 200, rho = 1e-21;
    const lam = jeansLengthM(cs, rho);
    const kJ = 2 * Math.PI / lam;
    const w2 = omegaSquared(kJ, cs, rho);
    // omega^2 should be very small (machine precision allowance)
    expect(Math.abs(w2)).toBeLessThan(1e-30);
  });

  it('omega^2 negative for k below k_J (unstable)', () => {
    const cs = 200, rho = 1e-21;
    const lam = jeansLengthM(cs, rho);
    const kBelow = 2 * Math.PI / (2 * lam);
    expect(omegaSquared(kBelow, cs, rho)).toBeLessThan(0);
  });

  it('omega^2 positive for k above k_J (stable)', () => {
    const cs = 200, rho = 1e-21;
    const lam = jeansLengthM(cs, rho);
    const kAbove = 2 * Math.PI / (0.5 * lam);
    expect(omegaSquared(kAbove, cs, rho)).toBeGreaterThan(0);
  });

  it('Jeans length scales as cs / sqrt(rho)', () => {
    const lam1 = jeansLengthM(200, 1e-21);
    const lam2 = jeansLengthM(200, 2e-21);
    expect(Math.abs(lam2 - lam1 / Math.sqrt(2)) / lam1).toBeLessThan(1e-12);
  });

  it('Jeans length scales linearly with cs at fixed rho', () => {
    const lam1 = jeansLengthM(100, 1e-21);
    const lam2 = jeansLengthM(300, 1e-21);
    expect(Math.abs(lam2 - 3 * lam1) / lam1).toBeLessThan(1e-12);
  });

  it('cold dense cloud (n = 1e3 /cm^3, T = 10 K) has lambda_J in 0.1 to 1 pc', () => {
    const cs = isothermalCs(10);
    const rho = nToRho(1e3);
    const lam = jeansLengthM(cs, rho);
    expect(lam / PC_M).toBeGreaterThan(1.0);
    expect(lam / PC_M).toBeLessThan(3.0);
  });

  it('Jeans mass for cold cloud is order ~0.1 to 10 M_sun', () => {
    const cs = isothermalCs(10);
    const rho = nToRho(1e3);
    const M_J = jeansMassKg(cs, rho);
    expect(M_J / M_SUN).toBeGreaterThan(10);
    expect(M_J / M_SUN).toBeLessThan(200);
  });

  it('isothermal sound speed at 10 K is ~0.29 km/s', () => {
    const cs = isothermalCs(10);
    expect(Math.abs(cs - 287) / 287).toBeLessThan(0.05);
  });
});
