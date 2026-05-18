import { describe, it, expect } from 'vitest';
import {
  thresholdPump, steadyInversion, steadyPhotons, outputPower,
  runToSteady, qSwitch,
} from './sim.js';

describe('laser-rate-equations-dynamics invariants', () => {
  it('below threshold the photon number collapses to ~0 (no lasing)', () => {
    const q0 = 2;                                    // r_th = 1/q0 = 0.5
    const { p, n } = runToSteady(0.5 * thresholdPump(q0), q0);
    expect(p).toBeLessThan(1e-3);                    // only the spontaneous floor
    expect(n).toBeCloseTo(0.25, 2);                  // n* ~ r below threshold
  });

  it('above threshold the inversion clamps at n_th = 1/q0 to within 1% (gain clamping)', () => {
    const q0 = 2, nth = 1 / q0;
    for (const mult of [3, 6, 12]) {
      const { n } = runToSteady(mult * thresholdPump(q0), q0);
      expect(Math.abs(n - nth) / nth).toBeLessThan(0.01);   // independent of pump
    }
  });

  it('the RK4 steady state matches the closed-form gain-clamped solution', () => {
    const q0 = 2.5, r = 4 * thresholdPump(q0);
    const { n, p } = runToSteady(r, q0);
    expect(n).toBeCloseTo(steadyInversion(r, q0), 2);
    expect(p / steadyPhotons(r, q0)).toBeCloseTo(1, 1);     // within ~10% (RK4)
  });

  it('output power has a kink: zero below threshold, linear in pump above', () => {
    const q0 = 2, rth = thresholdPump(q0);
    expect(outputPower(0.5 * rth, q0)).toBe(0);
    const p2 = outputPower(2 * rth, q0), p3 = outputPower(3 * rth, q0), p4 = outputPower(4 * rth, q0);
    expect(p2).toBeGreaterThan(0);
    expect((p4 - p3) / (p3 - p2)).toBeCloseTo(1, 6);          // constant slope (linear)
  });

  it('relaxation oscillations: the transient photon number overshoots (underdamped, fast cavity)', () => {
    // Class-B relaxation oscillations require the Jacobian
    // discriminant r^2 q0^2 - 4(r - 1/q0) < 0, i.e. a fast cavity
    // (small q0) and strong pumping.
    const q0 = 0.1, r = 3 * thresholdPump(q0);                // r_th = 10, r = 30
    expect(r * r * q0 * q0 - 4 * (r - 1 / q0)).toBeLessThan(0); // oscillatory regime
    const { p, peakP } = runToSteady(r, q0, { dt: 1e-3, T: 30 });
    expect(peakP).toBeGreaterThan(1.3 * p);                    // damped overshoot
  });

  it('Q-switch: a giant pulse obeying the exact rate-equation energy balance', () => {
    const a = qSwitch({ r: 2, q0Low: 0.25, q0High: 4, charge: 30, dump: 12 });
    const b = qSwitch({ r: 3, q0Low: 0.25, q0High: 4, charge: 30, dump: 12 });
    // a giant pulse: large inversion built, then strongly depleted
    expect(a.nI).toBeGreaterThan(1.5);
    expect(a.nF).toBeLessThan(a.nI / 2);
    expect(a.peakP).toBeGreaterThan(1);
    expect(b.peakP).toBeGreaterThan(a.peakP);          // more charge -> bigger pulse
    expect(b.energy).toBeGreaterThan(a.energy);        // energy grows with the inversion
    // exact rate-equation energy balance:
    //   E = (n_i - n_end) + integral(r - n) - (p_end - p_init)
    for (const x of [a, b]) {
      const balance = (x.nI - x.nEnd) + x.srcInt - (x.pEnd - x.pInit);
      expect(Math.abs(x.energy - balance) / x.energy).toBeLessThan(0.01);
    }
  });

  it('deterministic: identical inputs reproduce the run exactly', () => {
    const x = runToSteady(1.5, 2), y = runToSteady(1.5, 2);
    expect(x.n).toBe(y.n);
    expect(x.p).toBe(y.p);
    const q1 = qSwitch({ r: 2.5 }), q2 = qSwitch({ r: 2.5 });
    expect(q1.energy).toBe(q2.energy);
  });
});
