// Gyroscope-precession invariants.
// (a) Omega_p = M g r / (I_s omega_s) exact.
// (b) Faster spin = slower precession.
// (c) Tilt theta is constant in leading order.
// (d) Tip traces a circle.
// (e) Precession period closes.

import { describe, it, expect } from 'vitest';
import {
  createTop, stepTop, precessionRate, tipPosition,
  M_TOP, G_GRAV, R_COM, I_SPIN,
} from './sim.js';

describe('Gyroscope: precession-rate formula', () => {
  it('Omega_p = M g r / (I_s omega_s) exact', () => {
    for (const w of [10, 50, 100]) {
      expect(precessionRate(w)).toBeCloseTo(M_TOP * G_GRAV * R_COM / (I_SPIN * w), 12);
    }
  });
});

describe('Gyroscope: faster spin = slower precession', () => {
  it('Omega_p(omega) > Omega_p(2 omega)', () => {
    expect(precessionRate(10)).toBeGreaterThan(precessionRate(20));
    expect(precessionRate(50)).toBeGreaterThan(precessionRate(100));
  });
});

describe('Gyroscope: tilt constant', () => {
  it('theta unchanged after 2000 steps', () => {
    const s = createTop({ theta: 0.6, omega_spin: 50 });
    for (let i = 0; i < 2000; i += 1) stepTop(s, 0.01);
    expect(s.theta).toBeCloseTo(0.6, 12);
  });
});

describe('Gyroscope: tip traces a circle', () => {
  it('tip radius = L_vis sin(theta) constant', () => {
    const s = createTop({ theta: 0.6, omega_spin: 50 });
    const expectedR = 1.2 * Math.sin(0.6);
    for (let i = 0; i < 200; i += 1) {
      stepTop(s, 0.01);
      const tip = tipPosition(s);
      expect(Math.sqrt(tip.x ** 2 + tip.y ** 2)).toBeCloseTo(expectedR, 9);
    }
  });
});

describe('Gyroscope: precession period', () => {
  it('after T_p = 2 pi / Omega_p, phi has advanced by 2 pi', () => {
    const s = createTop({ theta: 0.6, omega_spin: 50 });
    const Tp = 2 * Math.PI / precessionRate(s.omega_spin);
    const dt = 0.001;
    const N = Math.round(Tp / dt);
    const phi0 = s.phi;
    for (let i = 0; i < N; i += 1) stepTop(s, dt);
    const dphi = (s.phi - phi0) % (2 * Math.PI);
    expect(Math.min(Math.abs(dphi), Math.abs(dphi - 2 * Math.PI))).toBeLessThan(1e-2);
  });
});
