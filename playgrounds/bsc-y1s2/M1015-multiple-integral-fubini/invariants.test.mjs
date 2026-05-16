import { describe, it, expect } from 'vitest';
import { dxDy, dyDx, exact, innerX, innerY, fAt } from './sim.js';

describe('fubini inner integrals', () => {
  function trap(fn, a, b, n) { let s = 0; for (let k = 1; k <= n; k += 1) { const x0 = a + (b - a) * (k - 1) / n, x1 = a + (b - a) * k / n; s += 0.5 * (fn(x0) + fn(x1)) * (x1 - x0); } return s; }
  it('integrating innerX over y recovers the double integral', () => {
    const A = 2.0, B = 1.7;
    expect(Math.abs(trap((y) => innerX(y, A, 200), 0, B, 400) - dxDy(200, 0, A, 0, B))).toBeLessThan(1e-3);
  });
  it('integrating innerY over x recovers the double integral', () => {
    const A = 2.0, B = 1.7;
    expect(Math.abs(trap((x) => innerY(x, B, 200), 0, A, 400) - dyDx(200, 0, A, 0, B))).toBeLessThan(1e-3);
  });
  it('fAt is sin x cos y', () => {
    expect(fAt(1, 0.5)).toBeCloseTo(Math.sin(1) * Math.cos(0.5), 12);
  });
});

describe('multiple-integral-fubini', () => {
  it('dx dy and dy dx agree on the full square', () => expect(Math.abs(dxDy() - dyDx())).toBeLessThan(1e-6));
  it('matches exact value', () => expect(Math.abs(dxDy() - exact())).toBeLessThan(1e-4));
  it('shrinking domain shrinks integral proportionally', () => expect(Math.abs(dxDy(200, 0, Math.PI / 2, 0, Math.PI / 2) - exact(0, Math.PI / 2, 0, Math.PI / 2))).toBeLessThan(1e-4));
  it('exact on full domain = 0 (cos pi - cos 0 = -2, sin pi - sin 0 = 0)', () => expect(Math.abs(exact())).toBeLessThan(1e-12));
});
