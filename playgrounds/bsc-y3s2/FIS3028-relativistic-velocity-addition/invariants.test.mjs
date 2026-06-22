// Invariants for relativistic velocity addition: the sub-light bound, the invariance of
// light, rapidity additivity, commutativity, the inverse (subtracting a velocity), and
// the Galilean limit at small speeds.

import { describe, it, expect } from 'vitest';
import { addVelocity, galilean, rapidity, velocityFromRapidity } from './sim.js';

describe('Sub-light bound', () => {
  it('the sum of two sub-light velocities stays below c', () => {
    for (const u of [-0.9, -0.5, 0.3, 0.9, 0.99]) for (const v of [-0.9, 0.5, 0.9, 0.99]) { const w = addVelocity(u, v); expect(Math.abs(w)).toBeLessThan(1); }
  });
  it('equal high speeds still fall short of c', () => {
    expect(addVelocity(0.9, 0.9)).toBeCloseTo(0.9945, 3);
    expect(addVelocity(0.99, 0.99)).toBeLessThan(1);
  });
});

describe('Light is invariant', () => {
  it('adding any velocity to c gives c', () => {
    for (const u of [-0.8, 0, 0.5, 0.99]) { expect(addVelocity(u, 1)).toBeCloseTo(1, 12); expect(addVelocity(1, u)).toBeCloseTo(1, 12); }
  });
});

describe('Rapidity adds linearly', () => {
  it('phi(w) = phi(u) + phi(v)', () => {
    for (const [u, v] of [[0.5, 0.6], [-0.3, 0.8], [0.9, 0.9]]) { const w = addVelocity(u, v); expect(rapidity(w)).toBeCloseTo(rapidity(u) + rapidity(v), 9); }
  });
  it('velocity and rapidity are inverse via tanh', () => {
    for (const b of [-0.7, 0.2, 0.95]) expect(velocityFromRapidity(rapidity(b))).toBeCloseTo(b, 9);
  });
});

describe('Symmetry and inverse', () => {
  it('addition is commutative', () => {
    expect(addVelocity(0.4, 0.7)).toBeCloseTo(addVelocity(0.7, 0.4), 12);
  });
  it('subtracting the added velocity recovers the original', () => {
    const u = 0.6, v = 0.5; expect(addVelocity(addVelocity(u, v), -v)).toBeCloseTo(u, 9);
  });
});

describe('Galilean limit', () => {
  it('reduces to u + v at small speeds', () => {
    expect(addVelocity(0.001, 0.002)).toBeCloseTo(galilean(0.001, 0.002), 7);
  });
});
