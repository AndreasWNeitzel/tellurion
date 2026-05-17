import { describe, it, expect } from 'vitest';
import {
  createState, step, speed, exbDrift, magneticMoment, vParallel, gyrofrequency,
} from './sim.js';

describe('single-particle-em-drift-3d invariants', () => {
  it('Boris pusher conserves speed exactly in a pure magnetic field', () => {
    const s = createState({ q: 1, m: 1, v0: [1, 0, 0.4], preset: 'cyclotron', params: { B0: 1 } });
    const v0 = speed(s);
    const dt = 2 * Math.PI / 400;
    for (let n = 0; n < 20000; n += 1) step(s, dt);
    expect(Math.abs(speed(s) - v0) / v0).toBeLessThan(1e-9);
  });

  it('cyclotron period matches 2 pi m / (|q| B)', () => {
    const q = 1, m = 1, B0 = 1.3;
    const wc = gyrofrequency(q, m, B0);
    const Tc = 2 * Math.PI / wc;
    const s = createState({ q, m, v0: [1, 0, 0], preset: 'cyclotron', params: { B0 } });
    const dt = Tc / 600;
    // integrate one period; vx should return to ~ its initial value
    const vx0 = s.v[0];
    for (let n = 0; n < 600; n += 1) step(s, dt);
    expect(Math.abs(s.v[0] - vx0) / 1).toBeLessThan(2e-2);
    expect(Math.abs(s.v[1])).toBeLessThan(2e-2);          // back to start of the circle
  });

  it('E x B drift velocity equals E x B / B^2, independent of charge sign', () => {
    const params = { B0: 1, E0: 0.3 };
    const run = (q) => {
      const s = createState({ q, m: 1, v0: [0.2, 0, 0], preset: 'exb', params });
      const Tc = 2 * Math.PI / gyrofrequency(q, 1, params.B0);
      const dt = Tc / 400, periods = 60, N = 400 * periods;
      const vd = exbDrift(s);                              // = (0, -E0/B0, 0)
      const r0 = s.r.slice();
      for (let n = 0; n < N; n += 1) step(s, dt);
      const T = N * dt;
      const measured = [(s.r[0] - r0[0]) / T, (s.r[1] - r0[1]) / T, (s.r[2] - r0[2]) / T];
      return { vd, measured };
    };
    for (const q of [1, -1]) {
      const { vd, measured } = run(q);
      expect(Math.abs(vd[1] + 0.3)).toBeLessThan(1e-12);   // analytic = -E0/B0
      expect(Math.abs(measured[1] - vd[1]) / Math.abs(vd[1])).toBeLessThan(2e-2);
      expect(Math.abs(measured[0])).toBeLessThan(2e-2);     // no net x drift
    }
  });

  it('magnetic mirror: the particle reflects and the gyro-averaged mu is adiabatically conserved', () => {
    // Deeply adiabatic regime: large B0 (small gyroradius) and a
    // gently varying bottle, so r_L / L << 1.
    const B0 = 4;
    const s = createState({ q: 1, m: 1, r0: [0, 0, -3], v0: [0.5, 0, 0.7], preset: 'mirror', params: { B0, mirror: 0.03 } });
    const v0 = speed(s);
    expect(vParallel(s)).toBeGreaterThan(0);
    const wc = gyrofrequency(1, 1, B0);
    const dt = (2 * Math.PI / wc) / 240;                    // 240 steps per gyro-orbit
    const Nc = 240;                                         // one gyroperiod in steps
    let reflected = false;
    // Stroboscopic mu: one sample per gyroperiod removes the
    // gyrophase oscillation, leaving the adiabatic invariant.
    const strobe = [];
    for (let n = 0; n < 120000; n += 1) {
      step(s, dt);
      if (n % Nc === 0) strobe.push(magneticMoment(s));
      if (vParallel(s) < -0.05 * v0) reflected = true;
    }
    const muMin = Math.min(...strobe), muMax = Math.max(...strobe);
    const muMean = strobe.reduce((a, b) => a + b, 0) / strobe.length;
    expect(reflected).toBe(true);                           // it turned around
    expect((muMax - muMin) / muMean).toBeLessThan(0.1);     // adiabatic invariant (gyro-averaged)
    expect(Math.abs(speed(s) - v0) / v0).toBeLessThan(1e-9); // E = 0, Boris exact
  });

  it('deterministic: identical inputs reproduce the trajectory exactly', () => {
    const a = createState({ q: 1, m: 1, v0: [1, 0.3, 0.5], preset: 'gradB', params: { B0: 1, grad: 0.05 } });
    const b = createState({ q: 1, m: 1, v0: [1, 0.3, 0.5], preset: 'gradB', params: { B0: 1, grad: 0.05 } });
    for (let n = 0; n < 5000; n += 1) { step(a, 0.01); step(b, 0.01); }
    let d = 0;
    for (let i = 0; i < 3; i += 1) d = Math.max(d, Math.abs(a.r[i] - b.r[i]), Math.abs(a.v[i] - b.v[i]));
    expect(d).toBe(0);
  });

  it('grad-B drift is perpendicular to both B and grad|B| (drifts in y here)', () => {
    const s = createState({ q: 1, m: 1, r0: [0, 0, 0], v0: [0.8, 0, 0.1], preset: 'gradB', params: { B0: 1, grad: 0.08 } });
    const y0 = s.r[1];
    for (let n = 0; n < 8000; n += 1) step(s, 0.01);
    expect(Math.abs(s.r[1] - y0)).toBeGreaterThan(0.05);   // a clear cross-field drift develops
  });
});
