// Invariants for thin-lens imaging: the Gaussian lens equation, the magnification
// relation, the at-2F symmetry, and the real/virtual classification for converging
// and diverging lenses.

import { describe, it, expect } from 'vitest';
import { imageDistance, magnification, imageHeight, isReal, lensResidual } from './sim.js';

describe('Gaussian lens equation', () => {
  it('1/d_o + 1/d_i = 1/f holds across configurations', () => {
    for (const [d, f] of [[8, 4], [6, 3], [2, 4], [5, -3], [10, 2], [3, -5]]) {
      expect(lensResidual(d, f)).toBeCloseTo(0, 9);
    }
  });
  it('object at infinity images at the focal point', () => {
    expect(imageDistance(1e6, 4)).toBeCloseTo(4, 2);
    expect(imageDistance(1e6, -3)).toBeCloseTo(-3, 2);
  });
});

describe('Magnification', () => {
  it('M = -d_i/d_o = h_i/h_o', () => {
    for (const [d, f, h] of [[8, 4, 1.5], [2, 4, 1.5], [5, -3, 1.5]]) {
      expect(magnification(d, f)).toBeCloseTo(-imageDistance(d, f) / d, 9);
      expect(imageHeight(d, f, h)).toBeCloseTo(magnification(d, f) * h, 9);
    }
  });
  it('object at 2f gives a real inverted image at 2f with M = -1', () => {
    const f = 3;
    expect(imageDistance(2 * f, f)).toBeCloseTo(2 * f, 9);
    expect(magnification(2 * f, f)).toBeCloseTo(-1, 9);
  });
});

describe('Real vs virtual classification', () => {
  it('converging lens, object beyond f: real and inverted', () => {
    expect(isReal(8, 4)).toBe(true);
    expect(magnification(8, 4)).toBeLessThan(0);
  });
  it('converging lens, object inside f: virtual, upright, enlarged', () => {
    expect(isReal(2, 4)).toBe(false);
    expect(imageDistance(2, 4)).toBeLessThan(0);
    expect(magnification(2, 4)).toBeGreaterThan(1);
  });
  it('diverging lens: always virtual, upright, reduced', () => {
    for (const d of [1, 4, 9, 15]) {
      expect(isReal(d, -3)).toBe(false);
      const m = magnification(d, -3);
      expect(m).toBeGreaterThan(0);
      expect(m).toBeLessThan(1);
    }
  });
});

describe('Image at infinity', () => {
  it('object at the focal point sends the image to infinity', () => {
    expect(isFinite(imageDistance(4, 4))).toBe(false);
  });
});
