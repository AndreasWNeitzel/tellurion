import { describe, it, expect } from 'vitest';
import { density, psiRealImag, classicalOrbit, meanOccupation, meanEnergy } from './sim.js';

describe('coherent state: mean occupation and energy', () => {
  it('<n> = |alpha|^2 exactly', () => {
    for (const a of [0.5, 1, 1.5, 2, 3]) {
      expect(meanOccupation(a)).toBeCloseTo(a * a, 12);
    }
  });

  it('<H> / (hbar omega) = |alpha|^2 + 1/2 exactly', () => {
    for (const a of [0.5, 1, 2, 3]) {
      expect(meanEnergy(a)).toBeCloseTo(a * a + 0.5, 12);
    }
  });
});

describe('coherent state: classical orbit period', () => {
  it('x_0(t + 2 pi) = x_0(t) within 1e-12 (exact period)', () => {
    const alpha = 2.0;
    for (const t of [0, 0.3, 1.2, Math.PI / 2]) {
      const a = classicalOrbit(alpha, t);
      const b = classicalOrbit(alpha, t + 2 * Math.PI);
      expect(Math.abs(b.x0 - a.x0)).toBeLessThan(1e-12);
      expect(Math.abs(b.p0 - a.p0)).toBeLessThan(1e-12);
    }
  });

  it('classical x_0 and p_0 satisfy x_0^2 + p_0^2 = 2 |alpha|^2 (energy conservation)', () => {
    const alpha = 1.7;
    for (const t of [0, 0.4, 1.7, 5.3]) {
      const { x0, p0 } = classicalOrbit(alpha, t);
      expect(Math.abs(x0 * x0 + p0 * p0 - 2 * alpha * alpha)).toBeLessThan(1e-12);
    }
  });
});

describe('coherent state: density normalization', () => {
  it('integral of |psi|^2 over a wide window is 1 within 1e-6', () => {
    const alpha = 2.0, t = 0.3;
    const dx = 0.01;
    let sum = 0;
    for (let x = -15; x <= 15; x += dx) sum += density(x, alpha, t) * dx;
    expect(Math.abs(sum - 1)).toBeLessThan(1e-6);
  });

  it('|psi|^2 has width 1/sqrt(2) regardless of t', () => {
    // Variance of N(x; x0, 1/sqrt(2)) is 1/2.
    const alpha = 2.0;
    for (const t of [0, 0.7, 2.1, 5.0]) {
      const { x0 } = classicalOrbit(alpha, t);
      let sum = 0, mom2 = 0;
      const dx = 0.005;
      for (let x = -15; x <= 15; x += dx) {
        const w = density(x, alpha, t) * dx;
        sum  += w;
        mom2 += (x - x0) * (x - x0) * w;
      }
      const variance = mom2 / sum;
      expect(Math.abs(variance - 0.5)).toBeLessThan(1e-4);
    }
  });
});

describe('coherent state: wavefunction phase', () => {
  it('|psi|^2 from psiRealImag matches the density formula', () => {
    const alpha = 1.8, t = 0.4;
    for (const x of [-2, 0, 1.5, 3]) {
      const { re, im } = psiRealImag(x, alpha, t);
      const fromPsi = re * re + im * im;
      const fromDen = density(x, alpha, t);
      expect(Math.abs(fromPsi - fromDen)).toBeLessThan(1e-10);
    }
  });
});
