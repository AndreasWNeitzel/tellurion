// Ampere's law invariant tests: the closed line integral of B equals mu0 times
// the enclosed current, in all three symmetric cases, plus the field laws.

import { describe, it, expect } from 'vitest';
import { MU0, fieldWire, fieldSolenoid, fieldToroid, ampereCheck } from './sim.js';

describe('Field laws', () => {
  it('the straight-wire field is azimuthal and falls as 1/r', () => {
    expect(fieldWire(2, 1)).toBeCloseTo(MU0 * 2 / (2 * Math.PI), 9);
    expect(fieldWire(2, 0.5) / fieldWire(2, 1)).toBeCloseTo(2, 9);   // doubling distance halves B
  });
  it('the solenoid field is uniform inside and zero outside', () => {
    expect(fieldSolenoid(1.5, 8, 1, 0.4)).toBeCloseTo(MU0 * 8 * 1.5, 9);
    expect(fieldSolenoid(1.5, 8, 1, 0.9)).toBeCloseTo(MU0 * 8 * 1.5, 9);
    expect(fieldSolenoid(1.5, 8, 1, 1.3)).toBe(0);
  });
  it('the toroid field falls as 1/r inside the windings and is zero outside', () => {
    expect(fieldToroid(1, 20, 1, 2, 1.5)).toBeCloseTo(MU0 * 20 / (2 * Math.PI * 1.5), 9);
    expect(fieldToroid(1, 20, 1, 2, 0.5)).toBe(0);   // inside the hole
    expect(fieldToroid(1, 20, 1, 2, 2.5)).toBe(0);   // outside
  });
});

describe("Ampere's law: circulation = mu0 I_enclosed", () => {
  it('holds for a circular loop around a straight wire, any radius', () => {
    const p = { I: 3 };
    for (const r of [0.4, 1.0, 2.5]) {
      const c = ampereCheck('wire', p, r);
      expect(c.circulation).toBeCloseTo(c.Ienc, 9);
    }
  });
  it('holds for a rectangular loop across a solenoid wall, any length', () => {
    const p = { I: 2, n: 6, Rsol: 1 };
    for (const l of [0.5, 1.0, 2.0]) {
      const c = ampereCheck('solenoid', p, l);
      expect(c.circulation).toBeCloseTo(c.Ienc, 9);
      expect(c.Ienc).toBeCloseTo(MU0 * p.n * l * p.I, 9);
    }
  });
  it('holds for a circular loop inside a toroid, enclosing all N turns', () => {
    const p = { I: 1.5, N: 24, a: 1, b: 2 };
    for (const r of [1.2, 1.5, 1.8]) {
      const c = ampereCheck('toroid', p, r);
      expect(c.circulation).toBeCloseTo(c.Ienc, 9);
      expect(c.Ienc).toBeCloseTo(MU0 * p.N * p.I, 9);
    }
  });
  it('a loop in the toroid hole or outside encloses no current and reads zero', () => {
    const p = { I: 1.5, N: 24, a: 1, b: 2 };
    expect(ampereCheck('toroid', p, 0.6).Ienc).toBe(0);
    expect(ampereCheck('toroid', p, 2.5).Ienc).toBe(0);
  });
});
