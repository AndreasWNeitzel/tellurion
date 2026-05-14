// Lane-Emden invariants.
// (a) n = 0: xi_1 = sqrt(6) ~ 2.449.
// (b) n = 1: xi_1 = pi.
// (c) n = 3: xi_1 ~ 6.897.
// (d) n = 1.5: xi_1 ~ 3.654.
// (e) Analytic vs numerical agreement at n = 0 and n = 1.

import { describe, it, expect } from 'vitest';
import { solveLaneEmden, analyticTheta, KNOWN_XI1 } from './sim.js';

describe('polytrope-lane-emden', () => {
  it('n = 0: xi_1 = sqrt(6)', () => {
    const r = solveLaneEmden(0, 1e-3);
    expect(Math.abs(r.xi1 - Math.sqrt(6)) / Math.sqrt(6)).toBeLessThan(0.01);
  });

  it('n = 1: xi_1 = pi', () => {
    const r = solveLaneEmden(1, 1e-3);
    expect(Math.abs(r.xi1 - Math.PI) / Math.PI).toBeLessThan(0.01);
  });

  it('n = 1.5: xi_1 ~ 3.654', () => {
    const r = solveLaneEmden(1.5, 1e-3);
    expect(Math.abs(r.xi1 - 3.6537) / 3.6537).toBeLessThan(0.01);
  });

  it('n = 3: xi_1 ~ 6.897', () => {
    const r = solveLaneEmden(3, 1e-3);
    expect(Math.abs(r.xi1 - 6.8969) / 6.8969).toBeLessThan(0.01);
  });

  it('analytic n = 0: theta(xi) = 1 - xi^2 / 6', () => {
    const xi = 1.5;
    expect(Math.abs(analyticTheta(0, xi) - (1 - xi * xi / 6))).toBeLessThan(1e-15);
  });

  it('analytic n = 1: theta(xi) = sin(xi) / xi', () => {
    const xi = 1.5;
    expect(Math.abs(analyticTheta(1, xi) - Math.sin(xi) / xi)).toBeLessThan(1e-12);
  });

  it('analytic n = 5: theta(xi) = 1 / sqrt(1 + xi^2 / 3)', () => {
    const xi = 2.0;
    expect(Math.abs(analyticTheta(5, xi) - 1 / Math.sqrt(1 + xi * xi / 3))).toBeLessThan(1e-12);
  });

  it('numerical n = 1 agrees with analytic sin(xi)/xi at xi = 1', () => {
    const r = solveLaneEmden(1, 1e-3);
    // Find xi closest to 1 in the trajectory.
    let idx = 0;
    for (let i = 0; i < r.xi.length; i += 1) {
      if (Math.abs(r.xi[i] - 1) < Math.abs(r.xi[idx] - 1)) idx = i;
    }
    const exact = Math.sin(1) / 1;
    expect(Math.abs(r.theta[idx] - exact)).toBeLessThan(1e-3);
  });
});
