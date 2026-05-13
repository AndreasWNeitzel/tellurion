// Coupled-springs normal-modes invariant tests.
// (a) Pure in-phase eigenmode oscillates at omega_+ = sqrt(k/m); antisymmetric amplitude stays 0.
// (b) Pure out-of-phase eigenmode oscillates at omega_- = sqrt(3k/m); symmetric amplitude stays 0.
// (c) Energy is conserved by velocity-Verlet to better than 1e-3 over 10^4 steps.
// (d) Eigenfrequencies match analytic expressions exactly.
// (e) Numerical state agrees with analytic decomposition within 1e-3 at t = 2.

import { describe, it, expect } from 'vitest';
import {
  createSprings, stepVerlet, totalEnergy, analyticState,
  OMEGA_PLUS, OMEGA_MINUS, purePlusMode, pureMinusMode, modeAmplitudes,
} from './sim.js';

describe('Springs: in-phase eigenmode', () => {
  it('omega_+ = sqrt(k/m), antisymmetric amplitude stays 0 over one period', () => {
    const s = purePlusMode(0.4);
    const dt = 0.005;
    const N = Math.round(2 * Math.PI / OMEGA_PLUS / dt);
    for (let i = 0; i < N; i += 1) stepVerlet(s, dt);
    expect(Math.abs(s.x1 - 0.4)).toBeLessThan(1e-3);
    expect(Math.abs(s.x2 - 0.4)).toBeLessThan(1e-3);
    const A = modeAmplitudes(s);
    expect(Math.abs(A.Aminus)).toBeLessThan(1e-3);
  });
});

describe('Springs: out-of-phase eigenmode', () => {
  it('omega_- = sqrt(3 k/m), symmetric amplitude stays 0 over one period', () => {
    const s = pureMinusMode(0.4);
    const dt = 0.005;
    const N = Math.round(2 * Math.PI / OMEGA_MINUS / dt);
    for (let i = 0; i < N; i += 1) stepVerlet(s, dt);
    expect(Math.abs(s.x1 - 0.4)).toBeLessThan(1e-3);
    expect(Math.abs(s.x2 + 0.4)).toBeLessThan(1e-3);
    const A = modeAmplitudes(s);
    expect(Math.abs(A.Aplus)).toBeLessThan(1e-3);
  });
});

describe('Springs: energy conservation', () => {
  it('|delta E / E_0| < 1e-3 over 10^4 steps', () => {
    const s = createSprings({ x1_0: 0.6, x2_0: 0.1 });
    const E0 = totalEnergy(s);
    for (let i = 0; i < 10_000; i += 1) stepVerlet(s, 0.005);
    const Ef = totalEnergy(s);
    expect(Math.abs((Ef - E0) / E0)).toBeLessThan(1e-3);
  });
});

describe('Springs: analytic frequencies exact', () => {
  it('OMEGA_PLUS = 1, OMEGA_MINUS = sqrt(3) (k = m = 1)', () => {
    expect(OMEGA_PLUS).toBeCloseTo(1.0, 12);
    expect(OMEGA_MINUS).toBeCloseTo(Math.sqrt(3), 12);
  });
});

describe('Springs: numerical vs analytic', () => {
  it('integrator agrees with analytic decomposition within 1e-3 at t = 2', () => {
    const s0 = createSprings({ x1_0: 0.5, x2_0: -0.2, v1_0: 0.1, v2_0: 0 });
    const s  = createSprings({ x1_0: 0.5, x2_0: -0.2, v1_0: 0.1, v2_0: 0 });
    const dt = 0.001;
    const T = 2.0;
    const N = Math.round(T / dt);
    for (let i = 0; i < N; i += 1) stepVerlet(s, dt);
    const a = analyticState(s0, T);
    expect(Math.abs(s.x1 - a.x1)).toBeLessThan(1e-3);
    expect(Math.abs(s.x2 - a.x2)).toBeLessThan(1e-3);
  });
});
