// Particle-mesh disc invariant tests.
// (a) Mass conservation.
// (b) Angular momentum drift bounded.
// (c) Particles stay in domain.
// (d) Initial disc rotates.

import { describe, it, expect } from 'vitest';
import { createDisk, stepPM, totalMass, totalAngularMomentum, L } from './sim.js';

describe('PM: mass conservation', () => {
  it('total mass exact within 1e-12', () => {
    const s = createDisk({ N: 500, M: 1.0, R: 0.8, seed: 1 });
    const M0 = totalMass(s);
    for (let i = 0; i < 20; i += 1) stepPM(s, 0.02);
    expect(Math.abs(totalMass(s) - M0)).toBeLessThan(1e-12);
  }, 60_000);
});

describe('PM: angular momentum bounded drift', () => {
  it('Lz drifts by less than 30 percent over 30 steps', () => {
    const s = createDisk({ N: 500, M: 1.0, R: 0.8, seed: 2 });
    const Lz0 = totalAngularMomentum(s);
    for (let i = 0; i < 30; i += 1) stepPM(s, 0.02);
    const LzF = totalAngularMomentum(s);
    expect(Math.abs(LzF - Lz0) / Math.abs(Lz0)).toBeLessThan(0.30);
  }, 60_000);
});

describe('PM: particles stay in domain', () => {
  it('all x_i, y_i in [0, L) after 15 steps', () => {
    const s = createDisk({ N: 500, M: 1.0, R: 0.7, seed: 3 });
    for (let i = 0; i < 15; i += 1) stepPM(s, 0.02);
    for (let p = 0; p < s.N; p += 1) {
      expect(s.x[2 * p]).toBeGreaterThanOrEqual(0);
      expect(s.x[2 * p]).toBeLessThan(L + 1e-9);
      expect(s.x[2 * p + 1]).toBeGreaterThanOrEqual(0);
      expect(s.x[2 * p + 1]).toBeLessThan(L + 1e-9);
    }
  }, 60_000);
});

describe('PM: initial disc is rotating', () => {
  it('Lz at t = 0 > 0', () => {
    const s = createDisk({ N: 500, M: 1.0, R: 0.8, seed: 4 });
    expect(totalAngularMomentum(s)).toBeGreaterThan(0);
  });
});
