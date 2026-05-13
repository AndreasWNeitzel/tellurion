// Magnus-effect invariants.
// (a) Positive spin (top-spin) shortens range.
// (b) Negative spin (back-spin) extends range.
// (c) Zero spin: near-parabolic trajectory.
// (d) Spin sign produces measurable trajectory difference.
// (e) Trajectory lands near y = 0.

import { describe, it, expect } from 'vitest';
import { trajectory } from './sim.js';

function rangeOf(opts) {
  const p = trajectory(opts);
  return p[p.length - 1].x;
}

describe('Magnus: positive spin shortens range', () => {
  it('range(+50) < range(0)', () => {
    const r0 = rangeOf({ v0: 25, angleDeg: 20, spin: 0 });
    const rPos = rangeOf({ v0: 25, angleDeg: 20, spin: 50 });
    expect(rPos).toBeLessThan(r0);
  });
});

describe('Magnus: negative spin extends range', () => {
  it('range(-50) > range(0)', () => {
    const r0 = rangeOf({ v0: 25, angleDeg: 20, spin: 0 });
    const rNeg = rangeOf({ v0: 25, angleDeg: 20, spin: -50 });
    expect(rNeg).toBeGreaterThan(r0);
  });
});

describe('Magnus: zero spin near-parabolic', () => {
  it('peak between 30 percent and 70 percent of range', () => {
    const p = trajectory({ v0: 25, angleDeg: 20, spin: 0 });
    const peak = p.reduce((m, q) => q.y > m.y ? q : m, p[0]);
    expect(peak.x / p[p.length - 1].x).toBeGreaterThan(0.3);
    expect(peak.x / p[p.length - 1].x).toBeLessThan(0.7);
  });
});

describe('Magnus: spin sign produces nonzero difference', () => {
  it('range(+30) != range(0) and range(-30) != range(0)', () => {
    const r0 = rangeOf({ v0: 25, angleDeg: 20, spin: 0 });
    const rP = rangeOf({ v0: 25, angleDeg: 20, spin: 30 });
    const rN = rangeOf({ v0: 25, angleDeg: 20, spin: -30 });
    expect(rP).not.toBe(r0);
    expect(rN).not.toBe(r0);
  });
});

describe('Magnus: trajectory lands at y = 0', () => {
  it('|y_final| < 0.1', () => {
    const p = trajectory({ v0: 25, angleDeg: 20, spin: 0 });
    expect(Math.abs(p[p.length - 1].y)).toBeLessThan(0.1);
  });
});
