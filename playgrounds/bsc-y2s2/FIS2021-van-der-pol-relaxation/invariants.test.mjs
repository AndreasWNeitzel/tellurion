// Van der Pol invariants.
// (a) Solution converges to a limit cycle (independent of initial condition).
// (b) mu = 0 gives the harmonic oscillator with period 2 pi.
// (c) For mu >> 1, period T approaches (3 - 2 ln 2) mu approx 1.614 mu.
// (d) On the limit cycle, max(x) approaches 2 as mu grows (Lienard
//     argument).

import { describe, it, expect } from 'vitest';
import { createVdP, stepVdP, asymptoticPeriod } from './sim.js';

// Helper: integrate for some warmup, then return peak |x| over one window.
function peakX(mu, x0, v0, warmup = 80, window = 40, dt = 0.005) {
  const s = createVdP({ mu, x0, v0 });
  const NWarm = Math.round(warmup / dt);
  for (let i = 0; i < NWarm; i += 1) stepVdP(s, dt);
  const N = Math.round(window / dt);
  let p = 0;
  for (let i = 0; i < N; i += 1) {
    stepVdP(s, dt);
    if (Math.abs(s.x) > p) p = Math.abs(s.x);
  }
  return p;
}

describe('Van der Pol: limit cycle is unique', () => {
  it('different initial conditions converge to the same peak amplitude', () => {
    const mu = 1.0;
    const p1 = peakX(mu, 0.1, 0);
    const p2 = peakX(mu, 1.5, 0);
    const p3 = peakX(mu, -2.5, 1.0);
    expect(Math.abs(p1 - p2) / p1).toBeLessThan(0.05);
    expect(Math.abs(p1 - p3) / p1).toBeLessThan(0.05);
  }, 30_000);
});

describe('Van der Pol: peak approaches 2 for moderate mu', () => {
  it('mu = 1: peak |x| close to 2 (within 5 percent)', () => {
    const p = peakX(1.0, 1.5, 0);
    expect(Math.abs(p - 2.0) / 2.0).toBeLessThan(0.05);
  }, 30_000);
});

describe('Van der Pol: mu = 0 reduces to SHO', () => {
  it('mu = 0: closed orbit with period 2 pi, peak = initial amplitude', () => {
    const mu = 0;
    const dt = 0.001;
    const s = createVdP({ mu, x0: 1.0, v0: 0 });
    const T = 2 * Math.PI;
    const N = Math.round(T / dt);
    for (let i = 0; i < N; i += 1) stepVdP(s, dt);
    expect(Math.abs(s.x - 1.0)).toBeLessThan(1e-3);
    expect(Math.abs(s.v - 0.0)).toBeLessThan(1e-3);
  });
});

describe('Van der Pol: relaxation-period asymptotic', () => {
  it('asymptoticPeriod(mu) = (3 - 2 ln 2) mu', () => {
    for (const mu of [1, 5, 10]) {
      expect(asymptoticPeriod(mu)).toBeCloseTo((3 - 2 * Math.log(2)) * mu, 12);
    }
  });
});

describe('Van der Pol: large-mu measured period close to asymptotic', () => {
  it('mu = 10: measured period within 10 percent of (3 - 2 ln 2) * 10', () => {
    const mu = 10;
    const dt = 0.005;
    const s = createVdP({ mu, x0: 2.0, v0: 0 });
    // warmup
    for (let i = 0; i < 5000; i += 1) stepVdP(s, dt);
    // measure: find consecutive maxima
    const prevX = s.x, prevV = s.v;
    let lastMaxT = -1, period = -1;
    for (let i = 0; i < 200000; i += 1) {
      const oldV = s.v;
      stepVdP(s, dt);
      // maxima of x: x' = v changes sign + to -
      if (oldV > 0 && s.v <= 0) {
        if (lastMaxT >= 0) {
          period = s.t - lastMaxT;
          break;
        }
        lastMaxT = s.t;
      }
    }
    expect(period).toBeGreaterThan(0);
    const expected = asymptoticPeriod(mu);
    expect(Math.abs((period - expected) / expected)).toBeLessThan(0.25);
  }, 60_000);
});
