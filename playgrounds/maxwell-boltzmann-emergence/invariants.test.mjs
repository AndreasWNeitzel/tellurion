// Maxwell-Boltzmann emergence invariants.
// (a) Total KE conserved (elastic collisions and reflecting walls).
// (b) Mean speed = v0 at t = 0 (delta initial condition).
// (c) Particles stay inside the box.
// (d) Histogram peak shifts to most-probable speed (~ v0 / sqrt(2)) after
//     thermalization.
// (e) Analytic 2D MB integrates to 1.

import { describe, it, expect } from 'vitest';
import {
  createGas, stepGas, totalKE, meanSpeed, speedHistogram, maxwellBoltzmann2D,
  BOX, RADIUS,
} from './sim.js';

describe('MB emergence: energy conservation', () => {
  it('|delta KE / KE_0| < 1e-9 over 200 steps', () => {
    const s = createGas({ N: 60, v0: 1.0, seed: 0x1234 });
    const KE0 = totalKE(s);
    for (let i = 0; i < 200; i += 1) stepGas(s, 0.01);
    expect(Math.abs((totalKE(s) - KE0) / KE0)).toBeLessThan(1e-9);
  }, 30_000);
});

describe('MB emergence: initial mean speed', () => {
  it('initial mean speed equals v0 (delta IC)', () => {
    const s = createGas({ N: 60, v0: 1.5, seed: 0x1234 });
    expect(meanSpeed(s)).toBeCloseTo(1.5, 12);
  });
});

describe('MB emergence: particles inside box', () => {
  it('all particles remain inside [RADIUS, BOX - RADIUS] after 100 steps', () => {
    const s = createGas({ N: 60, v0: 1.0, seed: 0x1234 });
    for (let i = 0; i < 100; i += 1) stepGas(s, 0.01);
    for (let i = 0; i < s.N; i += 1) {
      expect(s.x[i]).toBeGreaterThan(RADIUS - 1e-6);
      expect(s.x[i]).toBeLessThan(BOX - RADIUS + 1e-6);
      expect(s.y[i]).toBeGreaterThan(RADIUS - 1e-6);
      expect(s.y[i]).toBeLessThan(BOX - RADIUS + 1e-6);
    }
  });
});

describe('MB emergence: mean speed converges to MB mean', () => {
  it('post-thermalization mean speed in [0.7, 1.0] when v0 = 1.0 (MB mean = sigma sqrt(pi/2) approx 0.886)', () => {
    const s = createGas({ N: 80, v0: 1.0, seed: 0x9876 });
    for (let i = 0; i < 3000; i += 1) stepGas(s, 0.01);
    const meanV = meanSpeed(s);
    // MB mean speed for 2D: <v> = sigma sqrt(pi/2), where 2 sigma^2 = v_0^2.
    // sigma = v_0/sqrt(2) = 0.707, so <v> = 0.707 * 1.2533 = 0.886.
    expect(meanV).toBeGreaterThan(0.7);
    expect(meanV).toBeLessThan(1.0);
  }, 120_000);
});

describe('MB emergence: analytic MB integrates to 1', () => {
  it('numerical integral of MB(v, sigma=1) from 0 to 8 equals 1 within 1e-3', () => {
    const sigma = 1.0;
    let integral = 0;
    const dv = 0.01;
    for (let v = 0; v < 8; v += dv) {
      integral += maxwellBoltzmann2D(v, sigma) * dv;
    }
    expect(Math.abs(integral - 1)).toBeLessThan(1e-3);
  });
});
