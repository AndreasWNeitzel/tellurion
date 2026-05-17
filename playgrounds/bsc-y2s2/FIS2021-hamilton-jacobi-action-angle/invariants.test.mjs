// Action-angle variables: the harmonic action J = E/w0 from the
// contour integral (0.1%), isochronous omega = w0, the orbit as a
// circle of radius sqrt(2J), uniform angle advance, pendulum
// anharmonicity omega(J) falling with amplitude, energy/action
// inversion, the geometric area definition, and adiabatic
// invariance of J under a slow w0(t).

import { describe, it, expect } from 'vitest';
import {
  potential, energyOf, turningPoints, action, period, omegaOfE,
  harmonicActionExact, energyFromAction, harmonicState, toCircle,
} from './sim.js';

const close = (a, b, t) => expect(Math.abs(a - b)).toBeLessThan(t);
const rel = (a, b, t) => expect(Math.abs(a - b) / Math.abs(b)).toBeLessThan(t);

describe('hamilton-jacobi-action-angle invariants', () => {
  it('harmonic action J = E/w0 from the contour integral (0.1%)', () => {
    for (const w0 of [0.7, 1, 1.6]) for (const E of [0.3, 1.0, 4.0]) {
      rel(action('harmonic', E, w0), harmonicActionExact(E, w0), 1e-3);
      rel(action('harmonic', E, w0), E / w0, 1e-3);
    }
  });

  it('harmonic oscillator is isochronous: omega = w0 for all E', () => {
    for (const w0 of [0.8, 1.3]) for (const E of [0.2, 1, 5]) {
      rel(period('harmonic', E, w0), 2 * Math.PI / w0, 2e-3);
      rel(omegaOfE('harmonic', E, w0), w0, 2e-3);
    }
  });

  it('the harmonic orbit is a circle of radius sqrt(2J)', () => {
    const A = 1.3, w0 = 1.4, J = harmonicActionExact(0.5 * A * A * w0 * w0, w0);
    const rTarget = Math.sqrt(2 * J);
    for (const t of [0, 0.7, 2.1, 4.4, 6.0]) {
      const s = harmonicState(A, w0, t);
      const { Q, P } = toCircle(s.q, s.p, w0);
      rel(Math.hypot(Q, P), rTarget, 1e-6);              // constant radius
    }
  });

  it('the angle variable advances uniformly: theta = w0 t', () => {
    const A = 1, w0 = 1.1;
    let prev = 0, dmax = 0, dmin = Infinity;
    for (let k = 1; k <= 40; k += 1) {
      const t = k * 0.1;
      const th = harmonicState(A, w0, t).theta;
      let d = th - prev; if (d < 0) d += 2 * Math.PI;     // unwrap one step
      prev = th; dmax = Math.max(dmax, d); dmin = Math.min(dmin, d);
    }
    close(dmax - dmin, 0, 1e-9);                          // equal increments
    close(dmax, w0 * 0.1, 1e-9);                          // = w0 dt
  });

  it('pendulum is anharmonic: omega(J) decreases with amplitude', () => {
    const w0 = 1;
    const Esmall = 0.02 * w0 * w0, Ebig = 1.6 * w0 * w0;  // both below 2 w0^2
    expect(action('pendulum', Ebig, w0)).toBeGreaterThan(action('pendulum', Esmall, w0));
    expect(omegaOfE('pendulum', Ebig, w0)).toBeLessThan(omegaOfE('pendulum', Esmall, w0));
    rel(omegaOfE('pendulum', 1e-4, w0), w0, 5e-3);        // small swing -> w0
  });

  it('energy <-> action inverts consistently', () => {
    rel(energyFromAction('harmonic', 2.5, 1.3), 1.3 * 2.5, 1e-9);
    for (const E of [0.3, 1.0]) {
      const J = action('pendulum', E, 1);
      rel(energyFromAction('pendulum', J, 1), E, 5e-3);
    }
  });

  it('action equals the enclosed phase area / 2 pi', () => {
    // sample the harmonic orbit and shoelace its area
    const E = 1.0, w0 = 1, A = Math.sqrt(2 * E) / w0;
    let area = 0; const M = 2000;
    for (let i = 0; i < M; i += 1) {
      const a0 = (i / M) * 2 * Math.PI, a1 = ((i + 1) / M) * 2 * Math.PI;
      const q0 = A * Math.cos(a0), p0 = -Math.sqrt(2 * E) * Math.sin(a0);
      const q1 = A * Math.cos(a1), p1 = -Math.sqrt(2 * E) * Math.sin(a1);
      area += 0.5 * (q0 * p1 - q1 * p0);
    }
    rel(Math.abs(area) / (2 * Math.PI), action('harmonic', E, w0), 2e-3);
  });

  it('adiabatic invariance: J nearly constant under a slow w0(t)', () => {
    // velocity-Verlet a harmonic oscillator while w0 ramps slowly;
    // J = E/w0 should be far better conserved than E itself.
    let q = 1, p = 0, w = 1, dt = 1e-3;
    const J0 = 0.5 * (p * p + w * w * q * q) / w, E0 = 0.5 * (p * p + w * w * q * q);
    const steps = 200000, wEnd = 2.0;
    for (let i = 0; i < steps; i += 1) {
      w = 1 + (wEnd - 1) * (i / steps);                  // slow ramp over many periods
      const a = -w * w * q;
      p += 0.5 * a * dt; q += p * dt; p += 0.5 * (-w * w * q) * dt;
    }
    const E1 = 0.5 * (p * p + w * w * q * q), J1 = E1 / w;
    expect(Math.abs((J1 - J0) / J0)).toBeLessThan(2e-2);  // J adiabatically invariant
    expect(Math.abs((E1 - E0) / E0)).toBeGreaterThan(0.4); // E is NOT (changes ~w)
  });

  it('turning points and potential are consistent', () => {
    close(potential('harmonic', 0, 1), 0, 1e-12);
    close(potential('pendulum', 0, 1), 0, 1e-12);
    const [qm, qp] = turningPoints('harmonic', 2, 1);
    close(qp, 2, 1e-9); close(qm, -2, 1e-9);              // A = sqrt(2E)/w0
    close(energyOf('harmonic', 2, 0, 1), 2, 1e-12);       // E at the turning point
    expect(turningPoints('pendulum', 3, 1)).toBeNull();   // E > 2 w0^2: no libration
  });
});
