// E x B drift invariants.
// (a) E = 0: pure cyclotron (no drift), reduces to cyclotron orbit.
// (b) Drift velocity is -E / B in y for B z-hat, E x-hat: confirmed
//     analytically and numerically.
// (c) Starting from rest with v(0) = 0: classical cycloid trajectory:
//     - y(t) drifts linearly with mean velocity -E/B
//     - x(t) oscillates between 0 and 2 r_c (cycloid)
// (d) Numerical RK4 matches analytic solution within 1e-3 over T_c.
// (e) Reversing E reverses drift direction.

import { describe, it, expect } from 'vitest';
import {
  createExB, stepExB, analyticState, driftVelocity, cyclotronPeriod,
} from './sim.js';

describe('ExB drift: drift velocity formula', () => {
  it('E in +x, B in +z gives drift = -E / B in y', () => {
    const d = driftVelocity(0.5, 1.0);
    expect(d.vx).toBe(0);
    expect(d.vy).toBeCloseTo(-0.5, 12);
  });
});

describe('ExB drift: cycloid from rest', () => {
  it('starting v = 0: y(t) goes linearly negative; x(t) oscillates', () => {
    const E = 0.5, B = 1.0;
    const s = createExB({ E, B, vx0: 0, vy0: 0 });
    const T = cyclotronPeriod(B);
    const dt = 0.005;
    const N = Math.round(T / dt);
    let xMin = Infinity, xMax = -Infinity, yMin = Infinity;
    for (let i = 0; i < N; i += 1) {
      stepExB(s, dt);
      xMin = Math.min(xMin, s.x); xMax = Math.max(xMax, s.x);
      yMin = Math.min(yMin, s.y);
    }
    // After one period, y has drifted by drift_y * T = -E / B * T
    const expectedY = -E / B * T;
    expect(s.y).toBeCloseTo(expectedY, 2);
    // x oscillates around the cycloid; range is 2 r_c where r_c = drift * m / (q B) = E / B^2 / B = E / B^2.
    // Actually for cycloid v(0) = 0, peak |x - x_avg| = drift / omega = E / B^2.
    const expectedAmp = E / (B * B);
    expect(xMax - xMin).toBeCloseTo(2 * expectedAmp, 1);
  }, 30_000);
});

describe('ExB drift: zero E reduces to cyclotron', () => {
  it('E = 0 case has no drift; orbit is circular', () => {
    const s = createExB({ E: 0, B: 1.0, vx0: 0, vy0: 1.0 });
    const T = cyclotronPeriod(s.B);
    const dt = 0.001;
    const N = Math.round(T / dt);
    const x0 = s.x, y0 = s.y;
    for (let i = 0; i < N; i += 1) stepExB(s, dt);
    // Returns to start within 1e-2 (RK4 closure error)
    expect(Math.abs(s.x - x0)).toBeLessThan(1e-2);
    expect(Math.abs(s.y - y0)).toBeLessThan(1e-2);
  });
});

describe('ExB drift: numerical matches analytic', () => {
  it('numerical state agrees with analyticState within 1e-3 at t = 1', () => {
    const init = { E: 0.5, B: 1.0, x0: 0.1, y0: 0.2, vx0: 0.3, vy0: -0.1 };
    const s = createExB(init);
    const dt = 0.0005;
    const t = 1.0;
    const N = Math.round(t / dt);
    for (let i = 0; i < N; i += 1) stepExB(s, dt);
    const s0 = { x: 0.1, y: 0.2, vx: 0.3, vy: -0.1, E: 0.5, B: 1.0 };
    const a = analyticState(s0, t);
    expect(Math.abs(s.x - a.x)).toBeLessThan(1e-3);
    expect(Math.abs(s.y - a.y)).toBeLessThan(1e-3);
  }, 30_000);
});

describe('ExB drift: E sign reversal flips drift', () => {
  it('drift(E, B) = -drift(-E, B)', () => {
    const d1 = driftVelocity(0.5, 1.0);
    const d2 = driftVelocity(-0.5, 1.0);
    expect(d1.vy).toBeCloseTo(-d2.vy, 12);
  });
});
