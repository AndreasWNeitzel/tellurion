import { describe, it, expect } from 'vitest';
import { allowedJ, multiplicity, totalMultiplicityFromJ, casimir, cosTheta12 } from './sim.js';
describe('addition-of-angular-momenta', () => {
  it('two spin-1/2: J = 0 or 1', () => {
    const j = allowedJ(0.5, 0.5);
    expect(j).toEqual([0, 1]);
  });
  it('spin-1 + spin-1/2: J = 1/2 or 3/2', () => {
    const j = allowedJ(1, 0.5);
    expect(j).toEqual([0.5, 1.5]);
  });
  it('total state count = (2j1+1)(2j2+1) for any j1, j2', () => {
    for (const j1 of [0.5, 1, 1.5, 2]) for (const j2 of [0.5, 1]) {
      expect(totalMultiplicityFromJ(j1, j2)).toBe(multiplicity(j1, j2));
    }
  });
  it('1+1: total = 9, decomposes to 1 + 3 + 5', () => {
    const j = allowedJ(1, 1);
    expect(j).toEqual([0, 1, 2]);
    expect(totalMultiplicityFromJ(1, 1)).toBe(9);
  });
  it('equal spins coupling to the singlet are exactly antiparallel', () => {
    for (const j of [0.5, 1, 1.5, 2]) {
      expect(cosTheta12(j, j, 0)).toBeCloseTo(-1, 12);
    }
  });
  it('stretched state: cos theta_12 = sqrt(j1 j2 / ((j1+1)(j2+1)))', () => {
    for (const [j1, j2] of [[0.5, 0.5], [1, 0.5], [1.5, 1], [2, 1]]) {
      const expected = Math.sqrt((j1 * j2) / ((j1 + 1) * (j2 + 1)));
      expect(cosTheta12(j1, j2, j1 + j2)).toBeCloseTo(expected, 12);
    }
  });
  it('vector-model law of cosines reproduces J(J+1), cos monotonic in J', () => {
    const j1 = 1.5, j2 = 1;
    let prev = -Infinity;
    for (const J of allowedJ(j1, j2)) {
      const rhs = casimir(j1) + casimir(j2)
        + 2 * Math.sqrt(casimir(j1) * casimir(j2)) * cosTheta12(j1, j2, J);
      expect(rhs).toBeCloseTo(casimir(J), 10);
      const c = cosTheta12(j1, j2, J);
      expect(c).toBeGreaterThan(prev);
      prev = c;
    }
  });
});
