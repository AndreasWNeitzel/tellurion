// Invariants for the critical-point / Hessian playground: the listed points are
// critical, the classification matches the eigenvalue signs, and the
// eigenvectors satisfy H v = lambda v.

import { describe, it, expect } from 'vitest';
import { FUNCS, classify, eigvec, gradNorm } from './sim.js';

describe('The listed critical points have zero gradient', () => {
  for (const key of Object.keys(FUNCS)) {
    it(`${key}`, () => {
      const f = FUNCS[key];
      for (const [x, y] of f.crit) expect(gradNorm(f, x, y)).toBeLessThan(1e-9);
    });
  }
});

describe('Classification matches the known types', () => {
  it('bowl is a minimum, saddle is a saddle', () => {
    expect(classify(FUNCS.bowl.hess(0, 0)).type).toBe('min');
    expect(classify(FUNCS.saddle.hess(0, 0)).type).toBe('saddle');
  });
  it('the four-critical-point field has a min, a max, and two saddles', () => {
    const f = FUNCS.four;
    const types = f.crit.map(([x, y]) => classify(f.hess(x, y)).type);
    expect(types).toContain('min');
    expect(types).toContain('max');
    expect(types.filter((t) => t === 'saddle').length).toBe(2);
    // (1,1) is the min, (-1,-1) the max
    expect(classify(f.hess(1, 1)).type).toBe('min');
    expect(classify(f.hess(-1, -1)).type).toBe('max');
  });
  it('the monkey saddle is degenerate at the origin (det = 0)', () => {
    const c = classify(FUNCS.monkey.hess(0, 0));
    expect(c.det).toBeCloseTo(0, 9);
    expect(c.type).toBe('degenerate');
  });
});

describe('Eigen-decomposition', () => {
  it('eigenvalue and trace/det are consistent', () => {
    const c = classify([3, 1, 2]);                 // hxx=3, hxy=1, hyy=2
    expect(c.tr).toBeCloseTo(5, 12);
    expect(c.det).toBeCloseTo(3 * 2 - 1, 12);
    expect(c.l1 + c.l2).toBeCloseTo(c.tr, 9);
    expect(c.l1 * c.l2).toBeCloseTo(c.det, 9);
  });
  it('H v = lambda v for each eigenvector', () => {
    const H = [3, 1, 2]; const c = classify(H);
    for (const lam of [c.l1, c.l2]) {
      const v = eigvec(H, lam);
      const Hv = [H[0] * v[0] + H[1] * v[1], H[1] * v[0] + H[2] * v[1]];
      expect(Hv[0]).toBeCloseTo(lam * v[0], 6);
      expect(Hv[1]).toBeCloseTo(lam * v[1], 6);
    }
  });
});
