// Invariants for the quantum harmonic oscillator: equally spaced energies, the
// zero-point energy, normalized and orthogonal eigenstates, n nodes, the turning
// points, and the Schrodinger equation itself.

import { describe, it, expect } from 'vitest';
import { psi, prob, energy, turningPoint, potential, nodeCount, inner } from './sim.js';

describe('Energy levels', () => {
  it('E_n = (n + 1/2), equally spaced by hbar omega', () => {
    for (let n = 0; n <= 6; n += 1) expect(energy(n)).toBeCloseTo(n + 0.5, 12);
    for (let n = 0; n <= 6; n += 1) expect(energy(n + 1) - energy(n)).toBeCloseTo(1, 12);
  });
  it('the ground state has the zero-point energy 1/2', () => {
    expect(energy(0)).toBeCloseTo(0.5, 12);
  });
});

describe('Eigenstates are normalized and orthogonal', () => {
  it('integral psi_n^2 = 1', () => {
    for (const n of [0, 1, 3, 6, 10]) expect(inner(n, n)).toBeCloseTo(1, 2);
  });
  it('integral psi_m psi_n = 0 for m != n', () => {
    expect(inner(0, 2)).toBeCloseTo(0, 2); expect(inner(1, 4)).toBeCloseTo(0, 2); expect(inner(3, 5)).toBeCloseTo(0, 2);
  });
});

describe('Nodes and turning points', () => {
  it('psi_n has exactly n nodes', () => {
    for (let n = 0; n <= 8; n += 1) expect(nodeCount(n)).toBe(n);
  });
  it('the turning point satisfies V(x_t) = E_n', () => {
    for (const n of [0, 2, 5, 9]) expect(potential(turningPoint(n))).toBeCloseTo(energy(n), 9);
  });
});

describe('The eigenstates solve the Schrodinger equation', () => {
  it('-psi\'\'/2 + (x^2/2) psi = E_n psi', () => {
    const h = 1e-4;
    for (const n of [0, 2, 4]) for (const x of [0.3, 1.1, -0.8]) {
      const d2 = (psi(n, x + h) - 2 * psi(n, x) + psi(n, x - h)) / (h * h);
      const lhs = -0.5 * d2 + (x * x / 2) * psi(n, x);
      expect(lhs).toBeCloseTo(energy(n) * psi(n, x), 3);
    }
  });
});

describe('Probability density', () => {
  it('|psi_n|^2 is nonnegative and peaks inside the turning points', () => {
    const n = 6; const xt = turningPoint(n);
    expect(prob(n, 0)).toBeGreaterThanOrEqual(0);
    expect(prob(n, xt * 0.5)).toBeGreaterThan(0);
    expect(prob(n, xt + 1.5)).toBeLessThan(prob(n, xt * 0.5)); // decays beyond the turning point
  });
});
