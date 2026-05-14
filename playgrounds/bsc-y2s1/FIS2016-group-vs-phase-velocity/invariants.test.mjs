import { describe, it, expect } from 'vitest';
import { omega, phaseVelocity, groupVelocity } from './sim.js';
describe('group-vs-phase-velocity', () => {
  it('light: v_p = v_g = c', () => {
    expect(Math.abs(phaseVelocity('light', 2) - groupVelocity('light', 2))).toBeLessThan(1e-6);
  });
  it('deep-water: v_g = v_p / 2', () => {
    const vp = phaseVelocity('water-deep', 1), vg = groupVelocity('water-deep', 1);
    expect(Math.abs(vg / vp - 0.5)).toBeLessThan(0.01);
  });
  it('Schrodinger free particle: v_g = 2 v_p', () => {
    const vp = phaseVelocity('shrod', 1), vg = groupVelocity('shrod', 1);
    expect(Math.abs(vg / vp - 2)).toBeLessThan(0.01);
  });
  it('plasma: v_g v_p = c^2 (with c = 1)', () => {
    const vp = phaseVelocity('plasma', 3), vg = groupVelocity('plasma', 3);
    expect(Math.abs(vp * vg - 1)).toBeLessThan(0.05);
  });
  it('plasma: omega > omega_p (no propagation below cutoff)', () => {
    expect(omega('plasma', 0.5)).toBeGreaterThanOrEqual(2);
  });
});
