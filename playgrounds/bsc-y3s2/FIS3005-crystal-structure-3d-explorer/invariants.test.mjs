// Cubic crystals: reciprocal-lattice orthonormality b_i.a_j = 2pi
// delta_ij, the reciprocal volume relation, cubic interplanar
// spacings, the SC/BCC/FCC structure-factor absences and powder
// line sequences, atoms per cell, Bragg consistency, and the
// Brillouin-zone face counts.

import { describe, it, expect } from 'vitest';
import {
  primitiveVectors, cellVolume, reciprocalVectors, basis,
  atomsPerConventionalCell, dSpacing, structureFactor, isAllowed,
  powderLines, bzFaceCount,
} from './sim.js';

const close = (a, b, t = 1e-10) => expect(Math.abs(a - b)).toBeLessThan(t);
const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

describe('crystal-structure-3d-explorer invariants', () => {
  it('b_i . a_j = 2 pi delta_ij for SC, BCC, FCC', () => {
    for (const kind of ['sc', 'bcc', 'fcc']) {
      const A = primitiveVectors(kind), B = reciprocalVectors(A);
      for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) {
        close(dot(B[i], A[j]), i === j ? 2 * Math.PI : 0, 1e-10);
      }
    }
  });

  it('reciprocal cell volume is (2 pi)^3 / V_direct', () => {
    for (const kind of ['sc', 'bcc', 'fcc']) {
      const A = primitiveVectors(kind);
      const Vd = cellVolume(A), Vr = cellVolume(reciprocalVectors(A));
      close(Vr, (2 * Math.PI) ** 3 / Vd, 1e-9);
    }
  });

  it('cubic interplanar spacings d100 = a, d110 = a/sqrt2, d111 = a/sqrt3', () => {
    close(dSpacing(1, 0, 0, 1), 1, 1e-12);
    close(dSpacing(1, 1, 0, 1), 1 / Math.SQRT2, 1e-12);
    close(dSpacing(1, 1, 1, 1), 1 / Math.sqrt(3), 1e-12);
    close(dSpacing(2, 0, 0, 4), 2, 1e-12);              // a=4 -> d200 = 2
    expect(dSpacing(0, 0, 0)).toBe(Infinity);
  });

  it('structure-factor absences: SC none, BCC h+k+l even, FCC same parity', () => {
    for (const [h, k, l] of [[1, 0, 0], [1, 1, 0], [1, 1, 1], [2, 0, 0]]) {
      expect(isAllowed('sc', h, k, l)).toBe(true);      // SC: every reflection
    }
    expect(isAllowed('bcc', 1, 0, 0)).toBe(false);      // h+k+l = 1 odd
    expect(isAllowed('bcc', 1, 1, 0)).toBe(true);       // = 2 even
    expect(isAllowed('bcc', 1, 1, 1)).toBe(false);      // = 3 odd
    expect(isAllowed('fcc', 1, 0, 0)).toBe(false);      // mixed parity
    expect(isAllowed('fcc', 1, 1, 1)).toBe(true);       // all odd
    expect(isAllowed('fcc', 2, 0, 0)).toBe(true);       // all even
    expect(isAllowed('fcc', 2, 1, 0)).toBe(false);      // mixed
    close(structureFactor('fcc', 1, 1, 1), 4, 1e-9);    // 4 atoms in phase
    close(structureFactor('bcc', 1, 0, 0), 0, 1e-9);
  });

  it('first powder lines: SC 1,2,3,4..; BCC 2,4,6..; FCC 3,4,8,11', () => {
    const seq = (k) => powderLines(k, 4, 1.0, 12).map((p) => p.s);
    expect(seq('sc').slice(0, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(seq('bcc').slice(0, 4)).toEqual([2, 4, 6, 8]);
    expect(seq('fcc').slice(0, 4)).toEqual([3, 4, 8, 11]);
  });

  it('atoms per conventional cell: SC 1, BCC 2, FCC 4', () => {
    expect(atomsPerConventionalCell('sc')).toBe(1);
    expect(atomsPerConventionalCell('bcc')).toBe(2);
    expect(atomsPerConventionalCell('fcc')).toBe(4);
    expect(basis('fcc').length).toBe(4);
  });

  it('Bragg consistency: 2 d sin(theta) = lambda for every line', () => {
    for (const kind of ['sc', 'bcc', 'fcc']) {
      for (const p of powderLines(kind, 4, 1.2, 12)) {
        close(2 * p.d * Math.sin(p.twoTheta / 2), 1.2, 1e-9);
      }
    }
    // smaller s (larger d) diffracts at a smaller angle
    const ls = powderLines('sc', 4, 1.0, 12);
    for (let i = 1; i < ls.length; i += 1) expect(ls[i].twoTheta).toBeGreaterThan(ls[i - 1].twoTheta);
  });

  it('Brillouin-zone face counts: SC 6, BCC 12, FCC 14', () => {
    expect(bzFaceCount('sc')).toBe(6);                   // cube
    expect(bzFaceCount('bcc')).toBe(12);                 // rhombic dodecahedron
    expect(bzFaceCount('fcc')).toBe(14);                 // truncated octahedron
  });

  it('SC reciprocal of SC is SC with spacing 2 pi / a', () => {
    const B = reciprocalVectors([[2, 0, 0], [0, 2, 0], [0, 0, 2]]);
    close(B[0][0], Math.PI, 1e-12);                      // 2pi / a, a = 2
    close(B[1][1], Math.PI, 1e-12);
    close(dot(B[0], B[1]), 0, 1e-12);
  });
});
