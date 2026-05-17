import { describe, it, expect } from 'vitest';
import { createState, step, nusselt, RA_C, K_C, discreteRaC, linearSigma } from './sim.js';

// The playground renders the linear stability of the free-free
// Rayleigh-Benard layer; sim.js re-exports the gate-tested engine so
// these run GPU-free.
describe('rayleigh-benard-convection linear-onset invariants', () => {
  it('critical Rayleigh number is the exact free-free 27 pi^4 / 4 and converges', () => {
    expect(RA_C).toBeCloseTo(657.5113, 3);
    expect(K_C).toBeCloseTo(Math.PI / Math.SQRT2, 10);
    const e32 = Math.abs(discreteRaC(32, K_C) - RA_C) / RA_C;
    const e160 = Math.abs(discreteRaC(160, K_C) - RA_C) / RA_C;
    expect(e32).toBeLessThan(0.03);
    expect(e160).toBeLessThan(e32);
    expect(e160).toBeLessThan(2e-3);
  });

  it('k_c is the least stable mode (neutral curve minimum)', () => {
    const rac = discreteRaC(160, K_C);
    for (const k of [1.4, 1.8, 2.6, 3.2]) expect(discreteRaC(160, k)).toBeGreaterThan(rac);
  });

  it('growth rate is monotone in Ra and flips sign exactly at the critical value', () => {
    const rc = discreteRaC(96, K_C);
    expect(linearSigma(96, 0.7 * rc, 1, K_C)).toBeLessThan(linearSigma(96, 0.9 * rc, 1, K_C));
    expect(linearSigma(96, 0.9 * rc, 1, K_C)).toBeLessThan(0);
    expect(linearSigma(96, 1.1 * rc, 1, K_C)).toBeGreaterThan(0);
    expect(linearSigma(96, rc, 1, K_C)).toBeCloseTo(0, 6);
  });

  it('onset is Prandtl-independent', () => {
    const rc = discreteRaC(96, K_C);
    for (const Pr of [0.3, 1, 7]) {
      expect(linearSigma(96, rc, Pr, K_C)).toBeCloseTo(0, 6);
      expect(linearSigma(96, 0.95 * rc, Pr, K_C)).toBeLessThan(0);
      expect(linearSigma(96, 1.05 * rc, Pr, K_C)).toBeGreaterThan(0);
    }
  });

  it('conduction base state is an exact equilibrium with Nu = 1', () => {
    const s = createState(48, 32, { Ra: 0.5 * RA_C, Pr: 1 });
    for (let n = 0; n < 300; n += 1) step(s, 4e-3, { bfecc: false });
    let umax = 0;
    for (let k = 0; k < s.u.length; k += 1) umax = Math.max(umax, Math.abs(s.u[k]));
    expect(umax).toBeLessThan(1e-8);
    expect(Math.abs(nusselt(s) - 1)).toBeLessThan(1e-6);
  });

  it('deterministic linear functions', () => {
    expect(linearSigma(96, 800, 1, K_C)).toBe(linearSigma(96, 800, 1, K_C));
  });
});
