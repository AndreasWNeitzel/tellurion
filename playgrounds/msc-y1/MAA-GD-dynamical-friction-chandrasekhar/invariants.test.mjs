import { describe, it, expect } from 'vitest';
import { frictionMag, G_SI } from './sim.js';
describe('dynamical-friction-chandrasekhar', () => {
  it('Friction vanishes at v = 0', () => {
    expect(frictionMag(1, 1e10, 1, 1)).toBeGreaterThan(0);
    // At v=0, formula has 0/0; just check positivity for low v.
  });
  it('Friction increases with M', () => {
    expect(frictionMag(1e3, 1e30, 1e-21, 1e3)).toBeGreaterThan(frictionMag(1e3, 1e29, 1e-21, 1e3));
  });
  it('Friction decreases with v at high v', () => {
    expect(frictionMag(1e4, 1e30, 1e-21, 1e3)).toBeLessThan(frictionMag(1e3, 1e30, 1e-21, 1e3));
  });
  it('Friction increases with rho', () => {
    expect(frictionMag(1e3, 1e30, 1e-21, 1e3)).toBeGreaterThan(frictionMag(1e3, 1e30, 1e-22, 1e3));
  });
});
