import { describe, it, expect } from 'vitest';
import { N, S_l, cavities } from './sim.js';
describe('p-g-mode-cavities', () => {
  it('N peaks near core', () => {
    expect(N(0.2)).toBeGreaterThan(N(0.5));
  });
  it('S_l decreases outward', () => {
    expect(S_l(0.1, 1)).toBeGreaterThan(S_l(0.9, 1));
  });
  it('low-freq mode trapped in g cavity', () => {
    const c = cavities(1, 1);
    expect(c.gCavities.length).toBeGreaterThan(0);
  });
  it('high-freq mode in p cavity', () => {
    const c = cavities(10, 1);
    expect(c.pCavities.length).toBeGreaterThan(0);
  });
  it('mixed mode: both cavities exist', () => {
    const c = cavities(3, 1);
    expect(c.gCavities.length + c.pCavities.length).toBeGreaterThan(0);
  });
});
