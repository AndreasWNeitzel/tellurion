// Torque-free rigid body: the conserved quantities and the
// intermediate-axis (Dzhanibekov / tennis-racket) instability.

import { describe, it, expect } from 'vitest';
import { createRigidBody, step, energy, angularMomentumSq } from './sim.js';

describe('rigid-body-euler-3d invariants', () => {
  it('rotational energy is conserved within 1e-4 over 1e4 steps', () => {
    const b = createRigidBody({ I: [2, 3, 4], omega: [1.1, 0.7, 0.3] });
    const E0 = energy(b);
    for (let i = 0; i < 10000; i += 1) step(b, 0.005);
    expect(Math.abs(energy(b) - E0) / E0).toBeLessThan(1e-4);
  });

  it('|L|^2 is conserved within 1e-4 over 1e4 steps', () => {
    const b = createRigidBody({ I: [2, 3, 4], omega: [1.1, 0.7, 0.3] });
    const L0 = angularMomentumSq(b);
    for (let i = 0; i < 10000; i += 1) step(b, 0.005);
    expect(Math.abs(angularMomentumSq(b) - L0) / L0).toBeLessThan(1e-4);
  });

  it('quaternion stays unit-norm', () => {
    const b = createRigidBody({ I: [1, 2, 3], omega: [0.3, 2.0, 0.1] });
    for (let i = 0; i < 5000; i += 1) step(b, 0.01);
    const n = Math.hypot(...b.q);
    expect(Math.abs(n - 1)).toBeLessThan(1e-8);
  });

  it('intermediate-axis spin flips (Dzhanibekov) within 5000 steps', () => {
    const b = createRigidBody({ I: [1, 2, 3], omega: [0.02, 5.0, 0.02] });
    let flipped = false;
    for (let i = 0; i < 5000; i += 1) { step(b, 0.005); if (b.w[1] < 0) { flipped = true; break; } }
    expect(flipped).toBe(true);
  });

  it('major-axis spin is stable (no flip)', () => {
    const b = createRigidBody({ I: [1, 2, 3], omega: [0.02, 0.02, 5.0] });
    let minW3 = Infinity;
    for (let i = 0; i < 5000; i += 1) { step(b, 0.005); minW3 = Math.min(minW3, b.w[2]); }
    expect(minW3).toBeGreaterThan(4.5);
  });
});
