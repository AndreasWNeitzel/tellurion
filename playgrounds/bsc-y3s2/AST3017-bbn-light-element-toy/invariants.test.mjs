import { describe, it, expect } from 'vitest';
import { Yp, DH, Li7H, ETA_PLANCK } from './sim.js';
describe('bbn-light-element-toy', () => {
  it('Y_p ~ 0.247 at Planck eta', () => {
    expect(Math.abs(Yp(ETA_PLANCK) - 0.248)).toBeLessThan(0.01);
  });
  it('D/H decreases with eta', () => {
    expect(DH(8)).toBeLessThan(DH(4));
  });
  it('Y_p increases with eta', () => {
    expect(Yp(8)).toBeGreaterThan(Yp(3));
  });
  it('7Li/H increases with eta', () => {
    expect(Li7H(8)).toBeGreaterThan(Li7H(3));
  });
  it('D/H ~ 2.5e-5 at Planck eta', () => {
    const v = DH(ETA_PLANCK);
    expect(v).toBeGreaterThan(2e-5);
    expect(v).toBeLessThan(3e-5);
  });
});
