// Invariants for the LR transient: the time constant, the rise to 0.632 at tau,
// Kirchhoff's voltage law, the integrated current matching the closed form, and
// the energy balance on decay.

import { describe, it, expect } from 'vitest';
import { timeConstant, steadyCurrent, currentRise, backEMF, energy, createState, step } from './sim.js';

describe('Time constant and the rise', () => {
  it('tau = L/R and the current reaches 0.632 of steady at t = tau', () => {
    const V = 4, R = 2, L = 3; const tau = timeConstant(L, R);
    expect(tau).toBeCloseTo(1.5, 9);
    expect(currentRise(V, R, L, tau) / steadyCurrent(V, R)).toBeCloseTo(1 - 1 / Math.E, 6);
  });
  it('the current approaches V/R at long times', () => {
    expect(currentRise(5, 2, 1, 100)).toBeCloseTo(2.5, 6);
  });
});

describe('Kirchhoff voltage law', () => {
  it('V_R + V_L = V at every instant during the rise', () => {
    const V = 4, R = 2, L = 1.5;
    for (const t of [0.1, 0.5, 1.5, 4]) { const I = currentRise(V, R, L, t); const VL = backEMF(V, R, I); expect(R * I + VL).toBeCloseTo(V, 9); }
  });
});

describe('Integrated current matches the closed form', () => {
  it('backward-Euler rise tracks (V/R)(1 - e^{-t/tau})', () => {
    const p = { V: 4, R: 2, L: 1.5, on: true }; const s = createState(0); const dt = 0.0005;
    for (let i = 0; i < 6000; i += 1) step(s, dt, p);     // t = 3 s = 2 tau
    expect(s.I).toBeCloseTo(currentRise(p.V, p.R, p.L, s.t), 2);
  });
});

describe('Energy stored and dissipated', () => {
  it('steady energy is (1/2) L (V/R)^2', () => {
    expect(energy(2, steadyCurrent(6, 3))).toBeCloseTo(0.5 * 2 * 4, 9);
  });
  it('on decay the heat dissipated equals the initial stored energy', () => {
    const p = { V: 0, R: 2, L: 1.5, on: false }; const I0 = 2; const s = createState(I0); const dt = 0.0005;
    for (let i = 0; i < 40000; i += 1) step(s, dt, p);    // decay to ~0
    expect(s.heat).toBeCloseTo(energy(p.L, I0), 2);
    expect(s.I).toBeLessThan(1e-3);
  });
});
