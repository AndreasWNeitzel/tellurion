// Driven series RLC invariant tests. Closed-form steady-state AC, so these are
// exact resonance, bandwidth, and phasor relations.

import { describe, it, expect } from 'vitest';
import {
  omega0, reactance, impedance, currentAmp, phase, qFactor, bandwidth, voltages,
} from './sim.js';

const R = 50, L = 0.01, C = 1e-6, V0 = 5;
const w0 = omega0(L, C);

describe('Resonance', () => {
  it('reactance vanishes at omega_0 and the impedance is minimal there', () => {
    expect(reactance(w0, L, C)).toBeCloseTo(0, 6);
    expect(impedance(w0, R, L, C)).toBeCloseTo(R, 9);
    // off resonance the impedance is larger.
    expect(impedance(0.7 * w0, R, L, C)).toBeGreaterThan(R);
    expect(impedance(1.4 * w0, R, L, C)).toBeGreaterThan(R);
  });
  it('the current is maximal (V0/R) and in phase at resonance', () => {
    expect(currentAmp(V0, w0, R, L, C)).toBeCloseTo(V0 / R, 9);
    expect(phase(w0, R, L, C)).toBeCloseTo(0, 9);
    for (const w of [0.6 * w0, 0.9 * w0, 1.1 * w0, 1.6 * w0]) {
      expect(currentAmp(V0, w, R, L, C)).toBeLessThan(currentAmp(V0, w0, R, L, C));
    }
  });
  it('the phase is capacitive (negative) below and inductive (positive) above', () => {
    expect(phase(0.8 * w0, R, L, C)).toBeLessThan(0);
    expect(phase(1.25 * w0, R, L, C)).toBeGreaterThan(0);
  });
});

describe('Quality factor and bandwidth', () => {
  it('the three forms of Q agree', () => {
    const Qa = w0 * L / R, Qb = 1 / (w0 * R * C), Qc = qFactor(R, L, C);
    expect(Qa).toBeCloseTo(Qb, 9);
    expect(Qa).toBeCloseTo(Qc, 9);
  });
  it('the exact half-power frequencies give I_max/sqrt(2) and are spaced by R/L', () => {
    const Imax = currentAmp(V0, w0, R, L, C);
    // |X| = R there, i.e. omega L - 1/(omega C) = +/- R.
    const disc = Math.sqrt(R * R + 4 * L / C);
    const wHi = (R + disc) / (2 * L), wLo = (-R + disc) / (2 * L);
    expect(currentAmp(V0, wHi, R, L, C)).toBeCloseTo(Imax / Math.SQRT2, 9);
    expect(currentAmp(V0, wLo, R, L, C)).toBeCloseTo(Imax / Math.SQRT2, 9);
    expect(wHi - wLo).toBeCloseTo(bandwidth(R, L), 6);   // = R/L, exactly
  });
});

describe('Phasor relations', () => {
  it('the component voltages add as phasors to the source amplitude', () => {
    for (const w of [0.7 * w0, w0, 1.3 * w0]) {
      const v = voltages(V0, w, R, L, C);
      expect(Math.hypot(v.VR, v.VL - v.VC)).toBeCloseTo(V0, 6);
    }
  });
  it('V_L equals V_C at resonance, each Q times the source', () => {
    const v = voltages(V0, w0, R, L, C);
    expect(v.VL).toBeCloseTo(v.VC, 6);
    expect(v.VL / V0).toBeCloseTo(qFactor(R, L, C), 3);
  });
});
