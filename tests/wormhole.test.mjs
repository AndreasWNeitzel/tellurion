// Shared-engine tests for shared/js/engine/wormhole-cpu.js (built
// before the wormhole-traversal-3d hero). The flare-out condition,
// the exactly-conserved null norm, and the traverse-vs-scatter
// threshold at the throat radius prove the geometry is the real
// Ellis / Morris-Thorne metric, not a scripted fly-through.

import { describe, it, expect } from 'vitest';
import {
  circumferentialR, embedZ, flareOut, criticalImpact, nullNorm,
  tracePhoton, properDistance, tidalScale,
} from '../shared/js/engine/wormhole-cpu.js';

describe('Ellis wormhole geometry', () => {
  it('circumferential radius has its minimum (the throat) at l = 0', () => {
    expect(circumferentialR(0, 2)).toBeCloseTo(2, 12);
    expect(circumferentialR(5, 2)).toBeGreaterThan(2);
    expect(circumferentialR(-5, 2)).toBeGreaterThan(2);
  });

  it('embedding is antisymmetric (two funnels) and zero at the throat', () => {
    expect(embedZ(0, 1)).toBeCloseTo(0, 12);
    expect(embedZ(3, 1)).toBeCloseTo(-embedZ(-3, 1), 12);
    expect(embedZ(3, 1)).toBeGreaterThan(0);
  });

  it('the flare-out condition d2r/dz2 > 0 holds at the throat', () => {
    for (const b0 of [0.5, 1, 2.5]) expect(flareOut(b0)).toBeGreaterThan(0);
  });

  it('proper radial distance from the throat is |l|', () => {
    expect(properDistance(-7)).toBe(7);
    expect(properDistance(0)).toBe(0);
  });

  it('the geometric tidal scale peaks at the throat and decays', () => {
    expect(tidalScale(0, 1)).toBeGreaterThan(tidalScale(2, 1));
    expect(tidalScale(2, 1)).toBeGreaterThan(tidalScale(8, 1));
  });
});

describe('null geodesics through the wormhole', () => {
  it('the null norm is conserved to 1e-5 along a traversing ray', () => {
    const g = tracePhoton({ b0: 1, b: 0.4, ell0: 25, dlam: 0.008, maxLam: 400 });
    expect(g.outcome).toBe('traverse');
    expect(g.maxDrift).toBeLessThan(1e-5);
  });

  it('a photon aimed below the throat radius traverses to the far universe', () => {
    const g = tracePhoton({ b0: 1, b: 0.7, ell0: 25, dlam: 0.008 });
    expect(g.outcome).toBe('traverse');
    expect(g.minR).toBeLessThan(1.01);          // it passes through the throat
  });

  it('a photon aimed wider than the throat radius scatters back (blocked)', () => {
    const g = tracePhoton({ b0: 1, b: 1.6, ell0: 25, dlam: 0.008 });
    expect(g.outcome).toBe('scatter');
    expect(g.minR).toBeGreaterThan(1.0);        // it never reaches the throat
  });

  it('the traverse/scatter threshold is the throat radius b0', () => {
    expect(criticalImpact(2.3)).toBeCloseTo(2.3, 12);
    const lo = tracePhoton({ b0: 1, b: 0.95, ell0: 25, dlam: 0.006 }).outcome;
    const hi = tracePhoton({ b0: 1, b: 1.05, ell0: 25, dlam: 0.006 }).outcome;
    expect(lo).toBe('traverse');
    expect(hi).toBe('scatter');
  });

  it('deterministic: identical aim reproduces the path', () => {
    const a = tracePhoton({ b0: 1, b: 0.5, ell0: 20, dlam: 0.01 });
    const c = tracePhoton({ b0: 1, b: 0.5, ell0: 20, dlam: 0.01 });
    expect(a.ls.length).toBe(c.ls.length);
    expect(a.ls[a.ls.length - 1]).toBe(c.ls[c.ls.length - 1]);
  });
});
