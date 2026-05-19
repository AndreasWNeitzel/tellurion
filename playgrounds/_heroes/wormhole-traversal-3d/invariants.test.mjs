// wormhole-traversal-3d invariants. The flare-out condition, the
// conserved null norm, and the traverse/scatter threshold at the
// throat radius prove the shader's geometry is the real Ellis metric
// (shared engine via ./sim.js).

import { describe, it, expect } from 'vitest';
import {
  circumferentialR, embedZ, flareOut, criticalImpact, tracePhoton,
  properDistance, tidalScale,
} from './sim.js';

describe('wormhole-traversal-3d', () => {
  it('throat is the minimum circumferential radius; embedding antisymmetric', () => {
    expect(circumferentialR(0, 1.5)).toBeCloseTo(1.5, 12);
    expect(circumferentialR(4, 1.5)).toBeGreaterThan(1.5);
    expect(embedZ(2, 1)).toBeCloseTo(-embedZ(-2, 1), 12);
  });

  it('flare-out condition d2r/dz2 > 0 holds at the throat', () => {
    for (const b0 of [0.5, 1, 2]) expect(flareOut(b0)).toBeGreaterThan(0);
  });

  it('null norm conserved to 1e-5 along a traversing ray', () => {
    const g = tracePhoton({ b0: 1, b: 0.4, ell0: 25, dlam: 0.008, maxLam: 400 });
    expect(g.outcome).toBe('traverse');
    expect(g.maxDrift).toBeLessThan(1e-5);
  });

  it('aimed below b0 traverses; aimed wider scatters (untraversable choice blocked)', () => {
    expect(tracePhoton({ b0: 1, b: 0.7, ell0: 25, dlam: 0.008 }).outcome).toBe('traverse');
    expect(tracePhoton({ b0: 1, b: 1.6, ell0: 25, dlam: 0.008 }).outcome).toBe('scatter');
    expect(criticalImpact(2.2)).toBeCloseTo(2.2, 12);
  });

  it('proper distance is |l|; tidal scale peaks at the throat', () => {
    expect(properDistance(-6)).toBe(6);
    expect(tidalScale(0, 1)).toBeGreaterThan(tidalScale(5, 1));
  });

  it('deterministic: identical aim reproduces the path', () => {
    const a = tracePhoton({ b0: 1, b: 0.5, ell0: 20, dlam: 0.01 });
    const c = tracePhoton({ b0: 1, b: 0.5, ell0: 20, dlam: 0.01 });
    expect(a.ls[a.ls.length - 1]).toBe(c.ls[c.ls.length - 1]);
  });
});
