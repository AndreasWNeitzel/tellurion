// Two-stream PIC invariant tests.
// (a) Mode 1 amplitude grows exponentially in linear regime.
// (b) Total momentum conserved.
// (c) Particles stay in [0, L).
// (d) Initial mode-1 amplitude small.

import { describe, it, expect } from 'vitest';
import { createTwoStream, stepPIC, modeOneAmplitude, NPARTICLES, L } from './sim.js';

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
