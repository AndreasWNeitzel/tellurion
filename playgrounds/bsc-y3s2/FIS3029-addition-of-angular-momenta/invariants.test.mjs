import { describe, it, expect } from 'vitest';
import { allowedJ, multiplicity, totalMultiplicityFromJ } from './sim.js';
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
    for (let j1 of [0.5, 1, 1.5, 2]) for (let j2 of [0.5, 1]) {
      expect(totalMultiplicityFromJ(j1, j2)).toBe(multiplicity(j1, j2));
    }
  });
  it('1+1: total = 9, decomposes to 1 + 3 + 5', () => {
    const j = allowedJ(1, 1);
    expect(j).toEqual([0, 1, 2]);
    expect(totalMultiplicityFromJ(1, 1)).toBe(9);
  });
});
