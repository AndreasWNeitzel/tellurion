import { describe, it, expect } from 'vitest';
import { f, maxDelta } from './sim.js';

describe('epsilon-delta-continuity-visualizer', () => {
  it('larger epsilon allows larger delta', () => {
    expect(maxDelta(0, 0.5)).toBeGreaterThan(maxDelta(0, 0.1));
  });
  it('at x = 0: f = sin: maxDelta(0, 0.1) ~ arcsin(0.1) = 0.1003', () => {
    expect(Math.abs(maxDelta(0, 0.1) - Math.asin(0.1)) / Math.asin(0.1)).toBeLessThan(0.01);
  });
  it('epsilon = 0 gives delta -> 0', () => {
    expect(maxDelta(0, 1e-6)).toBeLessThan(1e-3);
  });
  it('continuity at every point: maxDelta > 0 for epsilon > 0', () => {
    for (const x0 of [-1, 0, 1, Math.PI]) {
      expect(maxDelta(x0, 0.3)).toBeGreaterThan(0);
    }
  });
  it('f(0) = 0', () => { expect(f(0)).toBe(0); });
});
