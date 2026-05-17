// Lagrangian sandbox: the small-amplitude pendulum period, energy
// conservation under RK4 for every system, Noether angular momentum
// for the rotationally symmetric ones, the Euler-Lagrange equation
// matching the closed form, the double-pendulum normal modes, and
// time-reversibility. Integration is the verified shared RK4 engine.

import { describe, it, expect } from 'vitest';
import { create, step } from '../../../shared/js/engine/ode-rk.js';
import {
  makeRhs, energy, angularMomentum, pendulumPeriodSmall,
  doublePendulumModes,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b)).toBeLessThan(t);
const rel = (a, b, t) => expect(Math.abs(a - b) / Math.abs(b)).toBeLessThan(t);

function run(system, p, y0, T, dt) {
  const inst = create({ state: Float64Array.from(y0), rhs: makeRhs(system, p), method: 'rk4' });
  const n = Math.round(T / dt);
  for (let i = 0; i < n; i += 1) step(inst, dt);
  return Array.from(inst.y);
}

describe('lagrangian-field-sandbox invariants', () => {
  it('small-amplitude pendulum period = 2 pi sqrt(l/g) within 0.5%', () => {
    const p = { m: 1, l: 1.3, g: 9.81 };
    const A = 0.05;                                    // 3 deg, near-harmonic
    const inst = create({ state: Float64Array.from([A, 0]), rhs: makeRhs('pendulum', p), method: 'rk4' });
    const dt = 1e-4; let prev = A, tPrev = 0, period = 0;
    for (let i = 1; i < 400000; i += 1) {
      const a0 = inst.y[0]; step(inst, dt); const a1 = inst.y[0];
      if (a0 > 0 && a1 <= 0) {                          // downward zero crossing
        const tc = (i - a1 / (a1 - a0)) * dt;
        if (tPrev > 0) { period = tc - tPrev; break; }
        tPrev = tc;
      }
      prev = a1;
    }
    rel(period, pendulumPeriodSmall(p.l, p.g), 5e-3);
  });

  it('pendulum: Euler-Lagrange thdd = -(g/l) sin th', () => {
    const p = { m: 1, l: 0.8, g: 9.81 };
    const out = new Float64Array(2);
    makeRhs('pendulum', p)(0, [0.6, 1.2], out);
    close(out[0], 1.2, 1e-12);                          // dth/dt = thd
    close(out[1], -(p.g / p.l) * Math.sin(0.6), 1e-12); // EL acceleration
  });

  it('energy is conserved by RK4 for every system', () => {
    const cases = [
      ['pendulum', { m: 1, l: 1, g: 9.81 }, [2.0, 0], 20, 1e-3],
      ['double', { m1: 1, m2: 1, L1: 1, L2: 1, g: 9.81 }, [0.5, 0.3, 0, 0], 15, 5e-4],
      ['spring', { m: 1, k: 40, l0: 1, g: 9.81 }, [1.2, 0.4, 0, 0], 20, 1e-3],
      ['kepler', { mu: 1 }, [1, 0, 0, 0.9], 30, 1e-3],
    ];
    for (const [sys, p, y0, T, dt] of cases) {
      const E0 = energy(sys, y0, p);
      const yf = run(sys, p, y0, T, dt);
      const Ef = energy(sys, yf, p);
      expect(Math.abs((Ef - E0) / (Math.abs(E0) || 1))).toBeLessThan(1e-3);
    }
  });

  it('Noether: rotational symmetry <=> angular momentum conserved', () => {
    // Kepler is central -> L conserved.
    const yk = [1, 0, 0.1, 0.95];
    const L0 = angularMomentum('kepler', yk);
    rel(angularMomentum('kepler', run('kepler', { mu: 1 }, yk, 25, 1e-3)), L0, 1e-4);
    // Spring with NO gravity is rotationally symmetric -> L conserved.
    const ys = [1.1, 0.0, 0.0, 0.8];
    const noG = angularMomentum('spring', run('spring', { m: 1, k: 30, l0: 1, g: 0 }, ys, 20, 5e-4));
    rel(noG, angularMomentum('spring', ys), 1e-4);
    // Turn gravity on: it picks a direction, breaks the symmetry, so
    // angular momentum is NOT conserved (Noether's converse).
    const withG = angularMomentum('spring', run('spring', { m: 1, k: 30, l0: 1, g: 9.81 }, ys, 20, 5e-4));
    expect(Math.abs(withG - angularMomentum('spring', ys))).toBeGreaterThan(1e-2);
    expect(angularMomentum('pendulum', [1, 1])).toBeNull();
  });

  it('double pendulum: small-amplitude normal-mode frequencies', () => {
    const L = 1, g = 9.81;
    const [wLo, wHi] = doublePendulumModes(L, g);
    close(wLo, Math.sqrt((2 - Math.SQRT2) * g / L), 1e-12);
    close(wHi, Math.sqrt((2 + Math.SQRT2) * g / L), 1e-12);
    expect(wHi).toBeGreaterThan(wLo);
    // tiny in-phase start stays bounded near the slow mode period
    const yf = run('double', { m1: 1, m2: 1, L1: L, L2: L, g }, [0.01, 0.01, 0, 0], 8, 1e-4);
    for (const v of yf) expect(Math.abs(v)).toBeLessThan(0.2);   // small stays small
  });

  it('integration is time-reversible (RK4)', () => {
    const p = { m: 1, l: 1, g: 9.81 }, y0 = [1.0, 0.4];
    const inst = create({ state: Float64Array.from(y0), rhs: makeRhs('pendulum', p), method: 'rk4' });
    const dt = 1e-3, n = 4000;
    for (let i = 0; i < n; i += 1) step(inst, dt);
    for (let i = 0; i < n; i += 1) step(inst, -dt);
    close(inst.y[0], y0[0], 1e-6); close(inst.y[1], y0[1], 1e-6);
  });

  it('pendulum: libration below, rotation above the separatrix', () => {
    const p = { m: 1, l: 1, g: 9.81 };
    const Esep = p.m * p.g * p.l;                       // E at the inverted top
    // libration: start with E < Esep -> theta stays bounded, sign of
    // thd flips
    const lib = run('pendulum', p, [0.5, 0], 12, 1e-3);
    expect(Math.abs(lib[0])).toBeLessThan(Math.PI);
    // rotation: large initial speed, E > Esep -> theta unbounded,
    // thd keeps its sign
    const inst = create({ state: Float64Array.from([0, 8]), rhs: makeRhs('pendulum', p), method: 'rk4' });
    let minW = Infinity;
    for (let i = 0; i < 4000; i += 1) { step(inst, 1e-3); minW = Math.min(minW, inst.y[1]); }
    expect(minW).toBeGreaterThan(0);                    // never reverses: rotating
    expect(energy('pendulum', [0, 8], p)).toBeGreaterThan(Esep);
  });

  it('determinism: identical state from identical initial conditions', () => {
    const p = { m1: 1, m2: 2, L1: 1, L2: 0.7, g: 9.81 };
    const a = run('double', p, [1.0, -0.5, 0, 0], 6, 1e-3);
    const b = run('double', p, [1.0, -0.5, 0, 0], 6, 1e-3);
    expect(a).toEqual(b);
  });
});
