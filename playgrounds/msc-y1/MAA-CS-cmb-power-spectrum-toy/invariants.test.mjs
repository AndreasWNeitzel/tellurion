import { describe, it, expect } from 'vitest';
import { Dl, firstPeakL } from './sim.js';
describe('cmb-power-spectrum-toy', () => {
  it('Dl > 0 for l in [2, 3000]', () => {
    for (let l = 2; l <= 3000; l += 100) expect(Dl(l)).toBeGreaterThan(0);
  });
  it('Damping tail: Dl(3000) << Dl(1000)', () => {
    expect(Dl(3000)).toBeLessThan(Dl(1000));
  });
  it('First peak near l=220 for Omega_m=0.3', () => {
    expect(Math.abs(firstPeakL(0.3) - 220)).toBeLessThan(0.1);
  });
});
