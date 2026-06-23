// Invariants for the current-loop torque: the torque formula, energy
// conservation of the free magnetic pendulum, its small-angle period, and the
// motor terminal speed.

import { describe, it, expect } from 'vitest';
import { torqueFree, torqueMotor, energy, createState, step, totalEnergy, smallAnglePeriod, terminalOmegaMotor } from './sim.js';

const base = { N: 1, I: 1, A: 1, B: 1, Im: 1, gamma: 0, mode: 'free' };

describe('Torque tau = N I A B sin(theta)', () => {
  it('is maximal at theta = pi/2 and zero at 0 and pi', () => {
    expect(Math.abs(torqueFree(2, 1.5, 0.8, 1.2, Math.PI / 2))).toBeCloseTo(2 * 1.5 * 0.8 * 1.2, 9);
    expect(torqueFree(2, 1.5, 0.8, 1.2, 0)).toBeCloseTo(0, 9);
    expect(torqueFree(2, 1.5, 0.8, 1.2, Math.PI)).toBeCloseTo(0, 9);
  });
  it('the motor torque is the rectified sine, always non-negative', () => {
    for (const th of [0.3, 1.2, 2.0, 3.0, 4.5]) expect(torqueMotor(1, 1, 1, 1, th)).toBeGreaterThanOrEqual(0);
  });
  it('the orientation energy is minimal at theta = 0 (stable) and maximal at pi', () => {
    expect(energy(1, 1, 1, 1, 0)).toBeLessThan(energy(1, 1, 1, 1, 0.5));
    expect(energy(1, 1, 1, 1, Math.PI)).toBeGreaterThan(energy(1, 1, 1, 1, Math.PI - 0.5));
  });
});

describe('Free magnetic pendulum conserves energy (no damping)', () => {
  it('total energy is constant along the trajectory', () => {
    const p = { ...base, gamma: 0 };
    const s = createState(1.0, 0);
    const E0 = totalEnergy(s, p);
    let maxDev = 0;
    for (let i = 0; i < 20000; i += 1) { step(s, 0.002, p); maxDev = Math.max(maxDev, Math.abs(totalEnergy(s, p) - E0)); }
    expect(maxDev).toBeLessThan(2e-3);
  });
  it('small-angle oscillation period matches 2 pi sqrt(Im / N I A B)', () => {
    const p = { ...base, gamma: 0 };
    const s = createState(0.04, 0);          // small amplitude
    const Tpred = smallAnglePeriod(p);
    // measure one period by detecting the return through theta=0 with omega>0.
    const tPrev = 0, crossings = [];
    let last = s.theta;
    for (let i = 0; i < 200000 && crossings.length < 3; i += 1) {
      const dt = 0.001; step(s, dt, p);
      if (last < 0 && s.theta >= 0 && s.omega > 0) crossings.push(s.t);
      last = s.theta;
    }
    const Tmeas = crossings[1] - crossings[0];
    expect(Tmeas).toBeCloseTo(Tpred, 1);
  });
});

describe('Motor reaches the predicted terminal speed', () => {
  it('the time-averaged omega approaches (2/pi) N I A B / gamma', () => {
    const p = { N: 1, I: 1, A: 1, B: 1, Im: 0.2, gamma: 0.5, mode: 'motor' };
    const s = createState(0.2, 0);
    // spin up
    for (let i = 0; i < 200000; i += 1) step(s, 0.001, p);
    // average over a further interval
    let sum = 0, n = 0;
    for (let i = 0; i < 100000; i += 1) { step(s, 0.001, p); sum += s.omega; n += 1; }
    const omegaBar = sum / n;
    expect(omegaBar).toBeCloseTo(terminalOmegaMotor(p), 0);
  });
});
