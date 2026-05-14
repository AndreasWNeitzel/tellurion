import { describe, it, expect } from 'vitest';
import { fourierMag2, laplaceReal, timeFn } from './sim.js';
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
});
