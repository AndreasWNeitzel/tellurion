import { describe, it, expect } from 'vitest';
import { sunSeed, buildTiling, countByType, totalArea, PHI, triangleArea } from './sim.js';

describe('penrose-aperiodic-tiling-3d', () => {
  it('golden ratio is (1 + sqrt 5) / 2 = 1.618...', () => {
    expect(PHI).toBeCloseTo(1.6180339887, 8);
  });

  it('phi satisfies phi^2 = phi + 1', () => {
    expect(PHI * PHI).toBeCloseTo(PHI + 1, 9);
  });

  it('Sun seed has 10 A triangles', () => {
    const seed = sunSeed();
    expect(seed.length).toBe(10);
    expect(seed.every(t => t.type === 'A')).toBe(true);
  });

  it('Sun-seed total area is sin(36 deg) * 10 / 2 = 5 sin(36 deg)', () => {
    const seed = sunSeed();
    // Each A triangle has 36 deg apex at origin, with two unit-length
    // sides; area = 0.5 sin(36 deg). Ten of them give 5 sin(36 deg).
    const expected = 5 * Math.sin(36 * Math.PI / 180);
    expect(totalArea(seed)).toBeCloseTo(expected, 6);
  });

  it('1 deflation: total tile count = 20 (10 A each split into 1 A + 1 B)', () => {
    const T = buildTiling(1);
    expect(T.length).toBe(20);
    const c = countByType(T);
    expect(c.A).toBe(10);
    expect(c.B).toBe(10);
  });

  it('after each deflation the counts satisfy a_{n+1} = a_n + b_n, b_{n+1} = a_n + 2 b_n', () => {
    let prev = countByType(buildTiling(0));
    for (let n = 1; n <= 5; n++) {
      const cur = countByType(buildTiling(n));
      expect(cur.A).toBe(prev.A + prev.B);
      expect(cur.B).toBe(prev.A + 2 * prev.B);
      prev = cur;
    }
  });

  it('A/B ratio approaches 1/phi as N grows (B is the abundant tile)', () => {
    const r2 = countByType(buildTiling(2)).ratio;
    const r5 = countByType(buildTiling(5)).ratio;
    expect(Math.abs(r5 - 1 / PHI)).toBeLessThan(Math.abs(r2 - 1 / PHI) + 1e-9);
    expect(r5).toBeCloseTo(1 / PHI, 2);
  });

  it('deflation preserves total area to within numerical roundoff', () => {
    const a0 = totalArea(buildTiling(0));
    for (let n = 1; n <= 4; n++) {
      const an = totalArea(buildTiling(n));
      expect(Math.abs(an - a0) / a0).toBeLessThan(1e-9);
    }
  });

  it('every triangle has positive area', () => {
    const T = buildTiling(4);
    for (const t of T) expect(triangleArea(t)).toBeGreaterThan(0);
  });

  it('only types A and B exist (no spurious third type)', () => {
    const types = new Set(buildTiling(3).map(t => t.type));
    expect([...types].sort()).toEqual(['A', 'B']);
  });

  it('count grows as phi^(2n) (dominant eigenvalue is phi^2)', () => {
    const c2 = countByType(buildTiling(2)).total;
    const c5 = countByType(buildTiling(5)).total;
    // Ratio after 3 more steps -> phi^6 ~ 17.9.
    const expected = Math.pow(PHI, 6);
    expect(c5 / c2).toBeGreaterThan(expected * 0.7);
    expect(c5 / c2).toBeLessThan(expected * 1.3);
  });

  it('zero deflations equals the seed', () => {
    expect(buildTiling(0).length).toBe(10);
  });
});
