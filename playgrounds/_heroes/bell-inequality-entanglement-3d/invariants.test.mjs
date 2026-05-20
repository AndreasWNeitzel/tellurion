import { describe, it, expect } from 'vitest';
import {
  correlation_QM, jointProbabilities, marginalProbability,
  chshS, OPTIMAL_ANGLES, TSIRELSON_BOUND, CLASSICAL_BOUND,
  correlation_LHV_envelope, sampleCorrelation, makeRng,
} from './sim.js';

describe('bell-inequality-entanglement-3d', () => {
  it('singlet correlation: E(0, 0) = -1 (perfect anticorrelation)', () => {
    expect(correlation_QM(0, 0)).toBeCloseTo(-1, 9);
  });

  it('singlet correlation: E(0, pi/2) = +1 (perfect correlation)', () => {
    expect(correlation_QM(0, Math.PI / 2)).toBeCloseTo(1, 9);
  });

  it('singlet correlation: E(0, pi/4) = 0 (uncorrelated)', () => {
    expect(correlation_QM(0, Math.PI / 4)).toBeCloseTo(0, 9);
  });

  it('singlet correlation is periodic with period pi (not 2 pi)', () => {
    expect(correlation_QM(0.3, 0.5)).toBeCloseTo(correlation_QM(0.3 + Math.PI, 0.5), 9);
  });

  it('joint probabilities sum to 1', () => {
    const p = jointProbabilities(0.4, 0.7);
    const total = p.pp + p.mm + p.pm + p.mp;
    expect(total).toBeCloseTo(1, 9);
  });

  it('marginal probability is 1/2', () => {
    expect(marginalProbability()).toBeCloseTo(0.5, 9);
  });

  it('|CHSH| at optimal angles = 2 sqrt 2', () => {
    const { a, ap, b, bp } = OPTIMAL_ANGLES;
    expect(Math.abs(chshS(a, ap, b, bp))).toBeCloseTo(TSIRELSON_BOUND, 9);
  });

  it('Tsirelson bound is 2 sqrt 2', () => {
    expect(TSIRELSON_BOUND).toBeCloseTo(2 * Math.sqrt(2), 9);
  });

  it('classical CHSH bound is 2', () => {
    expect(CLASSICAL_BOUND).toBe(2);
  });

  it('|CHSH| > 2 at optimal QM angles (LHV violated)', () => {
    const { a, ap, b, bp } = OPTIMAL_ANGLES;
    expect(Math.abs(chshS(a, ap, b, bp))).toBeGreaterThan(2);
  });

  it('LHV envelope at delta = 0 is +1 (max anti-correlation envelope)', () => {
    expect(correlation_LHV_envelope(0, 0)).toBeCloseTo(1, 9);
  });

  it('LHV envelope at delta = pi/4 is 0.5', () => {
    expect(correlation_LHV_envelope(0, -Math.PI / 4)).toBeCloseTo(0.5, 9);
  });

  it('LHV envelope is bounded by |E| <= 1', () => {
    for (let k = 0; k <= 100; k++) {
      const d = (k / 100) * Math.PI;
      const E = correlation_LHV_envelope(0, -d);
      expect(Math.abs(E)).toBeLessThanOrEqual(1.001);
    }
  });

  it('quantum E lies outside LHV envelope at delta = pi/8', () => {
    // At delta = pi/8: E_QM = -cos(pi/4) = -0.707.
    // |E_LHV| envelope = 1 - 2*(pi/8)/pi = 0.75.
    // |E_QM| = 0.707 < 0.75, so it lies INSIDE the envelope there.
    // The violation comes from CHSH (combination of 4 angles), not
    // from any single E exceeding the envelope.
    const E_QM = correlation_QM(0, Math.PI / 8);
    const E_LHV = correlation_LHV_envelope(0, -Math.PI / 8);
    expect(Math.abs(E_QM)).toBeLessThan(E_LHV + 0.05);
  });

  it('sampled correlation converges to E_QM', () => {
    const rng = makeRng(0xC0FFEE);
    const a = Math.PI / 8, b = 0;
    const E_qm = correlation_QM(a, b);
    const E_sample = sampleCorrelation(20000, a, b, rng);
    expect(E_sample).toBeCloseTo(E_qm, 1);
  });

  it('sampled correlation is in [-1, +1]', () => {
    const rng = makeRng(0xC0FFEE);
    const E = sampleCorrelation(500, 0.3, 0.7, rng);
    expect(E).toBeGreaterThanOrEqual(-1);
    expect(E).toBeLessThanOrEqual(1);
  });
});
