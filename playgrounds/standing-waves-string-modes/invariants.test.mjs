// Standing-waves invariants.
// (a) Boundary conditions: y(0, t) = y(L, t) = 0 for all t and n.
// (b) Fundamental frequency: f_1 = c / (2 L).
// (c) Harmonic ratio: f_n = n f_1 exact.
// (d) Antinode count: mode n has n antinodes; node count is n - 1 interior.
// (e) Antinode positions: x_k = (2k - 1) L / (2 n).
// (f) Symmetry: y_n(L - x, t) = (-1)^(n - 1) y_n(x, t).

import { describe, it, expect } from 'vitest';
import { yMode, freqN, antinodes, nodes, L, C } from './sim.js';

describe('Standing waves: boundary conditions', () => {
  it('y(0, t) = y(L, t) = 0 for all t and n', () => {
    for (let n = 1; n <= 5; n += 1) {
      for (let i = 0; i < 20; i += 1) {
        const t = i * 0.1;
        expect(Math.abs(yMode(0, t, n))).toBeLessThan(1e-12);
        expect(Math.abs(yMode(L, t, n))).toBeLessThan(1e-12);
      }
    }
  });
});

describe('Standing waves: fundamental frequency', () => {
  it('f_1 = c / (2 L) exact', () => {
    expect(freqN(1)).toBeCloseTo(C / (2 * L), 12);
  });
});

describe('Standing waves: harmonic ratios', () => {
  it('f_n = n f_1 exact for n = 1..7', () => {
    for (let n = 1; n <= 7; n += 1) {
      expect(freqN(n)).toBeCloseTo(n * freqN(1), 12);
    }
  });
});

describe('Standing waves: antinode count', () => {
  it('mode n has n antinodes and n - 1 interior nodes', () => {
    for (let n = 1; n <= 6; n += 1) {
      expect(antinodes(n).length).toBe(n);
      expect(nodes(n).length).toBe(n - 1);
    }
  });
});

describe('Standing waves: antinode positions', () => {
  it('antinode x_k = (2k - 1) L / (2n) exact', () => {
    for (const n of [2, 3, 4]) {
      const a = antinodes(n);
      for (let k = 1; k <= n; k += 1) {
        expect(a[k - 1]).toBeCloseTo((2 * k - 1) * L / (2 * n), 12);
      }
    }
  });
});

describe('Standing waves: parity / symmetry', () => {
  it('y_n(L - x, t) = (-1)^(n - 1) y_n(x, t)', () => {
    for (let n = 1; n <= 5; n += 1) {
      for (let i = 0; i < 10; i += 1) {
        const x = (i + 1) / 11 * L;
        const t = i * 0.07;
        const left = yMode(L - x, t, n);
        const right = ((n % 2 === 1) ? 1 : -1) * yMode(x, t, n);
        expect(Math.abs(left - right)).toBeLessThan(1e-12);
      }
    }
  });
});
