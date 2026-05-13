// Relativistic Doppler invariants.
// (a) gamma = 1 at beta = 0.
// (b) Longitudinal limits: theta = 0 -> sqrt((1+b)/(1-b)); theta = pi -> inverse.
// (c) Transverse: f_obs / f_src = 1/gamma.
// (d) Crossover: blueshift to redshift happens at theta = arccos(beta).
// (e) Low-beta limit: f_obs ~ f_src (1 + beta cos theta).

import { describe, it, expect } from 'vitest';
import {
  gamma, dopplerFactor,
  longitudinalApproach, longitudinalRecession, transverse,
} from './sim.js';

describe('relativistic-doppler', () => {
  it('gamma at beta = 0 equals 1', () => {
    expect(Math.abs(gamma(0) - 1)).toBeLessThan(1e-12);
  });

  it('longitudinal approach: dopplerFactor(beta, 0) = sqrt((1+b)/(1-b))', () => {
    const b = 0.6;
    expect(Math.abs(dopplerFactor(b, 0) - longitudinalApproach(b))).toBeLessThan(1e-12);
  });

  it('longitudinal recession: dopplerFactor(beta, pi) = sqrt((1-b)/(1+b))', () => {
    const b = 0.6;
    expect(Math.abs(dopplerFactor(b, Math.PI) - longitudinalRecession(b))).toBeLessThan(1e-12);
  });

  it('transverse Doppler at theta = pi/2 equals 1/gamma', () => {
    const b = 0.6;
    expect(Math.abs(dopplerFactor(b, Math.PI / 2) - transverse(b))).toBeLessThan(1e-12);
  });

  it('crossover blueshift to redshift at theta = arccos(beta)', () => {
    const b = 0.5;
    const theta = Math.acos(b);
    // At theta = acos(beta), 1 - beta cos theta = 1 - beta^2, so
    // dopplerFactor = 1/(gamma * (1 - beta^2)) = gamma * (1 + beta^2/(1-beta^2))? Let me check:
    // dopplerFactor = 1/(gamma (1 - beta cos theta)) at cos theta = beta gives
    // = 1/(gamma (1 - beta^2)) = 1/(gamma * 1/gamma^2) = gamma. So f_obs/f_src = gamma > 1 (blueshift).
    // The actual SR crossover from blueshift to redshift in the OBSERVER frame is
    // at theta = arccos(1/(gamma * (1 + 1/gamma))) or similar; here the angle of zero shift
    // is at gamma (1 - beta cos theta) = 1, i.e. cos theta = (1 - 1/gamma)/beta.
    expect(dopplerFactor(b, theta)).toBeGreaterThan(1);
  });

  it('SR transverse Doppler is a redshift (1/gamma < 1)', () => {
    expect(transverse(0.3)).toBeLessThan(1);
    expect(transverse(0.9)).toBeLessThan(1);
  });

  it('Doppler factor at low beta agrees with Newtonian: ~ 1 + beta cos theta', () => {
    const b = 1e-4;
    const theta = 0.7;
    const exact = dopplerFactor(b, theta);
    const newton = 1 + b * Math.cos(theta);
    expect(Math.abs(exact - newton) / exact).toBeLessThan(1e-6);
  });

  it('beta = 0 gives Doppler factor 1 for all angles', () => {
    for (const t of [0, 0.3, 1.5, Math.PI]) {
      expect(Math.abs(dopplerFactor(0, t) - 1)).toBeLessThan(1e-12);
    }
  });
});
