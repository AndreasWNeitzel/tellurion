// Wave-on-string invariants.
// (a) Fixed-end: y(0) = y(L) = 0 throughout.
// (b) Free-end: y(0) = y(1) and y(L) = y(L - 1).
// (c) Fixed-end pulse inverts on reflection.
// (d) Free-end pulse preserves sign on reflection.
// (e) CFL condition satisfied.

import { describe, it, expect } from 'vitest';
import { createString, stepString, peakX, N, DX, C, DT } from './sim.js';

describe('Wave: fixed-end BC', () => {
  it('y(0) = y(L) = 0 throughout 200 steps', () => {
    const s = createString({ bc: 'fixed' });
    for (let i = 0; i < 200; i += 1) {
      stepString(s);
      expect(Math.abs(s.y[0])).toBeLessThan(1e-12);
      expect(Math.abs(s.y[N - 1])).toBeLessThan(1e-12);
    }
  });
});

describe('Wave: free-end BC', () => {
  it('y(0) = y(1) and y(L) = y(L - 1) throughout 200 steps', () => {
    const s = createString({ bc: 'free' });
    for (let i = 0; i < 200; i += 1) {
      stepString(s);
      expect(s.y[0]).toBeCloseTo(s.y[1], 12);
      expect(s.y[N - 1]).toBeCloseTo(s.y[N - 2], 12);
    }
  });
});

describe('Wave: fixed-end inverts on reflection', () => {
  it('after right-boundary reflection, peak amplitude is negative', () => {
    const s = createString({ bc: 'fixed' });
    // Pulse needs to travel from x0 = 1.2 to right boundary (4 m): 2.8 / 1 = 2.8 s.
    // Then reflect and travel back into the bulk. Run for ~ 4 s total.
    const N_STEPS = Math.round(4.0 / DT);
    for (let i = 0; i < N_STEPS; i += 1) stepString(s);
    const p = peakX(s);
    expect(p.y).toBeLessThan(0);
  }, 30_000);
});

describe('Wave: free-end preserves sign', () => {
  it('after boundary reflection, peak amplitude is positive', () => {
    const s = createString({ bc: 'free' });
    const N_STEPS = Math.round(4.0 / DT);
    for (let i = 0; i < N_STEPS; i += 1) stepString(s);
    const p = peakX(s);
    expect(p.y).toBeGreaterThan(0);
  }, 30_000);
});

describe('Wave: CFL safe', () => {
  it('c dt / dx <= 1', () => {
    expect(C * DT / DX).toBeLessThanOrEqual(1);
  });
});
