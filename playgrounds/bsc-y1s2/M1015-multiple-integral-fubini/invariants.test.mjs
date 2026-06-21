import { describe, it, expect } from 'vitest';
import {
  INTEGRANDS, integrand, fAt, areaAtX, areaAtY, iterate, exactValue,
} from './sim.js';

const PI = Math.PI;
const IDS = Object.keys(INTEGRANDS);

function trap(fn, a, b, n) {
  let s = 0;
  for (let k = 1; k <= n; k += 1) {
    const x0 = a + (b - a) * (k - 1) / n, x1 = a + (b - a) * k / n;
    s += 0.5 * (fn(x0) + fn(x1)) * (x1 - x0);
  }
  return s;
}

describe('fubini: both orders agree (the theorem)', () => {
  for (const id of IDS) {
    it(`${id}: |V(dxdy) - V(dydx)| < 1e-6 on the full square`, () => {
      const a = iterate(id, 'dxdy', 0, PI, 0, PI, 200);
      const b = iterate(id, 'dydx', 0, PI, 0, PI, 200);
      expect(Math.abs(a - b)).toBeLessThan(1e-6);
    });
    it(`${id}: orders agree on a sub-rectangle`, () => {
      const A = 2.0, B = 1.7;
      const a = iterate(id, 'dxdy', 0, A, 0, B, 200);
      const b = iterate(id, 'dydx', 0, A, 0, B, 200);
      expect(Math.abs(a - b)).toBeLessThan(1e-6);
    });
  }
});

describe('fubini: integrands are non-negative on the domain', () => {
  for (const id of IDS) {
    it(`${id}: f >= 0 on [0,pi]^2`, () => {
      for (let i = 0; i <= 12; i += 1) for (let j = 0; j <= 12; j += 1) {
        expect(fAt(id, PI * i / 12, PI * j / 12)).toBeGreaterThanOrEqual(-1e-12);
      }
    });
  }
});

describe('fubini: quadrature matches the closed form', () => {
  it('dome: (cosA-cosB)(cosC-cosD)', () => {
    const v = iterate('dome', 'dydx', 0, 2.0, 0, 1.7, 200);
    expect(Math.abs(v - exactValue('dome', 0, 2.0, 0, 1.7))).toBeLessThan(1e-5);
  });
  it('slant: (B^2-A^2)/2 * (cosC-cosD) / 2', () => {
    const v = iterate('slant', 'dxdy', 0, 2.0, 0, 1.7, 200);
    expect(Math.abs(v - exactValue('slant', 0, 2.0, 0, 1.7))).toBeLessThan(1e-6);
  });
});

describe('fubini: stacking the cross-sections recovers the volume', () => {
  for (const id of IDS) {
    it(`${id}: integral of A(x)=int f dy over x equals V`, () => {
      const A = 2.0, B = 1.7;
      const stack = trap((x) => areaAtX(id, x, 0, B, 200), 0, A, 400);
      expect(Math.abs(stack - iterate(id, 'dydx', 0, A, 0, B, 200))).toBeLessThan(1e-3);
    });
    it(`${id}: integral of A(y)=int f dx over y equals V`, () => {
      const A = 2.0, B = 1.7;
      const stack = trap((y) => areaAtY(id, y, 0, A, 200), 0, B, 400);
      expect(Math.abs(stack - iterate(id, 'dxdy', 0, A, 0, B, 200))).toBeLessThan(1e-3);
    });
  }
});
