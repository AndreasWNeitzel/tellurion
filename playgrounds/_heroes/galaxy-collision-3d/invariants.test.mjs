import { describe, it, expect } from 'vitest';
import { makeTwoGalaxies, leapfrog } from './sim.js';

describe('galaxy-collision-3d', () => {
  it('two cores positioned at +/- d/2', () => {
    const s = makeTwoGalaxies({ N_disk: 50, d: 4.0 });
    const N_each = 50 + 1;
    expect(s.x[0]).toBe(-2.0);
    expect(s.x[1]).toBe(0);
    expect(s.x[2 * N_each]).toBe(2.0);
    expect(s.x[2 * N_each + 1]).toBe(0);
  });

  it('cores have opposite y-velocity', () => {
    const s = makeTwoGalaxies({ N_disk: 50, V: 0.5 });
    const N_each = 50 + 1;
    expect(s.v[1]).toBeCloseTo(0.5, 9);
    expect(s.v[2 * N_each + 1]).toBeCloseTo(-0.5, 9);
  });

  it('disk stars are within R_max of their core', () => {
    const N_disk = 200;
    const s = makeTwoGalaxies({ N_disk, d: 4.0, R_max: 1.0 });
    const N_each = N_disk + 1;
    const c0x = s.x[0], c0y = s.x[1];
    for (let k = 1; k < N_each; k += 1) {
      const dx = s.x[2 * k] - c0x, dy = s.x[2 * k + 1] - c0y;
      const r = Math.sqrt(dx * dx + dy * dy);
      expect(r).toBeLessThan(1.5);     // some slop
    }
  });

  it('reproducible from seed', () => {
    const a = makeTwoGalaxies({ N_disk: 100, seed: 1 });
    const b = makeTwoGalaxies({ N_disk: 100, seed: 1 });
    for (let i = 0; i < a.x.length; i += 1) expect(a.x[i]).toBe(b.x[i]);
  });

  it('leapfrog integrates without nans', () => {
    const s = makeTwoGalaxies({ N_disk: 200 });
    for (let n = 0; n < 200; n += 1) leapfrog(s, 0.006, { use_tree: true, theta: 0.7, G: 1, eps: 0.04 });
    for (let i = 0; i < s.x.length; i += 1) expect(Number.isFinite(s.x[i])).toBe(true);
  });

  it('cores approach each other over time', () => {
    const s = makeTwoGalaxies({ N_disk: 200, d: 4.0, V: 0.5 });
    const N_each = 200 + 1;
    function sep() {
      const dx = s.x[2 * N_each] - s.x[0];
      const dy = s.x[2 * N_each + 1] - s.x[1];
      return Math.sqrt(dx * dx + dy * dy);
    }
    const sep0 = sep();
    let minSep = sep0;
    for (let n = 0; n < 400; n += 1) {
      leapfrog(s, 0.006, { use_tree: true, theta: 0.7, G: 1, eps: 0.04 });
      const sNow = sep();
      if (sNow < minSep) minSep = sNow;
    }
    // Some part of the trajectory has the cores closer than at t=0.
    expect(minSep).toBeLessThan(sep0);
  });

  it('Barnes-Hut evals < direct for N > 200', () => {
    const s = makeTwoGalaxies({ N_disk: 300 });
    leapfrog(s, 0.006, { use_tree: true, theta: 0.7, G: 1, eps: 0.04 });
    expect(s.evals).toBeLessThan(s.N * (s.N - 1));
  });
});
