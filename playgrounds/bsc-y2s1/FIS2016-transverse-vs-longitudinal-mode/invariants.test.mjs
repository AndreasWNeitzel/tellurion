import { describe, it, expect } from 'vitest';
import { omegaK, modePosition } from './sim.js';
describe('transverse-vs-longitudinal-mode', () => {
  it('omega(k=0) = 0 (acoustic branch)', () => {
    expect(omegaK(0)).toBe(0);
  });
  it('omega(pi/a) = 2 sqrt(K/m) (Brillouin zone edge)', () => {
    expect(Math.abs(omegaK(Math.PI) - 2)).toBeLessThan(1e-12);
  });
  it('omega monotone in [0, pi]', () => {
    for (let i = 0; i < 10; i += 1) {
      const k1 = Math.PI * i / 10, k2 = Math.PI * (i + 1) / 10;
      expect(omegaK(k1)).toBeLessThanOrEqual(omegaK(k2));
    }
  });
  it('transverse mode: particles move only in y', () => {
    const p = modePosition(5, 0.7, 'transverse', 1, 0.3, 20);
    expect(p.x).toBe(5);
    expect(Math.abs(p.y)).toBeGreaterThan(0);
  });
  it('longitudinal mode: particles move only in x', () => {
    const p = modePosition(5, 0.7, 'longitudinal', 1, 0.3, 20);
    expect(p.y).toBe(0);
    expect(p.x).not.toBe(5);
  });
});
