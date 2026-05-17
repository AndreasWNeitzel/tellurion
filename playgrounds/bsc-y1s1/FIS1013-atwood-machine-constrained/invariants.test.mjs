// Atwood machine: energy conservation, the massless-pulley classical
// limit, and the tension split for a massive pulley.

import { describe, it, expect } from 'vitest';
import { createAtwood, step, energy, acceleration, tensions, pulleyInertia, G } from './sim.js';

describe('atwood-machine-constrained invariants', () => {
  it('total mechanical energy conserved within 1e-6 over 1e4 steps', () => {
    const s = createAtwood({ m1: 3, m2: 2, M: 1.5, R: 0.4, kind: 'disk' });
    const E0 = energy(s);
    for (let i = 0; i < 10000; i += 1) step(s, 0.001);
    expect(Math.abs(energy(s) - E0)).toBeLessThan(1e-6);
  });

  it('massless pulley recovers the classical result within 0.1%', () => {
    const p = { m1: 3, m2: 2, M: 0, R: 0.4, kind: 'disk' };
    const classical = (p.m1 - p.m2) * G / (p.m1 + p.m2);
    expect(Math.abs(acceleration(p) - classical) / classical).toBeLessThan(1e-3);
  });

  it('tensions are equal for a massless pulley, unequal for a massive one', () => {
    const massless = tensions({ m1: 3, m2: 2, M: 0, R: 0.4, kind: 'disk' });
    expect(Math.abs(massless.T1 - massless.T2)).toBeLessThan(1e-9);
    const massive = tensions({ m1: 3, m2: 2, M: 4, R: 0.4, kind: 'disk' });
    expect(massive.T1).toBeGreaterThan(massive.T2);
    // Net torque balances the rim: (T1 - T2) R = I a / R.
    const I = pulleyInertia(4, 0.4, 'disk');
    expect(Math.abs((massive.T1 - massive.T2) * 0.4 - I * massive.a / 0.4)).toBeLessThan(1e-9);
  });

  it('equal masses give zero acceleration (static)', () => {
    expect(Math.abs(acceleration({ m1: 2.5, m2: 2.5, M: 1, R: 0.4, kind: 'disk' }))).toBeLessThan(1e-12);
  });

  it('a ring pulley has twice the inertia of a disk and brakes harder', () => {
    expect(pulleyInertia(3, 0.5, 'ring')).toBeCloseTo(2 * pulleyInertia(3, 0.5, 'disk'), 12);
    const disk = acceleration({ m1: 3, m2: 1, M: 6, R: 0.4, kind: 'disk' });
    const ring = acceleration({ m1: 3, m2: 1, M: 6, R: 0.4, kind: 'ring' });
    expect(ring).toBeLessThan(disk);
  });

  it('|a| < g always (gravity bounds the acceleration)', () => {
    for (const m1 of [1, 5, 20]) for (const m2 of [1, 3, 9]) {
      expect(Math.abs(acceleration({ m1, m2, M: 1, R: 0.4, kind: 'disk' }))).toBeLessThan(G);
    }
  });
});
