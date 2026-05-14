import { describe, it, expect } from 'vitest';
import { blochFrequency, quasiMomentum, groupVelocity, position } from './sim.js';
describe('bloch-oscillations', () => {
  it('Bloch frequency linear in F', () => {
    expect(Math.abs(blochFrequency(2) / blochFrequency(1) - 2)).toBeLessThan(1e-12);
  });
  it('quasi-momentum wraps to BZ', () => {
    const k = quasiMomentum(1e6, 0, 1, 1, 1, 1);
    expect(Math.abs(k)).toBeLessThanOrEqual(Math.PI);
  });
  it('group velocity zero at k = 0', () => {
    expect(groupVelocity(0, 1)).toBe(0);
  });
  it('group velocity max at k = pi/2 (for cosine band)', () => {
    expect(Math.abs(groupVelocity(Math.PI / 2, 1) - 0.5)).toBeLessThan(1e-12);
  });
  it('position periodic with Bloch period', () => {
    const T = 2 * Math.PI / blochFrequency(1);
    const x1 = position(0, 0, 1, 1);
    const x2 = position(T, 0, 1, 1);
    expect(Math.abs(x1 - x2)).toBeLessThan(1e-9);
  });
});
