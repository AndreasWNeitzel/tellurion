// Invariants: every sequence converges pointwise, but only the uniform one has a
// sup-norm going to zero; the others keep a fixed-height or growing bump, and x^n
// limits to a discontinuous step.

import { describe, it, expect } from 'vitest';
import { FUNCS, supNorm } from './sim.js';

describe('Every sequence converges pointwise', () => {
  for (const key of Object.keys(FUNCS)) {
    it(`${key}: f_n(x0) -> f(x0) at an interior point`, () => {
      const f = FUNCS[key]; const x0 = key === 'power' ? 0.6 : 0.7;
      const far = f.fn(x0, 400);
      expect(Math.abs(far - f.flim(x0))).toBeLessThan(1e-2);
    });
  }
});

describe('Uniform convergence iff the sup-norm vanishes', () => {
  it('the ramp converges uniformly (sup-norm -> 0)', () => {
    expect(supNorm('ramp', 2).sup).toBeGreaterThan(supNorm('ramp', 50).sup);
    expect(supNorm('ramp', 200).sup).toBeLessThan(0.02);
  });
  it('x^n does not converge uniformly (sup-norm stays ~1)', () => {
    for (const n of [3, 10, 30]) expect(supNorm('power', n).sup).toBeCloseTo(1, 1);
  });
  it('the sliding bump keeps height ~1 (sup-norm bounded away from 0)', () => {
    for (const n of [2, 10, 40]) expect(supNorm('witch', n).sup).toBeCloseTo(1, 2);
  });
  it('the tall bump grows without bound (sup-norm -> inf)', () => {
    expect(supNorm('tall', 30).sup).toBeGreaterThan(supNorm('tall', 5).sup);
    expect(supNorm('tall', 50).sup).toBeGreaterThan(2);
  });
});

describe('The bump slides toward the edge as n grows', () => {
  it('witch: the argmax moves toward 0 like 1/n', () => {
    expect(supNorm('witch', 20).x).toBeLessThan(supNorm('witch', 4).x);
    expect(supNorm('witch', 20).x).toBeCloseTo(1 / 20, 2);
  });
});

describe('Pointwise limit can be discontinuous', () => {
  it('x^n limits to 0 below 1 and 1 at 1', () => {
    expect(FUNCS.power.flim(0.5)).toBe(0);
    expect(FUNCS.power.flim(1)).toBe(1);
  });
});
