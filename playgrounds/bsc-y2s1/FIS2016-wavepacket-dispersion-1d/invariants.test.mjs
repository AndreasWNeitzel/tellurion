import { describe, it, expect } from 'vitest';
import { spreadAt, center, density } from './sim.js';
describe('wavepacket-dispersion-1d', () => {
  it('sigma(0) = sigma_0', () => {
    expect(spreadAt(2, 0)).toBe(2);
  });
  it('sigma(t) grows monotonically', () => {
    expect(spreadAt(2, 5)).toBeGreaterThan(spreadAt(2, 1));
  });
  it('packet center moves at v = hbar k / m', () => {
    expect(Math.abs(center(0, 2, 5, 1, 1) - 10)).toBeLessThan(1e-12);
  });
  it('density normalized: integral ~ 1', () => {
    const N = 4000, L = 100, dx = L / N;
    let s = 0;
    for (let i = 0; i < N; i += 1) {
      const x = -L / 2 + i * dx;
      s += density(x, 0, 0, 0, 1) * dx;
    }
    expect(Math.abs(s - 1)).toBeLessThan(0.01);
  });
  it('density normalized at later t', () => {
    const N = 4000, L = 200, dx = L / N;
    let s = 0;
    for (let i = 0; i < N; i += 1) {
      const x = -L / 2 + i * dx;
      s += density(x, 3, 0, 2, 1) * dx;
    }
    expect(Math.abs(s - 1)).toBeLessThan(0.01);
  });
});
