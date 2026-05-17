import { describe, it, expect } from 'vitest';
import {
  createState, step, nusselt,
  RA_C, K_C, discreteRaC, linearSigma,
} from '../../shared/js/engine/boussinesq-2d-cpu.js';

// The shipped playground is the linear-stability visualization (the
// neutral curve and the critical roll mode), so the gate is the
// rigorous linear onset plus the exact conduction equilibrium. The
// nonlinear DNS solver exists in the engine but is not the shipped
// path and is not gate-load-bearing.
describe('boussinesq-2d-cpu linear-onset invariants', () => {
  it('free-free critical Rayleigh number is 27 pi^4 / 4 and converges with resolution', () => {
    expect(RA_C).toBeCloseTo(657.5113, 3);
    expect(K_C).toBeCloseTo(Math.PI / Math.SQRT2, 10);
    const e32 = Math.abs(discreteRaC(32, K_C) - RA_C) / RA_C;
    const e96 = Math.abs(discreteRaC(96, K_C) - RA_C) / RA_C;
    const e160 = Math.abs(discreteRaC(160, K_C) - RA_C) / RA_C;
    expect(e32).toBeLessThan(0.03);
    expect(e96).toBeLessThan(e32);            // monotone convergence
    expect(e160).toBeLessThan(e96);
    expect(e160).toBeLessThan(2e-3);
  });

  it('the marginal curve Ra(k) = (k^2+pi^2)^3/k^2 is minimised at k_c (k_c is the least stable mode)', () => {
    const rac = discreteRaC(160, K_C);
    for (const k of [1.4, 1.8, 2.6, 3.2]) {
      expect(discreteRaC(160, k)).toBeGreaterThan(rac);   // any other k needs a higher Ra
    }
  });

  it('linear growth rate is monotone in Ra and changes sign exactly at the critical value', () => {
    const rc = discreteRaC(96, K_C);
    const s07 = linearSigma(96, 0.7 * rc, 1, K_C);
    const s09 = linearSigma(96, 0.9 * rc, 1, K_C);
    const s11 = linearSigma(96, 1.1 * rc, 1, K_C);
    const s15 = linearSigma(96, 1.5 * rc, 1, K_C);
    expect(s07).toBeLessThan(s09);
    expect(s09).toBeLessThan(0);              // subcritical: decay
    expect(s09).toBeLessThan(s11);
    expect(s11).toBeGreaterThan(0);           // supercritical: growth
    expect(s11).toBeLessThan(s15);
    expect(linearSigma(96, rc, 1, K_C)).toBeCloseTo(0, 6);
  });

  it('onset is Prandtl-independent (Chandrasekhar): same marginal Ra for Pr in {0.3, 1, 7}', () => {
    const rc = discreteRaC(96, K_C);
    for (const Pr of [0.3, 1, 7]) {
      expect(linearSigma(96, rc, Pr, K_C)).toBeCloseTo(0, 6);
      expect(linearSigma(96, 0.95 * rc, Pr, K_C)).toBeLessThan(0);
      expect(linearSigma(96, 1.05 * rc, Pr, K_C)).toBeGreaterThan(0);
    }
  });

  it('the conduction base state (theta = 0, u = 0) is an exact discrete equilibrium with Nu = 1', () => {
    const s = createState(48, 32, { Ra: 0.5 * RA_C, Pr: 1 });
    for (let n = 0; n < 400; n += 1) step(s, 4e-3, { bfecc: false });
    let umax = 0;
    for (let k = 0; k < s.u.length; k += 1) umax = Math.max(umax, Math.abs(s.u[k]));
    for (let k = 0; k < s.v.length; k += 1) umax = Math.max(umax, Math.abs(s.v[k]));
    expect(umax).toBeLessThan(1e-8);
    expect(Math.abs(nusselt(s) - 1)).toBeLessThan(1e-6);
  });

  it('linear functions are pure and deterministic', () => {
    expect(discreteRaC(96, K_C)).toBe(discreteRaC(96, K_C));
    expect(linearSigma(96, 800, 1, K_C)).toBe(linearSigma(96, 800, 1, K_C));
  });
});
