// Special relativity: the spacetime interval is boost-invariant,
// length contracts and time dilates by gamma, the twin gap is
// 2L/beta - 2L/(gamma beta), velocities compose below c with c
// invariant, and simultaneity is relative.

import { describe, it, expect } from 'vitest';
import {
  gamma, boost, interval, contractedLength, dilatedTime,
  addVelocity, twinTrip, dopplerFactor, simultaneityLine,
} from './sim.js';

describe('special-relativity-spacetime-lab invariants', () => {
  it('gamma and the beta = sqrt(3)/2 reference (gamma = 2)', () => {
    expect(gamma(0)).toBeCloseTo(1, 12);
    expect(gamma(0.6)).toBeCloseTo(1.25, 12);
    expect(gamma(Math.sqrt(3) / 2)).toBeCloseTo(2, 12);
  });

  it('the interval s^2 = t^2 - x^2 is invariant under any boost', () => {
    const events = [[3, 1], [2, 5], [-4, 2], [10, -7], [0.5, 0.9]];
    for (const [t, x] of events) {
      const s0 = interval(t, x);
      for (const beta of [0.1, 0.5, 0.866, -0.3, 0.99]) {
        const [tp, xp] = boost(t, x, beta);
        expect(Math.abs(interval(tp, xp) - s0)).toBeLessThan(1e-10);
      }
    }
  });

  it('length contracts to L0/2 at beta = 0.866', () => {
    const L0 = 10;
    expect(contractedLength(L0, Math.sqrt(3) / 2) / L0).toBeCloseTo(0.5, 4);
    expect(contractedLength(L0, 0)).toBeCloseTo(L0, 12);
    // monotone decreasing in beta
    let prev = L0 + 1;
    for (const b of [0.1, 0.3, 0.6, 0.8, 0.95, 0.99]) { const L = contractedLength(L0, b); expect(L).toBeLessThan(prev); prev = L; }
  });

  it('time dilates by gamma; a moving clock runs slow', () => {
    const tau = 5;
    expect(dilatedTime(tau, Math.sqrt(3) / 2)).toBeCloseTo(2 * tau, 9);
    // the moving clock shows tau while the lab elapses gamma tau
    const b = 0.8, lab = dilatedTime(tau, b);
    expect(tau / lab).toBeCloseTo(1 / gamma(b), 12);
  });

  it('twin paradox: traveller ages 2L/(gamma beta), gap exact', () => {
    const L = 6, beta = Math.sqrt(3) / 2;          // gamma = 2
    const tp = twinTrip(L, beta);
    expect(tp.home).toBeCloseTo(2 * L / beta, 9);
    expect(tp.travel).toBeCloseTo(2 * L / (gamma(beta) * beta), 9);
    expect(tp.travel / tp.home).toBeCloseTo(0.5, 4);   // traveller ages half
    expect(tp.gap).toBeCloseTo(tp.home - tp.travel, 12);
    expect(tp.gap).toBeGreaterThan(0);
  });

  it('velocity addition stays below c and keeps c invariant', () => {
    expect(addVelocity(0.6, 0.6)).toBeCloseTo(0.6 / (1 + 0.36) + 0.6 / 1.36, 9);
    expect(addVelocity(0.6, 0.6)).toBeLessThan(1);
    expect(addVelocity(0.99, 0.99)).toBeLessThan(1);
    expect(addVelocity(1, 0.5)).toBeCloseTo(1, 12);     // light stays at c
    expect(addVelocity(-0.5, 0.5)).toBeCloseTo(0, 12);
    expect(addVelocity(0.2, 0.001)).toBeCloseTo(0.201 / (1 + 0.0002), 9);
  });

  it('relativistic Doppler: approach blueshifts, recede redshifts, reciprocal', () => {
    const b = 0.5;
    const ap = dopplerFactor(b, true), re = dopplerFactor(b, false);
    expect(ap).toBeGreaterThan(1);
    expect(re).toBeLessThan(1);
    expect(ap * re).toBeCloseTo(1, 12);
    expect(dopplerFactor(0, true)).toBeCloseTo(1, 12);
  });

  it('simultaneity is relative: same-t events are not simultaneous after a boost', () => {
    const beta = 0.7, g = gamma(beta);
    const [t1, x1] = boost(0, 2, beta);
    const [t2, x2] = boost(0, 9, beta);
    expect(Math.abs(t1 - t2)).toBeGreaterThan(1e-6);             // no longer simultaneous
    expect(t1 - t2).toBeCloseTo(-g * beta * (2 - 9), 9);         // delta t' = -gamma beta delta x
    void x1; void x2;
    // the simultaneity line has slope beta in the (x, t) plane
    const ln = simultaneityLine(beta, 0, [0, 10]);
    const slope = (ln[1][1] - ln[0][1]) / (ln[1][0] - ln[0][0]);
    expect(slope).toBeCloseTo(beta, 9);
  });
});
