import { describe, it, expect } from 'vitest';
import {
  pipeArea, velocity, pressure, bernoulliConstant, diagnostics, airfoilLift,
} from './sim.js';

describe('bernoulli-venturi-interactive invariants', () => {
  it('continuity: A*v is constant along the pipe to < 0.1%', () => {
    for (const ratio of [0.25, 0.5, 0.8]) {
      const { fluxSpread } = diagnostics(1.0, 1.2, 0.7, ratio, 400);
      expect(fluxSpread).toBeLessThan(1e-3);
    }
  });

  it('Bernoulli constant is conserved along the pipe to < 0.1%', () => {
    for (const [pT, rho, Q, ratio] of [[1, 1.2, 0.7, 0.3], [2, 1, 0.5, 0.6], [1.5, 1.5, 0.9, 0.45]]) {
      const { bernoulliSpread } = diagnostics(pT, rho, Q, ratio, 400);
      expect(bernoulliSpread).toBeLessThan(1e-3);
    }
  });

  it('the throat is the fastest, lowest-pressure station (Venturi effect)', () => {
    const pT = 1.0, rho = 1.2, Q = 0.8, ratio = 0.4;
    const vIn = velocity(Q, pipeArea(0, ratio));
    const vTh = velocity(Q, pipeArea(0.5, ratio));
    expect(vTh).toBeGreaterThan(vIn);                       // narrowest => fastest
    expect(pressure(pT, rho, vTh)).toBeLessThan(pressure(pT, rho, vIn)); // => lowest p
    expect(pipeArea(0.5, ratio)).toBeCloseTo(ratio, 12);    // throat area = ratio
    expect(pipeArea(0, ratio)).toBeCloseTo(1, 12);          // inlet area = 1
  });

  it('velocity is exactly inversely proportional to area (v*A invariant)', () => {
    const Q = 0.6;
    for (const x of [0.1, 0.3, 0.5, 0.72, 0.9]) {
      const A = pipeArea(x, 0.35);
      expect(velocity(Q, A) * A).toBeCloseTo(Q, 12);
    }
  });

  it('airfoil lift is positive when flow is faster over the top and scales with rho', () => {
    expect(airfoilLift(1.2, 1.0, 1.3, 1.0)).toBeGreaterThan(0);
    expect(airfoilLift(2.4, 1.0, 1.3, 1.0)).toBeCloseTo(2 * airfoilLift(1.2, 1.0, 1.3, 1.0), 9);
    expect(airfoilLift(1.2, 1.0, 1.0, 1.0)).toBeCloseTo(0, 12);   // no speed difference, no lift
  });

  it('deterministic: identical inputs reproduce identical outputs', () => {
    expect(bernoulliConstant(1, 1.2, 0.7, 0.5, 0.4)).toBe(bernoulliConstant(1, 1.2, 0.7, 0.5, 0.4));
  });
});
