import { describe, it, expect } from 'vitest';
import {
  sinc, shgUndepleted, coherenceLength, pumpIntensity, shgDepleted,
  conversionEfficiency, nO, nE, nETheta, deltaK, phaseMatchAngleTypeI,
  shgSeries,
} from './sim.js';

describe('nonlinear-optics-shg invariants', () => {
  it('phase-matched undepleted SHG grows exactly as z^2', () => {
    const gamma = 0.02;
    let ref = null;
    for (const z of [0.5, 1, 2, 4, 7, 10]) {
      const r = shgUndepleted(z, 0, gamma) / (z * z);
      if (ref === null) ref = r;
      expect(r / ref).toBeCloseTo(1, 9);                       // I2w / z^2 constant
    }
    expect(sinc(0)).toBe(1);
  });

  it('phase mismatch gives coherence-length oscillation with period 2 L_c', () => {
    const gamma = 0.02, dk = 0.7;
    const Lc = coherenceLength(dk);
    expect(Lc).toBeCloseTo(Math.PI / dk, 12);
    // zeros of I2w at z = 2 m L_c (sin(dk z/2) = sin(m pi) = 0)
    for (const m of [1, 2, 3]) expect(shgUndepleted(2 * m * Lc, dk, gamma)).toBeLessThan(1e-9);
    // bounded by (2 gamma / dk)^2, far below the dk=0 value at large z
    const cap = (2 * gamma / dk) ** 2;
    for (let i = 1; i <= 50; i += 1) {
      const z = 0.3 * i * Lc;
      expect(shgUndepleted(z, dk, gamma)).toBeLessThan(cap * 1.0000001);
    }
    expect(shgUndepleted(5 * Lc, dk, gamma)).toBeLessThan(shgUndepleted(5 * Lc, 0, gamma));
  });

  it('depleted phase-matched solution conserves power (Manley-Rowe): I_w + I_2w = 1', () => {
    for (const gamma of [0.5, 1, 2]) {
      for (let i = 0; i <= 40; i += 1) {
        const z = 0.25 * i;
        expect(pumpIntensity(z, gamma) + shgDepleted(z, gamma)).toBeCloseTo(1, 9);
      }
    }
  });

  it('conversion efficiency is below 100% everywhere and rises monotonically to 1', () => {
    const gamma = 1;
    let prev = -1;
    for (let i = 0; i <= 60; i += 1) {
      const z = 0.2 * i;
      const eta = conversionEfficiency(z, gamma);
      expect(eta).toBeGreaterThanOrEqual(0);
      expect(eta).toBeLessThan(1);                              // tanh^2 < 1 strictly
      expect(eta).toBeGreaterThanOrEqual(prev);                 // monotone non-decreasing
      prev = eta;
    }
    expect(conversionEfficiency(12, gamma)).toBeGreaterThan(0.999);  // -> 1
  });

  it('small-z depleted solution reduces to the undepleted z^2 law', () => {
    const gamma = 0.5;                                          // L_NL = 2
    for (const z of [0.02, 0.05, 0.1]) {
      const dep = shgDepleted(z, gamma);                        // tanh^2(z/L_NL)
      const und = shgUndepleted(z, 0, gamma);                   // (gamma z)^2
      expect(dep / und).toBeCloseTo(1, 2);                      // agree as z -> 0
    }
  });

  it('beta-BBO Sellmeier matches the literature and the 1064 nm type-I angle', () => {
    // accepted indices (Eimerl et al. 1987)
    expect(nO(1.0642)).toBeCloseTo(1.6551, 2);
    expect(nE(1.0642)).toBeCloseTo(1.5425, 2);
    expect(nO(0.5321)).toBeCloseTo(1.6749, 2);
    expect(nO(1.0642)).toBeGreaterThan(nE(1.0642));             // negative uniaxial
    // normal dispersion (theta=0): n_o(2w) > n_o(w) so the uncorrected
    // mismatch is positive; tuning to theta=90 overshoots negative, so
    // the mismatch changes sign and a phase-matching angle exists.
    expect(deltaK(1.0642, 0)).toBeGreaterThan(0);
    expect(deltaK(1.0642, Math.PI / 2)).toBeLessThan(0);
    // type-I phase-matching angle for 1064 -> 532 nm is ~22.8 deg
    const th = phaseMatchAngleTypeI(1.0642) * 180 / Math.PI;
    expect(th).toBeGreaterThan(22.0);
    expect(th).toBeLessThan(23.6);
    // at that angle the collinear mismatch vanishes
    expect(Math.abs(deltaK(1.0642, phaseMatchAngleTypeI(1.0642)))).toBeLessThan(1e-6);
    // n_e(theta) interpolates between n_e (theta=90) and n_o (theta=0)
    expect(nETheta(0, 0.5321)).toBeCloseTo(nO(0.5321), 9);
    expect(nETheta(Math.PI / 2, 0.5321)).toBeCloseTo(nE(0.5321), 9);
  });

  it('deterministic: identical inputs reproduce the sweep bit-for-bit', () => {
    const a = shgSeries(20, 500, { dk: 0.4, gamma: 0.05 });
    const b = shgSeries(20, 500, { dk: 0.4, gamma: 0.05 });
    const c = shgSeries(8, 400, { gamma: 1, depleted: true });
    const d = shgSeries(8, 400, { gamma: 1, depleted: true });
    for (let i = 0; i <= 500; i += 1) expect(a.i2[i]).toBe(b.i2[i]);
    for (let i = 0; i <= 400; i += 1) { expect(c.i1[i]).toBe(d.i1[i]); expect(c.i2[i]).toBe(d.i2[i]); }
  });
});
