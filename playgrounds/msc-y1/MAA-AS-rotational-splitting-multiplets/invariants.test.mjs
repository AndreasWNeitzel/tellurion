import { describe, it, expect } from 'vitest';
import { ledoux, splittedFreq } from './sim.js';
describe('rotational-splitting-multiplets', () => {
  it('Ledoux for p-mode is 0', () => {
    expect(ledoux(1, false)).toBe(0);
  });
  it('Ledoux for g-mode l=1 is 1/2', () => {
    expect(ledoux(1, true)).toBe(0.5);
  });
  it('p-mode: splitting = m Omega', () => {
    expect(splittedFreq(100, 1, 0.5, 1, false) - 100).toBeCloseTo(0.5, 10);
  });
  it('g-mode l=1: splitting = m Omega / 2', () => {
    expect(splittedFreq(100, 1, 0.5, 1, true) - 100).toBeCloseTo(0.25, 10);
  });
  it('Antisymmetric: m=+1 and m=-1 split symmetrically around m=0', () => {
    const p = splittedFreq(100, 1, 0.5, 1, false), n = splittedFreq(100, -1, 0.5, 1, false);
    expect(Math.abs((p + n) / 2 - 100)).toBeLessThan(1e-9);
  });
});
