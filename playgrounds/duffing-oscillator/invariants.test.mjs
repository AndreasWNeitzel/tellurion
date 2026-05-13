// Duffing oscillator invariant tests.
// (a) Undriven undamped Duffing conserves H = v^2/2 - x^2/2 + x^4/4 (energy).
// (b) Strong damping with weak drive collapses to a period-1 strobe.
// (c) Classical chaotic regime gamma = 0.5 has at least 6 distinct strobe
//     bins (a fingerprint of broad-spectrum motion).

import { describe, it, expect } from 'vitest';
import { createDuffing, stepDuffing, duffingEnergy, DEFAULT_DT } from './sim.js';

describe('Duffing oscillator: undriven undamped conserves energy', () => {
  it('|H(t) - H(0)| < 5e-3 over 4000 steps (RK4 dt=0.01)', () => {
    const duf = createDuffing({ params: { delta: 0, gamma: 0, omega: 1 }, ic: [1.2, 0], dt: 0.01 });
    const H0 = duffingEnergy(duf.inst.y);
    let maxErr = 0;
    for (let i = 0; i < 4000; i += 1) {
      stepDuffing(duf);
      const H = duffingEnergy(duf.inst.y);
      const err = Math.abs(H - H0);
      if (err > maxErr) maxErr = err;
    }
    expect(maxErr).toBeLessThan(5e-3);
  });
});

describe('Duffing oscillator: weak-drive limit', () => {
  it('strong damping, weak drive: strobes converge to a single point', () => {
    const omega = 1.2;
    const T = 2 * Math.PI / omega;
    const duf = createDuffing({ params: { delta: 0.5, gamma: 0.05, omega }, ic: [0.6, 0], dt: T / 200 });
    for (let p = 0; p < 200; p += 1) {
      for (let s = 0; s < 200; s += 1) stepDuffing(duf);
    }
    const xs = [];
    for (let p = 0; p < 30; p += 1) {
      for (let s = 0; s < 200; s += 1) stepDuffing(duf);
      xs.push(duf.inst.y[0]);
    }
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    let varSum = 0;
    for (const x of xs) varSum += (x - mean) * (x - mean);
    const std = Math.sqrt(varSum / xs.length);
    expect(std).toBeLessThan(0.02);
  }, 15_000);
});

describe('Duffing oscillator: chaotic regime spreads strobed orbit', () => {
  it('gamma = 0.5: strobes occupy at least 6 distinct bins along x', () => {
    const omega = 1.2;
    const T = 2 * Math.PI / omega;
    const duf = createDuffing({ params: { delta: 0.3, gamma: 0.5, omega }, ic: [0.1, 0], dt: T / 200 });
    for (let p = 0; p < 250; p += 1) {
      for (let s = 0; s < 200; s += 1) stepDuffing(duf);
    }
    const NBINS = 16;
    const bins = new Int32Array(NBINS);
    const xmin = -1.6, xmax = 1.6;
    for (let p = 0; p < 120; p += 1) {
      for (let s = 0; s < 200; s += 1) stepDuffing(duf);
      const x = duf.inst.y[0];
      const idx = Math.max(0, Math.min(NBINS - 1, Math.floor((x - xmin) / (xmax - xmin) * NBINS)));
      bins[idx] += 1;
    }
    let occupied = 0;
    for (let i = 0; i < NBINS; i += 1) if (bins[i] > 0) occupied += 1;
    expect(occupied).toBeGreaterThanOrEqual(6);
  }, 20_000);
});
