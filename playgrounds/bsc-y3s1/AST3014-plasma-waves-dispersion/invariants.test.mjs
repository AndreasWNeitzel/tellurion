import { describe, it, expect } from 'vitest';
import {
  plasmaFrequency, langmuir, ionAcoustic, oMode, oModeSpeeds, alfven,
  upperHybrid, xCutoffs, xModeK2, xModePropagates,
  E_CHARGE, EPS0, M_E, C_LIGHT,
} from './sim.js';

describe('plasma-waves-dispersion invariants', () => {
  it('plasma frequency matches sqrt(n e^2 / eps0 m_e)', () => {
    const n = 1e18;
    const expected = Math.sqrt(n * E_CHARGE ** 2 / (EPS0 * M_E));
    expect(plasmaFrequency(n)).toBeCloseTo(expected, 6);
    // n = 0 -> wp = 0; quadruple n -> double wp
    expect(plasmaFrequency(0)).toBe(0);
    expect(plasmaFrequency(4 * n) / plasmaFrequency(n)).toBeCloseTo(2, 12);
  });

  it('O-mode: cutoff w = wp at k = 0, and w^2 - c^2 k^2 = wp^2 exactly', () => {
    const wp = 1, c = 20;
    expect(oMode(0, wp, c)).toBeCloseTo(wp, 12);
    for (const k of [0.05, 0.2, 0.5]) {
      const w = oMode(k, wp, c);
      expect(w * w - c * c * k * k).toBeCloseTo(wp * wp, 9);
      expect(w / k).toBeGreaterThan(c);              // superluminal phase speed
    }
  });

  it('O-mode phase and group speeds satisfy v_ph * v_gr = c^2', () => {
    const wp = 1, c = 20;
    for (const k of [0.05, 0.15, 0.4]) {
      const { vph, vgr } = oModeSpeeds(k, wp, c);
      expect(vph * vgr).toBeCloseTo(c * c, 6);
      expect(vgr).toBeLessThan(c);
    }
  });

  it('X-mode band structure: stop-band between the upper-hybrid resonance and the right cutoff', () => {
    const wp = 1, wc = 0.6, c = 20;
    const wUH = upperHybrid(wp, wc);
    const { wL, wR } = xCutoffs(wp, wc);
    expect(wUH).toBeCloseTo(Math.sqrt(wp * wp + wc * wc), 12);
    expect(wL).toBeLessThan(wUH);
    expect(wUH).toBeLessThan(wR);
    // (wL, wUH): the lower X-mode branch propagates
    expect(xModePropagates(0.5 * (wL + wUH), wp, wc, c)).toBe(true);
    // (wUH, wR): evanescent stop-band (between resonance and cutoff)
    expect(xModePropagates(0.5 * (wUH + wR), wp, wc, c)).toBe(false);
    // (0, wL): evanescent
    expect(xModePropagates(0.5 * wL, wp, wc, c)).toBe(false);
    // (wR, inf): propagating
    expect(xModePropagates(wR * 1.5, wp, wc, c)).toBe(true);
  });

  it('Bohm-Gross Langmuir: w -> wp as k -> 0, and w^2 - wp^2 = 3 k^2 vth^2', () => {
    const wp = 1, vth = 0.05;
    expect(langmuir(0, wp, vth)).toBeCloseTo(wp, 12);
    for (const k of [1, 5, 20]) {
      const w = langmuir(k, wp, vth);
      expect(w * w - wp * wp).toBeCloseTo(3 * k * k * vth * vth, 9);
    }
  });

  it('ion-acoustic: w -> k cs for k lambdaD << 1 and saturates at cs/lambdaD', () => {
    const cs = 0.02, lambdaD = 0.3;
    expect(ionAcoustic(1e-4, cs, lambdaD) / (1e-4 * cs)).toBeCloseTo(1, 6);
    const wInf = ionAcoustic(1e6, cs, lambdaD);
    expect(wInf).toBeCloseTo(cs / lambdaD, 4);              // ion plasma frequency
  });

  it('Alfven wave is non-dispersive: w = k v_A exactly', () => {
    const vA = 0.3;
    for (const k of [0.5, 3, 7]) expect(alfven(k, vA)).toBeCloseTo(k * vA, 12);
  });

  it('deterministic: pure functions reproduce outputs exactly', () => {
    expect(oMode(0.3, 1, 20)).toBe(oMode(0.3, 1, 20));
    expect(xModeK2(2.1, 1, 0.6, 20)).toBe(xModeK2(2.1, 1, 0.6, 20));
  });
});
