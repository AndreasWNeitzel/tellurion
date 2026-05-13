// Predator-prey invariants.
// (a) Equilibrium is a fixed point.
// (b) Above Hopf: limit cycle (amplitude > threshold).
// (c) Non-negative populations.
// (d) xStar formula b d / (e a - d).

import { describe, it, expect } from 'vitest';
import { createPredPrey, stepPredPrey, equilibrium, hopfThreshold } from './sim.js';

describe('Predator-prey: equilibrium is a fixed point', () => {
  it('placing system at (x*, y*) leaves it there within 1e-4 over 200 steps', () => {
    const params = { r: 0.5, K: 2.0, a: 1.0, b: 0.3, e: 0.5, d: 0.2 };
    const eq = equilibrium(params);
    expect(eq).not.toBeNull();
    const s = createPredPrey({ ...params, x0: eq.x, y0: eq.y });
    for (let i = 0; i < 200; i += 1) stepPredPrey(s, 0.005);
    expect(Math.abs(s.x - eq.x)).toBeLessThan(1e-4);
    expect(Math.abs(s.y - eq.y)).toBeLessThan(1e-4);
  });
});

describe('Predator-prey: above Hopf is a limit cycle', () => {
  it('K = 1.5 (above K_H = 0.7): amplitude after long warmup > 0.5', () => {
    const params = { r: 0.5, K: 1.5, a: 1.0, b: 0.3, e: 0.5, d: 0.2 };
    const eq = equilibrium(params);
    const s = createPredPrey({ ...params, x0: eq.x + 0.05, y0: eq.y + 0.05 });
    for (let i = 0; i < 5000; i += 1) stepPredPrey(s, 0.01);
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < 5000; i += 1) {
      stepPredPrey(s, 0.01);
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
    }
    expect(maxX - minX).toBeGreaterThan(0.5);
  }, 30_000);
});

describe('Predator-prey: non-negative populations', () => {
  it('x, y >= 0 throughout 1000 steps', () => {
    const s = createPredPrey({ x0: 0.4, y0: 0.3 });
    for (let i = 0; i < 1000; i += 1) {
      stepPredPrey(s, 0.01);
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Predator-prey: xStar formula', () => {
  it('xStar = b d / (e a - d) exact', () => {
    const eq = equilibrium({ r: 0.5, K: 5.0, a: 1.0, b: 0.3, e: 0.5, d: 0.2 });
    expect(eq.x).toBeCloseTo(0.3 * 0.2 / (0.5 * 1.0 - 0.2), 12);
  });
});

describe('Predator-prey: Hopf threshold positive', () => {
  it('K_H computed and positive for default params', () => {
    const KH = hopfThreshold({ a: 1.0, b: 0.3, e: 0.5, d: 0.2 });
    expect(KH).toBeGreaterThan(0);
  });
});
