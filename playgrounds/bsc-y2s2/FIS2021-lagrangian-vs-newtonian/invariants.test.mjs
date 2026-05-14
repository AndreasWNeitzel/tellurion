import { describe, it, expect } from 'vitest';
import { pendulumRHS, leapfrog, energy } from './sim.js';
describe('lagrangian-vs-newtonian', () => {
  it('Newton RHS gives expected acceleration at equilibrium', () => {
    const r = pendulumRHS(0, 0, 1, 10);
    expect(Math.abs(r.domega)).toBeLessThan(1e-12);
  });
  it('Acceleration negative for small positive angle (restoring)', () => {
    const r = pendulumRHS(0.1, 0, 1, 10);
    expect(r.domega).toBeLessThan(0);
  });
  it('Leapfrog conserves energy on simple pendulum', () => {
    let theta = 0.5, omega = 0;
    const E0 = energy(theta, omega);
    for (let i = 0; i < 10000; i += 1) ({ theta, omega } = leapfrog(theta, omega, 0.01));
    expect(Math.abs(energy(theta, omega) - E0) / Math.abs(E0)).toBeLessThan(0.01);
  });
  it('Small-amplitude period ~ 2 pi sqrt(L/g)', () => {
    let theta = 0.05, omega = 0;
    const dt = 0.001;
    let crossings = 0, t_first = -1, t_second = -1;
    for (let i = 0; i < 50000; i += 1) {
      const prev = theta;
      ({ theta, omega } = leapfrog(theta, omega, dt));
      if (prev > 0 && theta <= 0) { crossings += 1; if (crossings === 1) t_first = i * dt; else if (crossings === 2) t_second = i * dt; }
      if (crossings === 2) break;
    }
    const period = t_second - t_first;
    expect(Math.abs(period - 2 * Math.PI * Math.sqrt(1 / 9.81))).toBeLessThan(0.05);
  });
});
