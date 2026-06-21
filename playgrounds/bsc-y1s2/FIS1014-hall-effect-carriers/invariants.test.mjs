// Invariants for the Hall effect: V_H = I B / (n q t). It is linear in B and I,
// inverse in n and t, its sign tracks the carrier sign, and it equals the steady
// Hall field times the bar width (the field that cancels the magnetic force).

import { describe, it, expect } from 'vitest';
import { E, CARRIERS, driftSpeed, hallField, hallVoltage, hallCoefficient } from './sim.js';

const I = 5e-3, B = 0.4, n = 2e21, w = 5e-3, t = 1e-3; // SI: 5 mA, 0.4 T, n in /m^3, mm geometry

describe('V_H scales correctly with each quantity', () => {
  it('is linear in B', () => {
    const v1 = hallVoltage(I, B, n, t, +1), v2 = hallVoltage(I, 2 * B, n, t, +1);
    expect(v2 / v1).toBeCloseTo(2, 10);
  });
  it('is linear in I', () => {
    expect(hallVoltage(2 * I, B, n, t, +1) / hallVoltage(I, B, n, t, +1)).toBeCloseTo(2, 10);
  });
  it('is inverse in carrier density n', () => {
    expect(hallVoltage(I, B, 2 * n, t, +1) / hallVoltage(I, B, n, t, +1)).toBeCloseTo(0.5, 10);
  });
  it('is inverse in thickness t', () => {
    expect(hallVoltage(I, B, n, 2 * t, +1) / hallVoltage(I, B, n, t, +1)).toBeCloseTo(0.5, 10);
  });
});

describe('The sign of V_H reveals the carrier sign', () => {
  it('holes give positive V_H, electrons negative, for B > 0 and I > 0', () => {
    expect(hallVoltage(I, B, n, t, CARRIERS.hole.sign)).toBeGreaterThan(0);
    expect(hallVoltage(I, B, n, t, CARRIERS.electron.sign)).toBeLessThan(0);
  });
  it('the two are exact opposites at the same magnitude', () => {
    expect(hallVoltage(I, B, n, t, +1)).toBeCloseTo(-hallVoltage(I, B, n, t, -1), 14);
  });
  it('the Hall coefficient carries the carrier sign', () => {
    expect(hallCoefficient(n, +1)).toBeGreaterThan(0);
    expect(hallCoefficient(n, -1)).toBeLessThan(0);
    expect(Math.abs(hallCoefficient(n, +1))).toBeCloseTo(1 / (n * E), 6);
  });
});

describe('Steady state: the Hall field cancels the magnetic force', () => {
  it('the steady Hall field equals v_d B', () => {
    expect(hallField(I, B, n, w, t)).toBeCloseTo(driftSpeed(I, n, w, t) * B, 14);
  });
  it('V_H magnitude equals the Hall field times the bar width', () => {
    expect(Math.abs(hallVoltage(I, B, n, t, +1))).toBeCloseTo(Math.abs(hallField(I, B, n, w, t)) * w, 14);
  });
});
