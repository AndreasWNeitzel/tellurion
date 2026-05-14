import { describe, it, expect } from 'vitest';
import { eps_pp, eps_CNO, eps_3alpha } from './sim.js';
describe('nuclear-burning-rate-temperature', () => {
  it('pp scales T^4', () => {
    expect(Math.abs(eps_pp(2 * 1.5e7) / eps_pp(1.5e7) - 16)).toBeLessThan(0.01);
  });
  it('CNO much steeper than pp', () => {
    expect(eps_CNO(2 * 2e7) / eps_CNO(2e7)).toBeGreaterThan(1e4);
  });
  it('3-alpha extremely steep', () => {
    expect(eps_3alpha(2 * 1e8) / eps_3alpha(1e8)).toBeGreaterThan(1e10);
  });
  it('rho dependence: pp linear, 3-alpha quadratic', () => {
    expect(Math.abs(eps_pp(2e7, 2) / eps_pp(2e7, 1) - 2)).toBeLessThan(0.01);
    expect(Math.abs(eps_3alpha(1e8, 2) / eps_3alpha(1e8, 1) - 4)).toBeLessThan(0.01);
  });
});
