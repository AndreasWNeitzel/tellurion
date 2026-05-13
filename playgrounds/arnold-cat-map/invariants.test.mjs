import { describe, it, expect } from 'vitest';
import { catMapForward, recurrencePeriod, iterate, LYAP_EXACT } from './sim.js';

describe('arnold-cat-map: continuous map invariants', () => {
  it('area preserving: 100 points map into [0, 1) x [0, 1)', () => {
    for (let i = 0; i < 100; i += 1) {
      const r = catMapForward((i * 0.01234) % 1, (i * 0.07189) % 1);
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x).toBeLessThan(1);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeLessThan(1);
    }
  });

  it('Lyapunov exponent equals log((3 + sqrt 5) / 2)', () => {
    expect(Math.abs(LYAP_EXACT - Math.log((3 + Math.sqrt(5)) / 2))).toBeLessThan(1e-12);
  });
});

describe('arnold-cat-map: pixel-grid periodicity', () => {
  it('N = 64 grid recurrence period is 48', () => {
    const N = 64;
    const grid = new Uint8Array(N * N);
    grid[3 * N + 5] = 1;
    grid[10 * N + 20] = 1;
    grid[33 * N + 50] = 1;
    expect(recurrencePeriod(grid, N, 256)).toBe(48);
  });

  it('N = 16 grid recurrence period is 12', () => {
    const N = 16;
    const grid = new Uint8Array(N * N);
    grid[2 * N + 4] = 1;
    grid[5 * N + 9] = 1;
    expect(recurrencePeriod(grid, N, 64)).toBe(12);
  });

  it('grid is exactly recovered after T iterations', () => {
    const N = 16;
    const grid = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i += 7) grid[i] = 1;
    const T = recurrencePeriod(grid, N, 64);
    const after = iterate(grid, N, T);
    for (let i = 0; i < N * N; i += 1) expect(after[i]).toBe(grid[i]);
  });
});

describe('arnold-cat-map: reproducibility', () => {
  it('two iterations from the same grid are bit-identical', () => {
    const N = 16;
    const a = new Uint8Array(N * N), b = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i += 3) a[i] = 1;
    const ax = iterate(a, N, 10);
    for (let i = 0; i < N * N; i += 3) b[i] = 1;
    const bx = iterate(b, N, 10);
    for (let i = 0; i < N * N; i += 1) expect(ax[i]).toBe(bx[i]);
  });
});
