import { describe, it, expect } from 'vitest';
import {
  gamma, dopplerFactor, fluxRatio, brightness,
  apparentSuperluminal, thetaMaxSuperluminal, maxApparent,
  beamingHalfAngle, FLUX_EXPONENT, SPECTRAL_INDEX,
} from './sim.js';

describe('quasar-relativistic-jet-3d', () => {
  it('Lorentz factor scales as 1/sqrt(1 - beta^2)', () => {
    const b = 0.99;
    expect(gamma(b)).toBeCloseTo(1 / Math.sqrt(1 - b * b), 6);
  });

  it('Doppler factor is delta = 1/(Gamma (1 - beta cos theta)) for approaching jet', () => {
    const beta = 0.99;
    const G = gamma(beta);
    const th = 0.5;
    expect(dopplerFactor(beta, th, true)).toBeCloseTo(1 / (G * (1 - beta * Math.cos(th))), 9);
  });

  it('Doppler factor is delta = 1/(Gamma (1 + beta cos theta)) for receding jet', () => {
    const beta = 0.99;
    const G = gamma(beta);
    const th = 0.5;
    expect(dopplerFactor(beta, th, false)).toBeCloseTo(1 / (G * (1 + beta * Math.cos(th))), 9);
  });

  it('flux ratio = 1 at theta = 90 deg', () => {
    expect(fluxRatio(0.9, Math.PI / 2)).toBeCloseTo(1, 9);
  });

  it('flux ratio grows large as theta -> 0', () => {
    expect(fluxRatio(0.99, 0.05)).toBeGreaterThan(1e3);
  });

  it('flux exponent for steady jet is 3 - alpha = 2.3 (with alpha = 0.7)', () => {
    expect(FLUX_EXPONENT).toBeCloseTo(2.3, 9);
    expect(SPECTRAL_INDEX).toBeCloseTo(0.7, 9);
  });

  it('apparent superluminal velocity = beta sin theta / (1 - beta cos theta)', () => {
    const beta = 0.95;
    const th = 0.3;
    expect(apparentSuperluminal(beta, th)).toBeCloseTo(
      beta * Math.sin(th) / (1 - beta * Math.cos(th)), 9);
  });

  it('beta_app reaches max at cos theta = beta and equals beta * Gamma', () => {
    const beta = 0.99;
    const G = gamma(beta);
    const th = thetaMaxSuperluminal(beta);
    expect(apparentSuperluminal(beta, th)).toBeCloseTo(beta * G, 4);
    expect(maxApparent(beta)).toBeCloseTo(beta * G, 9);
  });

  it('beta_app can exceed 1 (superluminal)', () => {
    expect(apparentSuperluminal(0.99, Math.acos(0.99))).toBeGreaterThan(1);
  });

  it('beam half-angle = 1/Gamma in radians', () => {
    const beta = 0.99;
    const G = gamma(beta);
    expect(beamingHalfAngle(beta)).toBeCloseTo(1 / G, 9);
  });

  it('approaching brightness exceeds receding at any theta < 90 deg', () => {
    expect(brightness(0.9, 0.3, true)).toBeGreaterThan(brightness(0.9, 0.3, false));
  });

  it('at theta = 0 the approaching jet has delta = 2 Gamma (limit)', () => {
    const beta = 0.9999;
    const G = gamma(beta);
    expect(dopplerFactor(beta, 0, true)).toBeCloseTo(2 * G, 0);
  });

  it('at theta = pi/2 (edge-on), delta = 1/Gamma for both jets', () => {
    const beta = 0.99;
    const G = gamma(beta);
    expect(dopplerFactor(beta, Math.PI / 2, true)).toBeCloseTo(1 / G, 9);
    expect(dopplerFactor(beta, Math.PI / 2, false)).toBeCloseTo(1 / G, 9);
  });
});
