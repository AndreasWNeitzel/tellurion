import { describe, it, expect } from 'vitest';
import { energyLevel, confinementGap, levels, dos, absorptionOnset } from './sim.js';

describe('quantum-confinement-nanostructure invariants', () => {
  it('infinite-well spectrum: E_n proportional to n^2 and E2 - E1 = 3 E1', () => {
    const L = 2, m = 1;
    const E1 = energyLevel(1, L, m);
    expect(energyLevel(2, L, m)).toBeCloseTo(4 * E1, 12);
    expect(energyLevel(3, L, m)).toBeCloseTo(9 * E1, 12);
    expect(energyLevel(2, L, m) - E1).toBeCloseTo(3 * E1, 12);   // the headline relation
  });

  it('confinement energy scales as 1/L^2 and vanishes as L -> infinity', () => {
    const a = confinementGap(1), b = confinementGap(2), c = confinementGap(4);
    expect(b).toBeCloseTo(a / 4, 12);                            // doubling L quarters E1
    expect(c).toBeCloseTo(a / 16, 12);
    expect(confinementGap(1e6)).toBeLessThan(1e-10);             // bulk limit: gap -> 0
    // the gap grows as the box shrinks
    expect(confinementGap(0.5)).toBeGreaterThan(confinementGap(1));
  });

  it('exact value E_1 = pi^2 / (2 m L^2)', () => {
    expect(energyLevel(1, 1, 1)).toBeCloseTo(Math.PI ** 2 / 2, 12);
    expect(energyLevel(1, 3, 2)).toBeCloseTo(Math.PI ** 2 / (2 * 2 * 9), 12);
  });

  it('3D bulk density of states is proportional to sqrt(E)', () => {
    const g = (E) => dos('bulk', E, 1, 1);
    expect(g(4) / g(1)).toBeCloseTo(2, 9);                       // sqrt(4)/sqrt(1)
    expect(g(9) / g(1)).toBeCloseTo(3, 9);
    expect(g(0)).toBe(0);
  });

  it('2D well DOS is a non-decreasing staircase that jumps at each subband edge', () => {
    const L = 2, subs = levels('well', L, 1, 30).map(s => s.E);
    const E0 = subs[0];
    // constant just above the first edge, then a strictly higher plateau above the second
    const gA = dos('well', E0 + 0.01, L), gB = dos('well', E0 + 0.02, L);
    expect(gB).toBeCloseTo(gA, 9);                               // flat within a subband
    if (subs.length > 1) {
      expect(dos('well', subs[1] + 0.01, L)).toBeGreaterThan(gA); // jumps up at next edge
    }
    expect(dos('well', E0 - 0.05, L)).toBeLessThan(gA);          // lower below the first edge
  });

  it('1D wire DOS diverges (van Hove) approaching a subband edge from above', () => {
    const L = 2, subs = levels('wire', L, 1, 30).map(s => s.E);
    const Ec = subs[0];
    expect(dos('wire', Ec + 1e-3, L)).toBeGreaterThan(dos('wire', Ec + 1e-1, L));
    expect(dos('wire', Ec + 1e-4, L)).toBeGreaterThan(dos('wire', Ec + 1e-3, L));
  });

  it('absorption onset is the gap (>0 when confined, 0 in bulk) and rises as L shrinks', () => {
    expect(absorptionOnset('bulk', 2)).toBe(0);
    expect(absorptionOnset('dot', 2)).toBeGreaterThan(0);
    expect(absorptionOnset('dot', 1)).toBeGreaterThan(absorptionOnset('dot', 2));
  });

  it('deterministic: pure functions reproduce outputs exactly', () => {
    expect(energyLevel(3, 2, 1)).toBe(energyLevel(3, 2, 1));
    expect(dos('wire', 5, 2, 1)).toBe(dos('wire', 5, 2, 1));
  });
});
