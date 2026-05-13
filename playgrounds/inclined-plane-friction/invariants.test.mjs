// Inclined-plane friction invariants.
// (a) Critical angle theta_c = atan(mu_s) within 1e-12.
// (b) Below the critical angle (tan theta < mu_s) the block does not move.
// (c) Above the critical angle, kinematics agrees with x(t) = a t^2 / 2.
// (d) Velocity agrees with v(t) = a t.
// (e) Marginal kinetic friction (mu_K = tan(theta) - epsilon) gives near-zero accel.
// (f) Energy budget closes: KE + PE + W_friction = M G h_0 to 1e-8.

import { describe, it, expect } from 'vitest';
import {
  createBlock, stepBlock,
  criticalAngle, kineticAcceleration,
  analyticPosition, analyticVelocity, energyBudget,
  G, M,
} from './sim.js';

describe('inclined-plane-friction', () => {
  it('static threshold matches theta_c = atan(mu_s)', () => {
    const muS = 0.4;
    const tc = criticalAngle(muS);
    expect(Math.abs(Math.tan(tc) - muS)).toBeLessThan(1e-12);
  });

  it('block stays at rest when theta < theta_c', () => {
    const s = createBlock({ theta: 0.1, muS: 0.4, muK: 0.3 });
    for (let i = 0; i < 5000; i += 1) stepBlock(s, 0.001);
    expect(s.moving).toBe(false);
    expect(s.x).toBeCloseTo(0, 12);
    expect(s.v).toBeCloseTo(0, 12);
  });

  it('block slides when theta > theta_c', () => {
    const s = createBlock({ theta: 0.6, muS: 0.4, muK: 0.3 });
    for (let i = 0; i < 100; i += 1) stepBlock(s, 0.001);
    expect(s.moving).toBe(true);
    expect(s.v).toBeGreaterThan(0);
    expect(s.x).toBeGreaterThan(0);
  });

  it('position matches x(t) = 0.5 a t^2 closed form to 1e-3', () => {
    const theta = 0.6, muS = 0.4, muK = 0.3;
    const s = createBlock({ theta, muS, muK, slopeLength: 1000 });
    const dt = 1e-4;
    const T = 0.5;
    const nSteps = Math.round(T / dt);
    for (let i = 0; i < nSteps; i += 1) stepBlock(s, dt);
    const xa = analyticPosition(theta, muK, s.t);
    const va = analyticVelocity(theta, muK, s.t);
    expect(Math.abs(s.x - xa) / xa).toBeLessThan(1e-3);
    expect(Math.abs(s.v - va) / va).toBeLessThan(1e-3);
  });

  it('near-balanced kinetic friction yields negligible acceleration', () => {
    const theta = 0.4;
    const muK = Math.tan(theta) - 1e-6;
    const muS = muK - 1e-3;
    const s = createBlock({ theta, muS, muK });
    for (let i = 0; i < 1000; i += 1) stepBlock(s, 0.01);
    const a = kineticAcceleration(theta, muK);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(1e-4);
    expect(s.x).toBeLessThan(1e-3);
  });

  it('energy budget closes within 1e-8 relative when block slides', () => {
    const theta = 0.7, muS = 0.4, muK = 0.3;
    const slopeLength = 5.0;
    const s = createBlock({ theta, muS, muK, slopeLength });
    const E0 = M * G * slopeLength * Math.sin(theta);
    const dt = 1e-4;
    for (let i = 0; i < 5000; i += 1) stepBlock(s, dt);
    const { ke, pe, wFriction, total } = energyBudget(s);
    expect(Math.abs(total - E0) / E0).toBeLessThan(1e-8);
  });
});
