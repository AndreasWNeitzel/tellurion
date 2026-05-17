// Normal modes of a mass-spring chain: exactly N monatomic modes at
// the analytic frequencies, the Verlet dynamics oscillating at those
// frequencies with conserved energy, and the diatomic acoustic/optical
// branches with a zone-boundary gap that closes at K1 = K2.

import { describe, it, expect } from 'vitest';
import {
  monatomicOmega, modeShape, diatomicBranches, bandGap,
  makeChain, verletStep, chainEnergy, uniformSprings,
  exciteMode, measuredOmega,
} from './sim.js';

describe('normal-modes-nd-chain invariants', () => {
  it('a fixed-end N-chain has exactly N distinct, ordered modes', () => {
    const N = 12, K = 1, m = 1, ws = [];
    for (let n = 1; n <= N; n += 1) ws.push(monatomicOmega(n, N, K, m));
    for (let n = 1; n < N; n += 1) expect(ws[n]).toBeGreaterThan(ws[n - 1]);   // strictly increasing
    expect(ws[0]).toBeGreaterThan(0);
    expect(ws[N - 1]).toBeLessThan(2 * Math.sqrt(K / m));
    expect(new Set(ws.map(w => w.toFixed(9))).size).toBe(N);                    // all distinct
    for (let n = 1; n <= N; n += 1) {
      const exact = 2 * Math.sqrt(K / m) * Math.sin((n * Math.PI) / (2 * (N + 1)));
      expect(Math.abs(ws[n - 1] - exact) / exact).toBeLessThan(1e-3);
    }
  });

  it('mode shape vanishes at the walls and has n-1 internal nodes', () => {
    const N = 12;
    for (const n of [1, 3, 7, 12]) {
      const sh = modeShape(n, N);
      expect(sh[0]).toBe(0); expect(sh[N + 1]).toBe(0);
      let nodes = 0;
      for (let i = 2; i <= N; i += 1) if (Math.sign(sh[i]) !== Math.sign(sh[i - 1]) && sh[i] !== 0 && sh[i - 1] !== 0) nodes += 1;
      expect(nodes).toBe(n - 1);
    }
  });

  it('the Verlet chain oscillates at the analytic mode frequency (within 1%)', () => {
    const N = 16, K = 1, m = 1, springs = uniformSprings(N, K);
    for (const n of [1, 4, 9]) {
      const ch = makeChain(N); exciteMode(ch, n, 0.4);
      const wExpect = monatomicOmega(n, N, K, m);
      const dt = 0.04 / (2 * Math.sqrt(K / m));
      const wMeas = measuredOmega(ch, springs, m, dt, 6000, Math.max(1, Math.round(N / 3)));
      expect(Math.abs(wMeas - wExpect) / wExpect).toBeLessThan(0.01);
    }
  });

  it('an undamped chain conserves energy', () => {
    const N = 16, K = 1.3, m = 1, springs = uniformSprings(N, K);
    const ch = makeChain(N); exciteMode(ch, 3, 0.5);
    const E0 = chainEnergy(ch, springs, m);
    const dt = 0.03 / (2 * Math.sqrt(K / m));
    for (let s = 0; s < 8000; s += 1) verletStep(ch, springs, m, dt);
    expect(Math.abs(chainEnergy(ch, springs, m) - E0) / E0).toBeLessThan(5e-3);
  });

  it('diatomic chain: acoustic and optical branch endpoints are exact', () => {
    const K1 = 1.6, K2 = 0.7, m = 1;
    const z = diatomicBranches(0, K1, K2, m);
    expect(z.acoustic).toBeCloseTo(0, 9);
    expect(z.optical).toBeCloseTo(Math.sqrt(2 * (K1 + K2) / m), 9);
    const b = diatomicBranches(Math.PI, K1, K2, m);
    expect(b.acoustic).toBeCloseTo(Math.sqrt(2 * Math.min(K1, K2) / m), 9);
    expect(b.optical).toBeCloseTo(Math.sqrt(2 * Math.max(K1, K2) / m), 9);
  });

  it('there is a band gap that closes exactly when K1 = K2', () => {
    const m = 1;
    expect(bandGap(1, 1, m)).toBeLessThan(1e-9);                 // monatomic limit: no gap
    const g1 = bandGap(1.2, 1.0, m), g2 = bandGap(1.8, 1.0, m), g3 = bandGap(3.0, 1.0, m);
    expect(g1).toBeGreaterThan(0);
    expect(g2).toBeGreaterThan(g1);                              // wider contrast => wider gap
    expect(g3).toBeGreaterThan(g2);
    const K1 = 2.2, K2 = 0.9; let maxA = 0, minO = 1e9;
    for (let th = 0; th <= Math.PI + 1e-9; th += Math.PI / 200) {
      const br = diatomicBranches(th, K1, K2, m);
      maxA = Math.max(maxA, br.acoustic); minO = Math.min(minO, br.optical);
    }
    expect(maxA).toBeLessThan(minO);                             // branches never cross
  });

  it('the acoustic branch is monotone increasing toward the zone boundary', () => {
    const K1 = 1.5, K2 = 0.8, m = 1;
    let prev = -1;
    for (let th = 0; th <= Math.PI + 1e-9; th += Math.PI / 64) {
      const w = diatomicBranches(th, K1, K2, m).acoustic;
      expect(w).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = w;
    }
    expect(diatomicBranches(0, K1, K2, m).acoustic).toBeCloseTo(0, 9);
  });
});
