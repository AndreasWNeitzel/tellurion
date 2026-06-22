// Invariants for Franck-Hertz: the collision count and leftover energy, the
// periodic dips in the current spaced by the excitation energy, the excitation
// layers, and the overall rising trend.

import { describe, it, expect } from 'vitest';
import { collisionCount, idealFinalKE, passFraction, current, excitationLayers } from './sim.js';

const Eexc = 4.9, Vr = 1.5, mfp = 0.07;

describe('Energy bookkeeping', () => {
  it('collision count is floor(V / E_exc)', () => {
    expect(collisionCount(4, Eexc)).toBe(0); expect(collisionCount(5, Eexc)).toBe(1); expect(collisionCount(10, Eexc)).toBe(2); expect(collisionCount(15, Eexc)).toBe(3);
  });
  it('leftover energy is V mod E_exc in [0, E_exc)', () => {
    for (const V of [3, 7, 12, 16]) { const k = idealFinalKE(V, Eexc); expect(k).toBeGreaterThanOrEqual(0); expect(k).toBeLessThan(Eexc); expect(k).toBeCloseTo(V - collisionCount(V, Eexc) * Eexc, 9); }
  });
});

describe('The current dips periodically (spacing = E_exc)', () => {
  it('just above each multiple the pass fraction is low; mid-interval it is high', () => {
    for (const n of [1, 2, 3]) {
      const justAbove = passFraction(n * Eexc + 0.25, Eexc, Vr, mfp, 500, 0xABCD);
      const mid = passFraction(n * Eexc + 0.6 * Eexc, Eexc, Vr, mfp, 500, 0xABCD);
      expect(mid).toBeGreaterThan(justAbove);
    }
  });
  it('below the first excitation the electrons pass freely', () => {
    expect(passFraction(3.5, Eexc, Vr, mfp, 500)).toBeGreaterThan(0.9); // V between Vr and Eexc
    expect(passFraction(1.0, Eexc, Vr, mfp, 500)).toBeLessThan(0.1); // V below Vr
  });
});

describe('The current rises overall (collection efficiency)', () => {
  it('the envelope grows with V', () => {
    // compare maxima near mid-intervals at increasing n.
    const a = current(0.6 * Eexc, Eexc, Vr, mfp), b = current(2.6 * Eexc, Eexc, Vr, mfp);
    expect(b).toBeGreaterThan(a);
  });
});

describe('Excitation layers', () => {
  it('there are floor(V/E_exc) layers, equally spaced in x', () => {
    const V = 3.2 * Eexc; const L = excitationLayers(V, Eexc);
    expect(L.length).toBe(3);
    expect(L[1] - L[0]).toBeCloseTo(L[0], 9); // equally spaced by E_exc/V
    for (const x of L) { expect(x).toBeGreaterThan(0); expect(x).toBeLessThan(1); }
  });
});
