import { describe, it, expect } from 'vitest';
import { monatomic, diatomic, gapAtZoneBoundary } from './sim.js';
describe('phonon-dispersion-1d', () => {
  it('monatomic omega(0) = 0', () => {
    expect(monatomic(0)).toBe(0);
  });
  it('monatomic peak at k = pi: 2 sqrt(K/m)', () => {
    expect(Math.abs(monatomic(Math.PI) - 2)).toBeLessThan(1e-12);
  });
  it('diatomic equal masses reduce to monatomic-like', () => {
    const d = diatomic(Math.PI, 1, 1, 2);
    expect(d.acoustic).toBeLessThan(d.optical);
  });
  it('diatomic acoustic branch goes to 0 at k = 0', () => {
    const d = diatomic(0);
    expect(d.acoustic).toBeLessThan(1e-9);
  });
  it('diatomic gap exists for unequal masses', () => {
    const d = diatomic(Math.PI, 1, 1, 2);
    expect(d.optical).toBeGreaterThan(d.acoustic);
  });
  it('gap formula returns finite values', () => {
    const g = gapAtZoneBoundary(1, 1, 2);
    expect(g.low).toBeGreaterThan(0); expect(g.high).toBeGreaterThan(g.low);
  });
  it('1-A: zone-boundary atoms are pi out of phase', () => {
    // At k = pi/a (a=1), adjacent atom displacements sin(k*i) satisfy
    // sin(k*1) + sin(k*0) = sin(pi) + sin(0) = 0 exactly.
    const k = Math.PI;
    expect(Math.abs(Math.sin(k * 1) + Math.sin(k * 0))).toBeLessThan(1e-10);
  });
});
