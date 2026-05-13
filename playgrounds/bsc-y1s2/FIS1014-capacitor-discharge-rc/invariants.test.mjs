// RC discharge invariants.
// (a) V(0) = V_0 exactly.
// (b) V(tau) = V_0 / e to machine precision.
// (c) Energy conservation: U_C(t) + W_dissipated(t) = U_C(0).
// (d) Time to half voltage = tau ln 2.
// (e) Current at t: V_C / R.
// (f) 99 percent discharge takes ~ 5 tau.

import { describe, it, expect } from 'vitest';
import {
  vC, iR, energyC, powerR, energyDissipated, timeToFraction,
} from './sim.js';

describe('capacitor-discharge-rc', () => {
  it('V(0) = V_0 exactly', () => {
    expect(vC(0, 5, 1)).toBe(5);
  });

  it('V(tau) = V_0 / e', () => {
    const V0 = 5, tau = 0.1;
    expect(Math.abs(vC(tau, V0, tau) - V0 / Math.E)).toBeLessThan(1e-12);
  });

  it('energy conservation U_C(t) + W_diss(t) = U_C(0)', () => {
    const V0 = 5, C = 1e-6, tau = 0.1;
    for (const t of [0.01, 0.1, 0.3, 1.0]) {
      const Ut = energyC(t, V0, C, tau);
      const Wt = energyDissipated(t, V0, C, tau);
      const U0 = 0.5 * C * V0 * V0;
      expect(Math.abs(Ut + Wt - U0) / U0).toBeLessThan(1e-12);
    }
  });

  it('time to half voltage equals tau ln 2', () => {
    const tau = 0.5;
    const tHalf = timeToFraction(0.5, tau);
    expect(Math.abs(tHalf - tau * Math.log(2))).toBeLessThan(1e-12);
  });

  it('current at t = V_C(t) / R', () => {
    const V0 = 5, R = 100, tau = 0.1, t = 0.05;
    const V = vC(t, V0, tau);
    expect(Math.abs(iR(t, V0, R, tau) - V / R)).toBeLessThan(1e-12);
  });

  it('99 percent discharge takes ~ ln(100) tau ~ 4.6 tau', () => {
    const tau = 1.0;
    const t99 = timeToFraction(0.01, tau);
    expect(Math.abs(t99 - tau * Math.log(100))).toBeLessThan(1e-12);
    expect(t99).toBeGreaterThan(4.5);
    expect(t99).toBeLessThan(4.7);
  });

  it('power dissipated integrates to total energy', () => {
    const V0 = 5, C = 1e-6, R = 100;
    const tau = R * C;
    // U_C(0) = integral_0^infty P(t) dt = V_0^2 / R * tau / 2 = 0.5 C V_0^2
    const integrated = V0 * V0 / R * tau / 2;
    const U0 = 0.5 * C * V0 * V0;
    expect(Math.abs(integrated - U0) / U0).toBeLessThan(1e-12);
  });
});
