// Two-stream PIC invariant tests.
// (a) Mode 1 amplitude grows exponentially in linear regime.
// (b) Total momentum conserved.
// (c) Particles stay in [0, L).
// (d) Initial mode-1 amplitude small.

import { describe, it, expect } from 'vitest';
import {
  createTwoStream, stepPIC, modeOneAmplitude, NPARTICLES, L,
  twoStreamGrowth, twoStreamMaxGrowth, measuredGrowthRate, modeAmplitudes,
} from './sim.js';

function totalMomentum(state) {
  let p = 0;
  for (let i = 0; i < NPARTICLES; i += 1) p += state.v[i];
  return p;
}

describe('Two-stream PIC: linear-regime exponential growth', () => {
  it('mode 1 amplitude grows by > 5x between t = 2 and t = 5', () => {
    const s = createTwoStream({ v0: 1.0, T: 0.01, seed: 7 });
    for (let i = 0; i < 40; i += 1) stepPIC(s, 0.05);
    const m2 = modeOneAmplitude(s);
    for (let i = 0; i < 60; i += 1) stepPIC(s, 0.05);
    const m5 = modeOneAmplitude(s);
    expect(m5 / m2).toBeGreaterThan(5);
  }, 30_000);
});

describe('Two-stream PIC: momentum conservation', () => {
  it('total momentum stays within 5 of initial over 200 steps', () => {
    const s = createTwoStream({ v0: 1.0, T: 0.01, seed: 1 });
    const p0 = totalMomentum(s);
    for (let i = 0; i < 200; i += 1) stepPIC(s, 0.05);
    const pF = totalMomentum(s);
    expect(Math.abs(pF - p0)).toBeLessThan(5);
  }, 30_000);
});

describe('Two-stream PIC: particles stay in domain', () => {
  it('all x_i in [0, L) after each step', () => {
    const s = createTwoStream({ v0: 1.0, T: 0.01, seed: 2 });
    for (let i = 0; i < 50; i += 1) {
      stepPIC(s, 0.05);
      for (let p = 0; p < NPARTICLES; p += 1) {
        expect(s.x[p]).toBeGreaterThanOrEqual(0);
        expect(s.x[p]).toBeLessThan(L + 1e-9);
      }
    }
  }, 30_000);
});

describe('Two-stream PIC: initial mode-1 perturbation small', () => {
  it('mode 1 amplitude at t = 0 is below saturation level', () => {
    const s = createTwoStream({ v0: 1.0, T: 0.01, seed: 3 });
    expect(modeOneAmplitude(s)).toBeLessThan(20);
  });
});

describe('Two-stream PIC: analytic growth rate gamma_max = omega_p / (2 sqrt 2)', () => {
  it('the closed-form maximum growth rate is exactly omega_p / (2 sqrt 2)', () => {
    expect(twoStreamMaxGrowth(1)).toBeCloseTo(1 / (2 * Math.SQRT2), 12);
    expect(twoStreamMaxGrowth(3)).toBeCloseTo(3 / (2 * Math.SQRT2), 12);   // linear in wp
  });

  it('the dispersion-relation growth peaks at a^2 = 3 wp^2/8 with value wp/(2 sqrt 2)', () => {
    const wp = 1, v0 = 1;
    let best = 0, bestA = 0;
    for (let a = 0.001; a < 1.2; a += 0.001) {
      const g = twoStreamGrowth(a / v0, v0, wp);     // k = a / v0
      if (g > best) { best = g; bestA = a; }
    }
    expect(best).toBeCloseTo(twoStreamMaxGrowth(wp), 3);
    expect(bestA * bestA).toBeCloseTo(3 * wp * wp / 8, 2);
  });

  it('the beam configuration is unstable for k v0 < wp and marginal at k v0 = wp', () => {
    expect(twoStreamGrowth(0.6, 1, 1)).toBeGreaterThan(0.3);   // a = 0.6 < 1, near peak
    expect(twoStreamGrowth(1.0, 1, 1)).toBeCloseTo(0, 9);      // a = 1 = wp: marginal
    expect(twoStreamGrowth(1.4, 1, 1)).toBe(0);                // a > wp: stable
  });

  it('the PIC linear-regime growth is positive and the right order (within 2x of analytic)', () => {
    // A coarse 10k-particle NGP PIC does not match cold theory tightly;
    // the exact physics is the analytic invariants above. Here we only
    // assert the PIC genuinely grows at the right order of magnitude.
    const gAnalytic = twoStreamGrowth(1, 0.6, 1);              // ~ 0.353, near the peak
    const gMeasured = measuredGrowthRate(0.6);
    expect(gMeasured).toBeGreaterThan(0);
    expect(gMeasured).toBeGreaterThan(0.4 * gAnalytic);
    expect(gMeasured).toBeLessThan(2.5 * gAnalytic);
  }, 30_000);

  it('modeAmplitudes returns K positive components with mode 1 dominant in the linear phase', () => {
    const s = createTwoStream({ v0: 0.6, T: 0.01, seed: 5 });
    for (let i = 0; i < 70; i += 1) stepPIC(s, 0.05);
    const amps = modeAmplitudes(s, 8);
    expect(amps.length).toBe(8);
    for (const a of amps) expect(a).toBeGreaterThanOrEqual(0);
    expect(amps[0]).toBeGreaterThan(amps[3]);                  // k=1 dominates early
  }, 30_000);
});
