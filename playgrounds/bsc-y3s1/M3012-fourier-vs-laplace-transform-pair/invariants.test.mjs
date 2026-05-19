import { describe, it, expect } from 'vitest';
import { fourierMag2, laplaceReal, laplaceComplex, timeFn } from './sim.js';
describe('fourier-vs-laplace-transform-pair', () => {
  it('exp -at: |F(omega)|^2 = 1/(a^2 + omega^2)', () => {
    expect(Math.abs(fourierMag2(0, 'exp', { a: 1 }) - 1)).toBeLessThan(1e-12);
    expect(Math.abs(fourierMag2(1, 'exp', { a: 1 }) - 0.5)).toBeLessThan(1e-12);
  });
  it('Laplace L{e^-at} = 1/(s+a)', () => {
    expect(Math.abs(laplaceReal(0, 'exp', { a: 1 }) - 1)).toBeLessThan(1e-12);
    expect(Math.abs(laplaceReal(1, 'exp', { a: 1 }) - 0.5)).toBeLessThan(1e-12);
  });
  it('cos Laplace: L{cos(w0 t)} = s / (s^2 + w0^2) at decay = 0', () => {
    expect(Math.abs(laplaceReal(2, 'cos', { decay: 0, omega0: 1 }) - 2 / 5)).toBeLessThan(1e-12);
  });
  it('ramp Laplace: L{t} = 1/s^2', () => {
    expect(Math.abs(laplaceReal(1, 'ramp', { decay: 0 }) - 1)).toBeLessThan(1e-12);
    expect(Math.abs(laplaceReal(2, 'ramp', { decay: 0 }) - 0.25)).toBeLessThan(1e-12);
  });
  it('timeFn vanishes for t < 0', () => {
    expect(timeFn(-1, 'exp', { a: 1 })).toBe(0);
  });
  it('sinc^2 / pulse FT: |F(0)|^2 = T^2', () => {
    expect(Math.abs(fourierMag2(0, 'rect', { T: 2 }) - 4)).toBeLessThan(1e-12);
  });
  it('laplaceComplex reduces to laplaceReal on the real axis', () => {
    for (const fn of ['exp', 'cos', 'ramp', 'rect']) {
      for (const s of [0.5, 1.3, 3.0]) {
        const c = laplaceComplex(s, 0, fn, { a: 1.2, decay: 1.2, omega0: 2, T: 2 });
        expect(Math.abs(c.re - laplaceReal(s, fn, { a: 1.2, decay: 1.2, omega0: 2, T: 2 }))).toBeLessThan(1e-9);
        expect(Math.abs(c.im)).toBeLessThan(1e-9);
      }
    }
  });
  it('Fourier is the imaginary-axis cut: |F(i omega)|^2 = |F(omega)|^2', () => {
    for (const om of [0, 1, 2.5, 4]) {
      const c = laplaceComplex(0, om, 'exp', { a: 1.4 });
      expect(Math.abs((c.re * c.re + c.im * c.im) - fourierMag2(om, 'exp', { a: 1.4 }))).toBeLessThan(1e-9);
      const cr = laplaceComplex(0, om, 'ramp', { decay: 0.9 });
      expect(Math.abs((cr.re * cr.re + cr.im * cr.im) - fourierMag2(om, 'ramp', { decay: 0.9 }))).toBeLessThan(1e-9);
    }
  });
});
