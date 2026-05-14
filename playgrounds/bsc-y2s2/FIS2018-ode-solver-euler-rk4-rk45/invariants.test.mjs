import { describe, it, expect } from 'vitest';
import { euler, rk4, rk45, energy } from './sim.js';
describe('ode-solver-euler-rk4-rk45', () => {
  it('Euler drifts energy upward', () => {
    let y = [1, 0];
    const E0 = energy(y, 1);
    for (let i = 0; i < 1000; i += 1) y = euler(y, 0.05, 1);
    expect(energy(y, 1)).toBeGreaterThan(E0 * 5);
  });
  it('RK4 conserves energy approximately', () => {
    let y = [1, 0];
    const E0 = energy(y, 1);
    for (let i = 0; i < 1000; i += 1) y = rk4(y, 0.05, 1);
    expect(Math.abs(energy(y, 1) - E0) / E0).toBeLessThan(0.005);
  });
  it('RK45 single step returns error norm', () => {
    const r = rk45([1, 0], 0.1, 1);
    expect(r.err_norm).toBeGreaterThanOrEqual(0);
  });
  it('RK4 more accurate than Euler', () => {
    let yE = [1, 0], yR = [1, 0];
    for (let i = 0; i < 100; i += 1) { yE = euler(yE, 0.01, 1); yR = rk4(yR, 0.01, 1); }
    const trueY = Math.cos(1);
    expect(Math.abs(yR[0] - trueY)).toBeLessThan(Math.abs(yE[0] - trueY));
  });
});
