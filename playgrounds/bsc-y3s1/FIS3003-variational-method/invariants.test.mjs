// Invariants for the variational principle: the energy is an upper bound on the exact
// ground state, the minimum is at a* = 8/(9 pi) with value -4/(3 pi), the bound is never
// reached (Gaussian misses the cusp), the trial wavefunction is normalized, and the
// virial theorem holds at the optimum.

import { describe, it, expect } from 'vitest';
import { E0_EXACT, ALPHA_OPT, kinetic, potential, energy, trialPsi, exactPsi } from './sim.js';

function norm3d(fn) { let s = 0; const dr = 0.002, R = 30; for (let r = dr / 2; r < R; r += dr) { const p = fn(r); s += 4 * Math.PI * r * r * p * p * dr; } return s; }

describe('Variational bound', () => {
  it('the trial energy never drops below the exact ground state', () => {
    for (let a = 0.02; a <= 1.2; a += 0.02) expect(energy(a)).toBeGreaterThanOrEqual(E0_EXACT - 1e-9);
  });
  it('the minimum is at a* = 8/(9 pi) with energy -4/(3 pi)', () => {
    expect(ALPHA_OPT).toBeCloseTo(0.28294, 4);
    expect(energy(ALPHA_OPT)).toBeCloseTo(-4 / (3 * Math.PI), 9);
    // numeric argmin matches the analytic optimum
    let best = Infinity, ba = 0; for (let a = 0.05; a <= 0.8; a += 0.0005) { const e = energy(a); if (e < best) { best = e; ba = a; } }
    expect(ba).toBeCloseTo(ALPHA_OPT, 2);
  });
  it('the bound is strictly above the exact energy (cusp cannot be matched)', () => {
    expect(energy(ALPHA_OPT)).toBeGreaterThan(E0_EXACT);
    expect(energy(ALPHA_OPT)).toBeCloseTo(-0.4244, 3);
  });
});

describe('Wavefunctions', () => {
  it('the trial and exact wavefunctions are normalized', () => {
    expect(norm3d((r) => trialPsi(r, ALPHA_OPT))).toBeCloseTo(1, 2);
    expect(norm3d(exactPsi)).toBeCloseTo(1, 2);
  });
});

describe('Energy decomposition', () => {
  it('kinetic is positive, potential negative, and the virial 2<T> = -<V> holds at the optimum', () => {
    expect(kinetic(ALPHA_OPT)).toBeGreaterThan(0);
    expect(potential(ALPHA_OPT)).toBeLessThan(0);
    expect(2 * kinetic(ALPHA_OPT)).toBeCloseTo(-potential(ALPHA_OPT), 9);
  });
});
