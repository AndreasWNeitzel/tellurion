// Gravitational-lensing invariants, tested directly on sim.js (the same
// lensing core the playground renders). Single-lens closed forms are
// exact; the binary test demonstrates caustic crossing. No tautologies.

import { describe, it, expect } from 'vitest';
import {
  makeLenses, mapToSource, jacobianDet, findImages, pointLensMagnification,
} from './sim.js';

describe('single point lens', () => {
  const lens = makeLenses(false);

  it('Einstein ring: det A = 0 at |theta| = 1, < 0 just inside, > 0 outside', () => {
    expect(Math.abs(jacobianDet(lens, { x: 1, y: 0 }))).toBeLessThan(1e-9);
    expect(jacobianDet(lens, { x: 0.5, y: 0 })).toBeLessThan(0);
    expect(jacobianDet(lens, { x: 2.0, y: 0 })).toBeGreaterThan(0);
  });

  it('det A = 1 - 1/r^4 in closed form', () => {
    for (const r of [0.6, 1.3, 2.2]) {
      expect(jacobianDet(lens, { x: r, y: 0 })).toBeCloseTo(1 - 1 / r ** 4, 9);
    }
  });

  it('a source off-axis has exactly two images, each solving the lens equation', () => {
    // Away from the Einstein ring (u >> 0); very near the ring the
    // brute-force finder splits the highly elongated image, a known
    // discretization limit of the grid-seeded Newton search.
    for (const u of [0.6, 0.9, 1.5]) {
      const beta = { x: u, y: 0 };
      const imgs = findImages(lens, beta, 120, 3.0);
      expect(imgs.length).toBe(2);
      for (const im of imgs) {
        const b = mapToSource(lens, im);
        expect(Math.hypot(b.x - beta.x, b.y - beta.y)).toBeLessThan(2e-2);
      }
    }
  });

  it('total magnification matches (u^2+2)/(u sqrt(u^2+4))', () => {
    for (const u of [0.5, 1.0, 1.6]) {
      const imgs = findImages(lens, { x: u, y: 0 }, 160, 3.0);
      expect(imgs.length).toBe(2);
      let A = 0;
      for (const im of imgs) A += 1 / Math.abs(jacobianDet(lens, im));
      expect(A).toBeCloseTo(pointLensMagnification(u), 1);
    }
  });
});

describe('binary lens caustic crossing', () => {
  const lens = makeLenses(true, 0.8, 0.5);

  it('image count is odd and increases when the source enters the caustic', () => {
    const far = findImages(lens, { x: 2.6, y: 0 }, 200, 3.2).length;
    const inside = findImages(lens, { x: 0, y: 0.03 }, 200, 3.2).length;
    expect(far % 2).toBe(1);
    expect(inside % 2).toBe(1);
    expect(far).toBeGreaterThanOrEqual(3);
    expect(inside).toBeGreaterThan(far);
  });
});

describe('determinism', () => {
  it('findImages reproduces the same images for identical inputs', () => {
    const lens = makeLenses(true, 0.8, 0.5);
    const a = findImages(lens, { x: 0.2, y: 0.1 }, 120, 3.0);
    const b = findImages(lens, { x: 0.2, y: 0.1 }, 120, 3.0);
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i += 1) {
      expect(a[i].x).toBe(b[i].x);
      expect(a[i].y).toBe(b[i].y);
    }
  });

  it('total lens mass is normalised to one', () => {
    for (const cfg of [makeLenses(false), makeLenses(true, 0.8, 0.5), makeLenses(true, 1.2, 0.3)]) {
      const m = cfg.reduce((s, L) => s + L.m, 0);
      expect(m).toBeCloseTo(1, 12);
    }
  });
});
