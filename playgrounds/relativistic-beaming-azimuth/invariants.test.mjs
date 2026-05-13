// Relativistic beaming invariant tests.
// (a) Non-relativistic limit beta -> 0: pattern is isotropic D = 1 + O(beta).
// (b) Doppler D(0) = 1 / (gamma (1 - beta)).
// (c) Beaming half-angle -> 1/gamma as gamma -> infinity.
// (d) Forward/backward intensity ratio at gamma = 10 alpha = 0: ~ (gamma (1+beta) / gamma (1-beta))^3 = ((1+beta)/(1-beta))^3.

import { describe, it, expect } from 'vitest';
import { doppler, beamingHalfAngle, beamingPattern } from './sim.js';

describe('Beaming: closed-form Doppler', () => {
  it('D(theta = 0) = 1 / (gamma (1 - beta))', () => {
    const beta = 0.99;
    const gamma = 1 / Math.sqrt(1 - beta * beta);
    expect(doppler(beta, 0)).toBeCloseTo(1 / (gamma * (1 - beta)), 8);
  });

  it('D(theta = pi) = 1 / (gamma (1 + beta))', () => {
    const beta = 0.99;
    const gamma = 1 / Math.sqrt(1 - beta * beta);
    expect(doppler(beta, Math.PI)).toBeCloseTo(1 / (gamma * (1 + beta)), 8);
  });

  it('D = 1 when beta = 0', () => {
    expect(doppler(0, Math.PI / 4)).toBe(1);
  });
});

describe('Beaming: half-angle approaches 1/gamma at high gamma', () => {
  it('beam half-angle is within 30% of 1/gamma at gamma = 20', () => {
    const gamma = 20;
    const beta = Math.sqrt(1 - 1 / (gamma * gamma));
    const theta = beamingHalfAngle(beta);
    // For gamma >> 1, half-angle ~ 1/gamma with a factor of order unity.
    expect(theta * gamma).toBeGreaterThan(0.5);
    expect(theta * gamma).toBeLessThan(2.0);
  });
});

describe('Beaming: forward/backward asymmetry', () => {
  it('at gamma = 10, alpha = 0, I(0)/I(pi) ~ ((1+beta)/(1-beta))^3', () => {
    const gamma = 10;
    const beta = Math.sqrt(1 - 1 / (gamma * gamma));
    const I0 = Math.pow(doppler(beta, 0), 3);
    const Ipi = Math.pow(doppler(beta, Math.PI), 3);
    const expected = Math.pow((1 + beta) / (1 - beta), 3);
    expect(Math.abs(I0 / Ipi - expected) / expected).toBeLessThan(1e-6);
  });
});

describe('Beaming: pattern array has the expected shape', () => {
  it('intensity peaks at theta = 0 and minimum at theta = pi', () => {
    const { intensities } = beamingPattern({ gamma: 5, alpha: 0, n: 360 });
    expect(intensities[0]).toBeGreaterThan(intensities[90]);
    expect(intensities[0]).toBeGreaterThan(intensities[180]);
    expect(intensities[180]).toBeLessThan(intensities[90]);
  });
});
