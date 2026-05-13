// Runge / Chebyshev invariants.
// (a) Equispaced interpolation diverges on Runge function.
// (b) Chebyshev converges on Runge function.
// (c) Equispaced spacing 2/n exact.
// (d) Chebyshev nodes cluster at endpoints.
// (e) Lagrange interpolation matches at nodes.
// (f) Chebyshev << equispaced at moderate n on Runge.

import { describe, it, expect } from 'vitest';
import {
  rungeFn, equispacedNodes, chebyshevNodes, buildInterp, maxError,
} from './sim.js';

describe('Runge: equispaced diverges with n', () => {
  it('e(20) >= 5 * e(8) on Runge function', () => {
    const e8 = maxError(buildInterp(equispacedNodes(8), rungeFn), rungeFn);
    const e20 = maxError(buildInterp(equispacedNodes(20), rungeFn), rungeFn);
    expect(e20).toBeGreaterThan(e8 * 5);
  });
});

describe('Chebyshev: converges with n', () => {
  it('c(20) < c(8) on Runge function', () => {
    const c8 = maxError(buildInterp(chebyshevNodes(8), rungeFn), rungeFn);
    const c20 = maxError(buildInterp(chebyshevNodes(20), rungeFn), rungeFn);
    expect(c20).toBeLessThan(c8);
  });
});

describe('Equispaced nodes: uniform spacing', () => {
  it('spacing 2/n exact', () => {
    const nodes = equispacedNodes(10);
    for (let i = 1; i < nodes.length; i += 1) {
      expect(nodes[i] - nodes[i - 1]).toBeCloseTo(0.2, 12);
    }
  });
});

describe('Chebyshev nodes: clustering near endpoints', () => {
  it('first gap is smaller than middle gap', () => {
    const nodes = chebyshevNodes(20);
    const firstGap = nodes[1] - nodes[0];
    const midIdx = Math.floor(nodes.length / 2);
    const midGap = nodes[midIdx + 1] - nodes[midIdx];
    expect(firstGap).toBeLessThan(midGap);
  });
});

describe('Lagrange matches at nodes', () => {
  it('p(xi) = yi to 1e-9', () => {
    const nodes = equispacedNodes(8);
    const p = buildInterp(nodes, rungeFn);
    for (const x of nodes) {
      expect(p(x)).toBeCloseTo(rungeFn(x), 9);
    }
  });
});

describe('Chebyshev << equispaced at moderate n', () => {
  it('at n = 16: Chebyshev < 0.1 * equispaced error', () => {
    const e = maxError(buildInterp(equispacedNodes(16), rungeFn), rungeFn);
    const c = maxError(buildInterp(chebyshevNodes(16), rungeFn), rungeFn);
    expect(c).toBeLessThan(e * 0.1);
  });
});
