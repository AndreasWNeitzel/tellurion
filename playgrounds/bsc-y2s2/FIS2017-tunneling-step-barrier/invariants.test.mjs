// Invariants for barrier tunneling: probability conservation T + R = 1, the
// integrated wavefunction reproduces the closed-form T, tunneling falls with
// barrier width, and above the barrier there are perfect-transmission resonances.

import { describe, it, expect } from 'vitest';
import { transmission, reflection, resonanceEnergies, waveProfile } from './sim.js';

describe('Probability current is conserved', () => {
  it('T + R = 1 across regimes', () => {
    for (const E of [0.3, 1.0, 2.0, 4.0, 8.0]) expect(transmission(E, 2, 1.5) + reflection(E, 2, 1.5)).toBeCloseTo(1, 12);
  });
});

describe('The integrated wavefunction reproduces the closed-form transmission', () => {
  for (const [E, V0, L] of [[0.6, 2, 1.2], [1.5, 2, 1.0], [5, 2, 1.3]]) {
    it(`E=${E}, V0=${V0}, L=${L}`, () => {
      const w = waveProfile(E, V0, L, 1600);
      expect(w.T).toBeCloseTo(transmission(E, V0, L), 2);
      expect(w.T + w.R).toBeCloseTo(1, 6);
    });
  }
});

describe('Tunneling: E < V0', () => {
  it('transmission is below one and falls as the barrier widens', () => {
    const E = 0.7, V0 = 2;
    expect(transmission(E, V0, 1.0)).toBeLessThan(1);
    expect(transmission(E, V0, 2.0)).toBeLessThan(transmission(E, V0, 1.0));
    expect(transmission(E, V0, 3.0)).toBeLessThan(transmission(E, V0, 2.0));
  });
  it('a thicker or taller barrier suppresses tunneling', () => {
    expect(transmission(0.5, 3, 2)).toBeLessThan(transmission(0.5, 1.5, 2));
  });
});

describe('Above the barrier: resonances', () => {
  it('T = 1 exactly at the resonance energies k2 L = n pi', () => {
    const V0 = 2, L = 1.5; const res = resonanceEnergies(V0, L, 30);
    expect(res.length).toBeGreaterThan(2);
    for (const E of res) expect(transmission(E, V0, L)).toBeCloseTo(1, 9);
  });
  it('between resonances the transmission dips below one', () => {
    const V0 = 2, L = 1.5; const res = resonanceEnergies(V0, L, 30);
    const mid = 0.5 * (res[0] + res[1]);
    expect(transmission(mid, V0, L)).toBeLessThan(1);
  });
});
