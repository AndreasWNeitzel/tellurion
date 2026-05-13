// Pendulum-on-cart invariants.
// (a) Energy conservation under RK4.
// (b) Horizontal-momentum conservation.
// (c) Theta bounded for moderate IC.
// (d) Equilibrium is a fixed point.
// (e) Small-angle finite period.

import { describe, it, expect } from 'vitest';
import { createCart, stepCart, energy, horizontalMomentum } from './sim.js';

describe('Cart pendulum: energy conservation', () => {
  it('|delta E / E_0| < 1e-3 over 10^4 steps', () => {
    const s = createCart({ theta: 0.5, thetadot: 0 });
    const E0 = energy(s);
    for (let i = 0; i < 10_000; i += 1) stepCart(s, 0.005);
    expect(Math.abs((energy(s) - E0) / E0)).toBeLessThan(1e-3);
  }, 30_000);
});

describe('Cart pendulum: horizontal-momentum conservation', () => {
  it('|delta p| < 1e-8 over 5000 steps', () => {
    const s = createCart({ theta: 0.8, xdot: 0.3, thetadot: 0 });
    const p0 = horizontalMomentum(s);
    for (let i = 0; i < 5000; i += 1) stepCart(s, 0.005);
    const pf = horizontalMomentum(s);
    expect(Math.abs(pf - p0)).toBeLessThan(1e-8);
  }, 30_000);
});

describe('Cart pendulum: theta bounded for moderate IC', () => {
  it('|theta| < 2 over 2000 steps for theta_0 = 0.4', () => {
    const s = createCart({ theta: 0.4 });
    for (let i = 0; i < 2000; i += 1) {
      stepCart(s, 0.005);
      expect(Math.abs(s.theta)).toBeLessThan(2);
    }
  });
});

describe('Cart pendulum: equilibrium fixed point', () => {
  it('theta = 0, v = 0: state stays at zero', () => {
    const s = createCart({ x: 0, theta: 0, xdot: 0, thetadot: 0 });
    for (let i = 0; i < 1000; i += 1) stepCart(s, 0.01);
    expect(Math.abs(s.theta)).toBeLessThan(1e-12);
    expect(Math.abs(s.xdot)).toBeLessThan(1e-12);
    expect(Math.abs(s.thetadot)).toBeLessThan(1e-12);
  });
});

describe('Cart pendulum: small-angle finite period', () => {
  it('for theta_0 = 0.05: pendulum returns through zero in finite time', () => {
    const s = createCart({ theta: 0.05, thetadot: 0 });
    const dt = 0.005;
    let prevTheta = s.theta;
    let crossings = 0, firstCrossT = -1;
    for (let i = 0; i < 5000; i += 1) {
      stepCart(s, dt);
      if (prevTheta > 0 && s.theta <= 0) {
        crossings += 1;
        if (crossings === 1) firstCrossT = s.t;
        if (crossings === 3) {
          const period = s.t - firstCrossT;
          expect(period).toBeGreaterThan(0.5);
          expect(period).toBeLessThan(10);
          return;
        }
      }
      prevTheta = s.theta;
    }
  });
});
