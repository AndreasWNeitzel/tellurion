// Parallel-transport invariants.
// (a) Full hemisphere (alpha = pi/2, beta = 2 pi): holonomy = 2 pi.
// (b) Half octant (alpha = pi/2, beta = pi/2): holonomy = pi/2.
// (c) Polar point (alpha = 0): holonomy = 0 (degenerate triangle, no area).
// (d) Gauss-Bonnet: A + B + C = pi + holonomy.

import { describe, it, expect } from 'vitest';
import { holonomy, interiorAngleSum, sphericalToCartesian } from './sim.js';

describe('parallel-transport-on-sphere', () => {
  it('full hemisphere (alpha = pi/2, beta = 2 pi): holonomy = 2 pi', () => {
    expect(Math.abs(holonomy(Math.PI / 2, 2 * Math.PI) - 2 * Math.PI)).toBeLessThan(1e-12);
  });

  it('quarter octant: alpha = pi/2, beta = pi/2: holonomy = pi/2', () => {
    expect(Math.abs(holonomy(Math.PI / 2, Math.PI / 2) - Math.PI / 2)).toBeLessThan(1e-12);
  });

  it('degenerate alpha = 0: holonomy = 0', () => {
    expect(Math.abs(holonomy(0, 1.5))).toBeLessThan(1e-12);
  });

  it('Gauss-Bonnet: A + B + C - pi = holonomy', () => {
    for (const alpha of [0.3, 0.8, Math.PI / 2]) {
      for (const beta of [0.5, 1.0, 2.0]) {
        const sum = interiorAngleSum(alpha, beta);
        const om = holonomy(alpha, beta);
        expect(Math.abs(sum - Math.PI - om)).toBeLessThan(1e-12);
      }
    }
  });

  it('sphericalToCartesian: equator (lat = 0, lon = 0) -> (1, 0, 0)', () => {
    const p = sphericalToCartesian(0, 0);
    expect(Math.abs(p.x - 1)).toBeLessThan(1e-12);
    expect(Math.abs(p.y)).toBeLessThan(1e-12);
    expect(Math.abs(p.z)).toBeLessThan(1e-12);
  });

  it('sphericalToCartesian: north pole (lat = pi/2) -> (0, 0, 1)', () => {
    const p = sphericalToCartesian(Math.PI / 2, 0);
    expect(Math.abs(p.x)).toBeLessThan(1e-12);
    expect(Math.abs(p.y)).toBeLessThan(1e-12);
    expect(Math.abs(p.z - 1)).toBeLessThan(1e-12);
  });

  it('holonomy increases with beta (linearly)', () => {
    const alpha = Math.PI / 3;
    expect(holonomy(alpha, 2.0)).toBeGreaterThan(holonomy(alpha, 1.0));
  });

  it('holonomy increases with alpha (sinusoidally)', () => {
    const beta = 1.0;
    expect(holonomy(Math.PI / 2, beta)).toBeGreaterThan(holonomy(Math.PI / 4, beta));
  });
});
