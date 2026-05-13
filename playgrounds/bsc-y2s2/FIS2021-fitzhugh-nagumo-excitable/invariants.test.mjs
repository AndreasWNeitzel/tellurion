// FitzHugh-Nagumo invariants.
// (a) Rest state is a fixed point.
// (b) Below-threshold: voltage stays bounded.
// (c) Above-threshold: voltage spikes.
// (d) Above Hopf: periodic oscillation.
// (e) Rest state consistency.

import { describe, it, expect } from 'vitest';
import { createFHN, stepFHN, restState } from './sim.js';

describe('FHN: rest is fixed point', () => {
  it('at rest, derivatives ~ 0 over 1000 steps', () => {
    const rest = restState(0);
    const s = createFHN({ v: rest.v, w: rest.w, I: 0 });
    for (let i = 0; i < 1000; i += 1) stepFHN(s, 0.05);
    expect(Math.abs(s.v - rest.v)).toBeLessThan(1e-3);
    expect(Math.abs(s.w - rest.w)).toBeLessThan(1e-3);
  });
});

describe('FHN: subthreshold stays bounded', () => {
  it('small perturbation: max(v) < 0.5', () => {
    const rest = restState(0);
    const s = createFHN({ v: rest.v + 0.1, w: rest.w, I: 0 });
    let maxV = -Infinity;
    for (let i = 0; i < 500; i += 1) {
      stepFHN(s, 0.05);
      maxV = Math.max(maxV, s.v);
    }
    expect(maxV).toBeLessThan(0.5);
  });
});

describe('FHN: above-threshold triggers spike', () => {
  it('jump v to 0: peak > 1.5', () => {
    const rest = restState(0);
    const s = createFHN({ v: 0, w: rest.w, I: 0 });
    let maxV = -Infinity;
    for (let i = 0; i < 1000; i += 1) {
      stepFHN(s, 0.05);
      maxV = Math.max(maxV, s.v);
    }
    expect(maxV).toBeGreaterThan(1.5);
  });
});

describe('FHN: above Hopf, periodic oscillation', () => {
  it('I = 0.5: many zero crossings', () => {
    const s = createFHN({ v: -1.2, w: -0.6, I: 0.5 });
    let crossings = 0;
    let prevV = s.v;
    for (let i = 0; i < 4000; i += 1) {
      stepFHN(s, 0.05);
      if (prevV < 0 && s.v >= 0) crossings += 1;
      prevV = s.v;
    }
    expect(crossings).toBeGreaterThan(3);
  });
});

describe('FHN: rest-state consistency', () => {
  it('v + a - b w = 0 at rest state', () => {
    const r = restState(0);
    expect(r.v + 0.7 - 0.8 * r.w).toBeCloseTo(0, 9);
  });
});
