// Cyclotron invariants.
// (a) Speed conserved (B field does no work).
// (b) Trajectory is a circle of radius r = m v / (q B).
// (c) Period T = 2 pi m / (q B) - integrator returns to initial state.
// (d) Higher B -> smaller radius, same period.
// (e) Reversing B sign reverses orbit direction.

import { describe, it, expect } from 'vitest';
import {
  createCyclotron, stepCyclotron, speed,
  cyclotronOmega, cyclotronRadius, cyclotronPeriod,
  Q, M,
} from './sim.js';

describe('Cyclotron: speed conservation', () => {
  it('|v| stays constant within 1e-5 over 1000 RK4 steps', () => {
    const s = createCyclotron({ B: 1.0, v: 1.0 });
    const v0 = speed(s);
    for (let i = 0; i < 1000; i += 1) stepCyclotron(s, 0.01);
    expect(Math.abs(speed(s) - v0) / v0).toBeLessThan(1e-5);
  });
});

describe('Cyclotron: circular trajectory of radius m v / (q B)', () => {
  it('all points lie at radius r from the analytic circle center', () => {
    const B = 1.5, v = 0.8;
    const s = createCyclotron({ B, v });
    // For initial (x0, y0) = (0, 0) with (vx, vy) = (0, v) under
    // F = q v x B with B = B z-hat, omega = qB/m > 0:
    // Initial accel = (qB/m) * (vy, -vx) = (omega v, 0), pointing in +x.
    // So center is at (r, 0) where r = m v / (qB).
    const r = cyclotronRadius(v, B);
    const cx = r, cy = 0;
    for (let i = 0; i < 1500; i += 1) {
      stepCyclotron(s, 0.005);
      const dr = Math.sqrt((s.x - cx) ** 2 + (s.y - cy) ** 2);
      expect(Math.abs(dr - r) / r).toBeLessThan(1e-3);
    }
  }, 30_000);
});

describe('Cyclotron: period', () => {
  it('after one period T, particle returns to initial position within 1e-2', () => {
    const B = 1.0, v = 1.0;
    const T = cyclotronPeriod(B);
    const dt = 0.001;     // fine dt so that N = T / dt is close to integer
    const N = Math.round(T / dt);
    const s = createCyclotron({ B, v });
    const x0 = s.x, y0 = s.y, vx0 = s.vx, vy0 = s.vy;
    for (let i = 0; i < N; i += 1) stepCyclotron(s, dt);
    expect(Math.abs(s.x - x0)).toBeLessThan(1e-2);
    expect(Math.abs(s.y - y0)).toBeLessThan(1e-2);
    expect(Math.abs(s.vx - vx0)).toBeLessThan(1e-2);
    expect(Math.abs(s.vy - vy0)).toBeLessThan(1e-2);
  });
});

describe('Cyclotron: radius scaling with B', () => {
  it('r_2 / r_1 = B_1 / B_2 for fixed v', () => {
    const v = 1.0;
    const r1 = cyclotronRadius(v, 1.0);
    const r2 = cyclotronRadius(v, 2.0);
    expect(r2 / r1).toBeCloseTo(0.5, 12);
  });
});

describe('Cyclotron: reversing B reverses direction', () => {
  it('omega_c(B) = -omega_c(-B)', () => {
    expect(cyclotronOmega(1.0)).toBeCloseTo(-cyclotronOmega(-1.0), 12);
  });
});
