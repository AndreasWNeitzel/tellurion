// Damped-driven oscillator invariants.
// (a) Resonance peak at omega_r = omega_0 sqrt(1 - 2 (gamma / omega_0)^2).
// (b) Q = omega_0 / (2 gamma).
// (c) Static limit: A(0) = F_0 / omega_0^2.
// (d) High-frequency limit: A -> F_0 / omega^2.
// (e) Numerical steady-state amplitude matches analytic within 5 percent.
// (f) Phase at resonance: phi(omega_0) = pi / 2.

import { describe, it, expect } from 'vitest';
import {
  steadyAmplitude, steadyPhase, qualityFactor, resonancePeak,
  createDriven, stepDriven, OMEGA0, F0,
} from './sim.js';

describe('Damped-driven: resonance peak position', () => {
  it('omega_r = omega_0 sqrt(1 - 2 (gamma / omega_0)^2)', () => {
    for (const gamma of [0.05, 0.1, 0.2]) {
      const peak = resonancePeak(gamma);
      const expected = OMEGA0 * Math.sqrt(1 - 2 * (gamma / OMEGA0) ** 2);
      expect(peak).toBeCloseTo(expected, 12);
    }
  });
});

describe('Damped-driven: Q factor', () => {
  it('Q = omega_0 / (2 gamma)', () => {
    for (const gamma of [0.05, 0.1, 0.2]) {
      expect(qualityFactor(gamma)).toBeCloseTo(OMEGA0 / (2 * gamma), 12);
    }
  });
});

describe('Damped-driven: static limit', () => {
  it('A(0) = F_0 / omega_0^2', () => {
    expect(steadyAmplitude(0, 0.1)).toBeCloseTo(F0 / (OMEGA0 * OMEGA0), 12);
  });
});

describe('Damped-driven: high-frequency limit', () => {
  it('A(omega) -> F_0 / omega^2 as omega -> infinity', () => {
    const omega = 20;
    expect(steadyAmplitude(omega, 0.1)).toBeCloseTo(F0 / (omega * omega), 3);
  });
});

describe('Damped-driven: numerical steady-state amplitude', () => {
  it('|x|_max matches steady amplitude within 5 percent (omega = 1.0, gamma = 0.1)', () => {
    const omega = 1.0, gamma = 0.1;
    const A_analytic = steadyAmplitude(omega, gamma);
    const s = createDriven({ omega, gamma });
    const dt = 0.01;
    const NWarm = Math.round(qualityFactor(gamma) * 2 * Math.PI / omega / dt);
    for (let i = 0; i < NWarm; i += 1) stepDriven(s, dt);
    const N = Math.round(2 * Math.PI / omega / dt);
    let peak = 0;
    for (let i = 0; i < 3 * N; i += 1) {
      stepDriven(s, dt);
      if (Math.abs(s.x) > peak) peak = Math.abs(s.x);
    }
    expect(Math.abs((peak - A_analytic) / A_analytic)).toBeLessThan(0.05);
  }, 30_000);
});

describe('Damped-driven: phase at resonance', () => {
  it('phi(omega_0) = pi / 2 within 1e-12', () => {
    expect(steadyPhase(OMEGA0, 0.1)).toBeCloseTo(Math.PI / 2, 12);
  });
});
