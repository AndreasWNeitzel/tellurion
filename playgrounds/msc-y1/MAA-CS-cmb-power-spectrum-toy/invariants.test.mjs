import { describe, it, expect } from 'vitest';
import { Dl, firstPeakL, clFromDl, synthModes, fieldValue } from './sim.js';
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
  it('clFromDl inverts the D_l = l(l+1)C_l/2pi definition exactly and stays positive', () => {
    for (let l = 5; l <= 2500; l += 137) {
      const cl = clFromDl(l, 220, 2000);
      expect(cl).toBeGreaterThan(0);
      const back = l * (l + 1) * cl / (2 * Math.PI);
      expect(Math.abs(back - Dl(l, 220, 2000))).toBeLessThan(1e-9);
    }
  });
  it('synthesized patch is zero-mean with finite, non-degenerate variance (deterministic)', () => {
    const modes = synthModes(200, 220, 2000, 0xC0FFEE);
    expect(modes.length).toBe(200);
    const G = 24;
    let mean = 0; const vals = [];
    for (let iy = 0; iy < G; iy += 1) {
      for (let ix = 0; ix < G; ix += 1) {
        const f = fieldValue(modes, 200, ix / (G - 1), iy / (G - 1));
        vals.push(f); mean += f;
      }
    }
    mean /= vals.length;
    let v = 0;
    for (const x of vals) v += (x - mean) * (x - mean);
    v /= vals.length;
    expect(Math.abs(mean)).toBeLessThan(0.5);   // close to zero relative to ~O(1) std
    expect(v).toBeGreaterThan(0.05);            // real fluctuations, not flat
    expect(v).toBeLessThan(5);                  // 1/sqrt(N) normalisation keeps it O(1)
    expect(Number.isFinite(v)).toBe(true);
  });
});
