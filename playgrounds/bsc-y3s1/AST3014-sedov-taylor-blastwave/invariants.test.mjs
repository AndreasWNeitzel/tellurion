import { describe, it, expect } from 'vitest';
import { shockRadius, shockSpeed, postShockDensity, postShockPressure } from './sim.js';
describe('sedov-taylor-blastwave', () => {
  it('R scales as t^{2/5}', () => {
    const R1 = shockRadius(1, 1, 1);
    const R2 = shockRadius(1, 32, 1);
    expect(Math.abs(R2 / R1 - Math.pow(32, 0.4))).toBeLessThan(1e-9);
  });
  it('R scales as E^{1/5}', () => {
    const R1 = shockRadius(1, 1, 1);
    const R2 = shockRadius(32, 1, 1);
    expect(Math.abs(R2 / R1 - Math.pow(32, 0.2))).toBeLessThan(1e-9);
  });
  it('shock speed = (2/5) R/t', () => {
    expect(Math.abs(shockSpeed(1, 2, 1) - 0.4 * shockRadius(1, 2, 1) / 2)).toBeLessThan(1e-12);
  });
  it('post-shock density: 4 rho_1 at gamma 5/3', () => {
    expect(postShockDensity(1)).toBe(4);
  });
  it('post-shock pressure positive for nonzero vs', () => {
    expect(postShockPressure(1, 100)).toBeGreaterThan(0);
  });
});
