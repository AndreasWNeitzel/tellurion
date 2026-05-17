// Hydrogen Stark/Zeeman: the Rydberg ladder, no first-order Stark for
// n=1 (quadratic only), linear Stark for n=2, the equally-spaced
// Zeeman split linear in B, the normal-Zeeman triplet, dipole
// selection rules, and degeneracy restored at zero field.

import { describe, it, expect } from 'vitest';
import {
  RY, MU_B, STARK1, energyLevel, parabolicStates, starkLinear, starkGroundQuadratic,
  zeemanShift, sublevels, dipoleAllowed, zeemanTriplet, spectrumLines,
} from './sim.js';

describe('hydrogen-atom-stark-zeeman invariants', () => {
  it('unperturbed levels follow the Rydberg ladder E_n = -RY/n^2', () => {
    expect(energyLevel(1)).toBeCloseTo(-13.6057, 3);
    expect(energyLevel(2)).toBeCloseTo(-RY / 4, 9);
    expect(energyLevel(2) / energyLevel(1)).toBeCloseTo(0.25, 9);
    expect(energyLevel(1) - energyLevel(2)).toBeCloseTo(-10.204, 2);  // Lyman-alpha 10.2 eV
  });

  it('n=1 has NO first-order Stark shift; only a negative quadratic one', () => {
    const ps = parabolicStates(1);
    expect(ps).toEqual([{ n1: 0, n2: 0, m: 0 }]);                  // single state
    for (const F of [0.5, 1, 5, 20]) expect(starkLinear(1, 0, 0, F)).toBe(0);
    expect(starkGroundQuadratic(0)).toBe(0);
    const q1 = starkGroundQuadratic(2), q2 = starkGroundQuadratic(4);
    expect(q1).toBeLessThan(0);                                    // ground state pulled down
    expect(q2 / q1).toBeCloseTo(4, 9);                             // dE2 ~ F^2
  });

  it('n=2 splits linearly under Stark with the textbook +/- 3 e a0 F', () => {
    const ps = parabolicStates(2);
    expect(ps.length).toBe(4);                                     // (1,0,0)(0,1,0)(0,0,1)(0,0,-1)
    const F = 2;
    const shifts = ps.map(s => starkLinear(2, s.n1, s.n2, F));
    const ext = Math.max(...shifts);
    expect(ext).toBeCloseTo(3 * STARK1 * F, 9);                     // +3 e a0 F
    expect(Math.min(...shifts)).toBeCloseTo(-ext, 12);             // symmetric
    const mPM = ps.filter(s => Math.abs(s.m) === 1).map(s => starkLinear(2, s.n1, s.n2, F));
    for (const v of mPM) expect(v).toBe(0);                        // m=+/-1 unshifted
    expect(starkLinear(2, 1, 0, 4) / starkLinear(2, 1, 0, 2)).toBeCloseTo(2, 12);  // linear in F
  });

  it('normal Zeeman: equally spaced, linear in B, m=0 unshifted', () => {
    expect(zeemanShift(0, 3)).toBe(0);
    expect(zeemanShift(1, 1)).toBeCloseTo(MU_B, 12);
    expect(zeemanShift(2, 2) / zeemanShift(1, 1)).toBeCloseTo(4, 12);
    expect(zeemanShift(-1, 5)).toBeCloseTo(-zeemanShift(1, 5), 12);
    const B = 4;
    expect(zeemanShift(2, B) - zeemanShift(1, B)).toBeCloseTo(MU_B * B, 12);
    expect(sublevels(3, 2, 0).length).toBe(9);                     // sum 2l+1, l=0..2
  });

  it('the normal-Zeeman triplet has spacing mu_B B and collapses at B=0', () => {
    const E0 = 10.2, B = 6;
    const t = zeemanTriplet(E0, B);
    expect(t[1]).toBeCloseTo(E0, 12);
    expect(t[2] - t[1]).toBeCloseTo(MU_B * B, 12);
    expect(t[1] - t[0]).toBeCloseTo(MU_B * B, 12);
    const t0 = zeemanTriplet(E0, 0);
    expect(t0[0]).toBeCloseTo(E0, 12); expect(t0[2]).toBeCloseTo(E0, 12);
  });

  it('dipole selection rules: dl = +/-1 and |dm| <= 1', () => {
    expect(dipoleAllowed(1, 0, 0, 0)).toBe(true);                  // 2p -> 1s
    expect(dipoleAllowed(0, 0, 0, 0)).toBe(false);                 // 2s -> 1s (dl=0)
    expect(dipoleAllowed(2, 0, 0, 0)).toBe(false);                 // 3d -> 1s (dl=2)
    expect(dipoleAllowed(2, 1, 1, 0)).toBe(true);                  // 3d -> 2p
    expect(dipoleAllowed(1, 1, 2, -1)).toBe(false);                // dm = 2
    expect(dipoleAllowed(1, 1, 0, 0)).toBe(true);                  // dm = 1
  });

  it('zero field restores full degeneracy; fields lift it', () => {
    for (const n of [1, 2, 3, 4]) {
      for (const s of sublevels(n, 0, 0)) expect(s.E).toBeCloseTo(energyLevel(n), 12);
    }
    const z = sublevels(3, 5, 0).map(s => s.E);
    expect(Math.max(...z) - Math.min(...z)).toBeGreaterThan(0);
    const s2 = sublevels(2, 0, 3).map(s => s.E);
    expect(Math.max(...s2) - Math.min(...s2)).toBeGreaterThan(1e-6);
    const s1 = sublevels(1, 0, 3).map(s => s.E);
    expect(Math.max(...s1) - Math.min(...s1)).toBe(0);             // single n=1 state
    expect(s1[0]).toBeLessThan(energyLevel(1));                    // quadratic pull-down
  });

  it('synthetic Balmer-alpha line splits into a Zeeman triplet', () => {
    const lines = spectrumLines(3, 2, 4, 0);
    expect(lines.length).toBe(3);
    for (const e of lines) expect(e).toBeGreaterThan(0);
    expect(lines[2] - lines[0]).toBeCloseTo(2 * MU_B * 4, 9);
    const single = spectrumLines(3, 2, 0, 0);
    expect(single[0]).toBeCloseTo(single[2], 12);
    expect(single[1]).toBeCloseTo(energyLevel(3) - energyLevel(2), 9);  // E_upper - E_lower
  });
});
