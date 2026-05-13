// Mandelbrot Set invariant tests. Deterministic; no RNG.

import { describe, it, expect } from 'vitest';
import { escapeIterations, MAX_ITER } from './sim.js';

describe('mandelbrot-explorer: membership invariants', () => {
  it('c = 0 stays bounded (orbit fixed at 0)', () => {
    expect(escapeIterations(0, 0)).toBe(MAX_ITER);
  });

  it('c = -1 stays bounded (period-2 orbit 0 to -1 to 0)', () => {
    expect(escapeIterations(-1, 0)).toBe(MAX_ITER);
  });

  it('c = -1.75 stays bounded (period-3 bulb on the real axis)', () => {
    expect(escapeIterations(-1.75, 0)).toBe(MAX_ITER);
  });

  it('c = 1 escapes within 4 iterations', () => {
    expect(escapeIterations(1, 0)).toBeLessThan(5);
  });

  it('c = 1 + i escapes within 4 iterations', () => {
    expect(escapeIterations(1, 1)).toBeLessThan(5);
  });

  it('c with |c| > 2 escapes within 2 iterations', () => {
    expect(escapeIterations(3, 0)).toBeLessThan(2);
    expect(escapeIterations(0, 3)).toBeLessThan(2);
    expect(escapeIterations(-3, 1)).toBeLessThan(2);
  });
});

describe('mandelbrot-explorer: reproducibility', () => {
  it('escape time is deterministic on identical inputs', () => {
    const a = escapeIterations(-0.7269, 0.1889);
    const b = escapeIterations(-0.7269, 0.1889);
    expect(a).toBe(b);
  });
});
