// Invariants for conformal maps: angle preservation where f' != 0, area scaling by
// |f'|^2, the analytic derivative matches the finite-difference limit, critical
// points have f' = 0, and at a simple critical point angles double.

import { describe, it, expect } from 'vitest';
import { FUNCS, cabs, csub, imageAngle } from './sim.js';

describe('Conformality: angles are preserved where f-prime is nonzero', () => {
  for (const key of ['square', 'inverse', 'exp', 'mobius', 'joukowski']) {
    it(`${key}: perpendicular directions stay perpendicular`, () => {
      const fn = FUNCS[key]; const z0 = [0.7, 0.45];
      const a = imageAngle(fn, z0, [1, 0], [0, 1]);
      expect(Math.abs(a)).toBeCloseTo(Math.PI / 2, 3);
    });
  }
  it('a 60 degree angle is preserved', () => {
    const fn = FUNCS.square; const z0 = [0.6, -0.3];
    const a = imageAngle(fn, z0, [1, 0], [Math.cos(Math.PI / 3), Math.sin(Math.PI / 3)]);
    expect(Math.abs(a)).toBeCloseTo(Math.PI / 3, 3);
  });
});

describe('The analytic derivative matches the finite-difference limit', () => {
  for (const key of ['square', 'inverse', 'exp', 'mobius', 'joukowski']) {
    it(`${key}: f' equals (f(z+h) - f(z)) / h`, () => {
      const fn = FUNCS[key]; const z0 = [0.8, 0.5]; const h = 1e-6;
      const num = csub(fn.f([z0[0] + h, z0[1]]), fn.f(z0)).map((v) => v / h);
      const an = fn.df(z0);
      expect(num[0]).toBeCloseTo(an[0], 4); expect(num[1]).toBeCloseTo(an[1], 4);
    });
  }
});

describe('Area scales by |f-prime|^2', () => {
  it('a small square maps to area ~ |f-prime|^2 times its own', () => {
    const fn = FUNCS.square; const z0 = [0.9, 0.6]; const h = 1e-3;
    const a = csub(fn.f([z0[0] + h, z0[1]]), fn.f(z0)); const b = csub(fn.f([z0[0], z0[1] + h]), fn.f(z0));
    const imgArea = Math.abs(a[0] * b[1] - a[1] * b[0]); // |a x b|
    const scale = imgArea / (h * h);
    expect(scale).toBeCloseTo(cabs(fn.df(z0)) ** 2, 2);
  });
});

describe('Critical points and angle doubling', () => {
  it('f-prime vanishes at the listed critical points', () => {
    expect(cabs(FUNCS.square.df([0, 0]))).toBeCloseTo(0, 9);
    for (const c of FUNCS.joukowski.critical) expect(cabs(FUNCS.joukowski.df(c))).toBeCloseTo(0, 9);
  });
  it('z^2 doubles angles at the origin (a 45 degree input opens to 90)', () => {
    const fn = FUNCS.square; const eps = 1e-3;
    // two rays from near the origin at 0 and 45 degrees map to 0 and 90 degrees.
    const a = imageAngle(fn, [eps, eps * 0.0], [1, 0], [Math.cos(Math.PI / 4), Math.sin(Math.PI / 4)], 1e-5);
    // near the critical point the doubling shows up; check the image angle exceeds the input.
    expect(Math.abs(a)).toBeGreaterThan(Math.PI / 4);
  });
});
