// Coupled pendulums invariants.
// (a) omega_sym = sqrt(g/L).
// (b) omega_anti = sqrt(g/L + 2 k d^2 / (m L^2)).
// (c) Symmetric IC stays in symmetric mode: theta1 = theta2 throughout.
// (d) Asymmetric IC produces beating with T_beat = 2 pi / (omega_- - omega_+).
// (e) Energy conservation: total energy constant to 1e-6 relative over 10 s.

import { describe, it, expect } from 'vitest';
import {
  createCoupled, stepCoupled,
  omegaSym, omegaAnti, beatPeriod, energy, G,
} from './sim.js';

function run(s, T, dt = 1e-3) {
  const N = Math.round(T / dt);
  for (let i = 0; i < N; i += 1) stepCoupled(s, dt);
}

describe('coupled-pendulums-normal-modes', () => {
  it('omega_sym equals sqrt(g/L)', () => {
    expect(Math.abs(omegaSym(1.0) - Math.sqrt(G / 1.0))).toBeLessThan(1e-12);
  });

  it('omega_anti equals sqrt(g/L + 2 k d^2 / (m L^2))', () => {
    const expected = Math.sqrt(G / 1.0 + 2 * 4.0 * 0.25 / (1.0 * 1.0));
    expect(Math.abs(omegaAnti(1.0, 1.0, 4.0, 0.5) - expected)).toBeLessThan(1e-12);
  });

  it('symmetric IC stays symmetric: theta1 = theta2 throughout', () => {
    const s = createCoupled({ theta1: 0.1, theta2: 0.1 });
    run(s, 5);
    expect(Math.abs(s.theta1 - s.theta2)).toBeLessThan(1e-6);
  });

  it('antisymmetric IC stays antisymmetric: theta1 = -theta2', () => {
    const s = createCoupled({ theta1: 0.1, theta2: -0.1 });
    run(s, 5);
    expect(Math.abs(s.theta1 + s.theta2)).toBeLessThan(1e-6);
  });

  it('beat period matches 2 pi / (omega_- - omega_+)', () => {
    const L = 1.0, m = 1.0, k = 4.0, d = 0.5;
    const expected = 2 * Math.PI / (omegaAnti(L, m, k, d) - omegaSym(L));
    const Tb = beatPeriod(L, m, k, d);
    expect(Math.abs(Tb - expected)).toBeLessThan(1e-12);
  });

  it('energy conservation: total constant to 1e-6 relative over 10 s', () => {
    const s = createCoupled({ theta1: 0.2, theta2: 0 });
    const E0 = energy(s).total;
    run(s, 10);
    const E1 = energy(s).total;
    expect(Math.abs(E1 - E0) / E0).toBeLessThan(1e-6);
  });

  it('beating: half beat period transfers full envelope to pendulum 2', () => {
    // The instantaneous theta2 at t = T_beat/2 oscillates with the fast
    // carrier; check the envelope peak over one fast period instead.
    const L = 1, m = 1, k = 4, d = 0.5;
    const s = createCoupled({ L, m, k, d, theta1: 0.1, theta2: 0 });
    const Tb = beatPeriod(L, m, k, d);
    const Tfast = 2 * Math.PI / Math.sqrt(G / L);
    run(s, Math.max(0, Tb / 2 - Tfast));
    let amp2 = 0;
    const dt = 1e-3;
    const N = Math.round(Tfast / dt);
    for (let i = 0; i < N; i += 1) {
      stepCoupled(s, dt);
      amp2 = Math.max(amp2, Math.abs(s.theta2));
    }
    expect(amp2).toBeGreaterThan(0.08);
  });

  it('zero coupling (k = 0): pendulums decouple, no beating', () => {
    const s = createCoupled({ k: 0, theta1: 0.1, theta2: 0 });
    run(s, 5);
    // theta2 should stay near zero (no energy transfer).
    expect(Math.abs(s.theta2)).toBeLessThan(1e-6);
  });
});
