// Invariants for quantum revivals: eigenstate orthonormality and energies, a normalized
// decomposition, conservation of the total probability in time, and the survival
// probability returning to 1 at the full revival time T_rev = 2 pi while dipping below 1
// in between.

import { describe, it, expect } from 'vitest';
import { eigenstate, energy, decompose, density, autocorrelation, T_REV } from './sim.js';

function inner(m, n, ng = 4000) { let s = 0; const dx = 1 / ng; for (let j = 0; j < ng; j += 1) { const x = (j + 0.5) * dx; s += eigenstate(m, x) * eigenstate(n, x) * dx; } return s; }
function norm(t, c, nMax, ng = 2000) { let s = 0; const dx = 1 / ng; for (let j = 0; j < ng; j += 1) s += density((j + 0.5) * dx, t, c.cRe, c.cIm, nMax) * dx; return s; }

describe('Eigenbasis', () => {
  it('the well eigenstates are orthonormal', () => {
    expect(inner(1, 1)).toBeCloseTo(1, 3); expect(inner(3, 3)).toBeCloseTo(1, 3);
    expect(inner(1, 2)).toBeCloseTo(0, 3); expect(inner(2, 5)).toBeCloseTo(0, 3);
  });
  it('the energies scale as n^2', () => { for (const n of [1, 2, 3, 7]) expect(energy(n)).toBe(n * n); });
});

describe('Decomposition', () => {
  it('the coefficients of a normalized packet sum to 1', () => {
    const c = decompose(0.5, 12, 0.06, 40);
    let s = 0; for (let n = 1; n <= 40; n += 1) s += c.p2[n];
    expect(s).toBeCloseTo(1, 2);
  });
});

describe('Probability conservation', () => {
  it('the total probability stays 1 as the packet evolves', () => {
    const c = decompose(0.4, 8, 0.06, 40);
    for (const t of [0, 0.7, 1.9, 3.5]) expect(norm(t, c, 40)).toBeCloseTo(1, 2);
  });
});

describe('Revivals', () => {
  it('the survival probability is 1 at t=0 and at the full revival T_rev', () => {
    const c = decompose(0.5, 10, 0.06, 40);
    expect(autocorrelation(0, c.p2, 40)).toBeCloseTo(1, 6);
    expect(autocorrelation(T_REV, c.p2, 40)).toBeCloseTo(1, 6);
  });
  it('the survival probability drops below 1 between revivals', () => {
    const c = decompose(0.5, 10, 0.06, 40);
    expect(autocorrelation(T_REV * 0.37, c.p2, 40)).toBeLessThan(0.7);
  });
});
