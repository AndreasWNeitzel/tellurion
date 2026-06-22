// Invariants for Landau quantization: the equally spaced levels with zero-point B/2, the
// cyclotron spacing, the shrinking orbit and magnetic length with field, the degeneracy
// proportional to B, and the depopulation of levels as B increases at fixed Fermi energy.

import { describe, it, expect } from 'vitest';
import { cyclotronFreq, landauEnergy, magneticLength, orbitRadius, degeneracyDensity, filledCount, highestFilledLevel } from './sim.js';

describe('Landau levels', () => {
  it('are equally spaced by hbar omega_c with a B/2 zero-point', () => {
    const B = 3;
    expect(landauEnergy(0, B)).toBeCloseTo(0.5 * B, 12);
    expect(landauEnergy(1, B) - landauEnergy(0, B)).toBeCloseTo(cyclotronFreq(B), 12);
    expect(landauEnergy(5, B) - landauEnergy(4, B)).toBeCloseTo(B, 12);
  });
});

describe('Orbits and magnetic length', () => {
  it('shrink as the field grows', () => {
    expect(magneticLength(4)).toBeCloseTo(0.5, 12);
    expect(magneticLength(8)).toBeLessThan(magneticLength(2));
    expect(orbitRadius(0, 4)).toBeCloseTo(0.5, 12);
    expect(orbitRadius(0, 8)).toBeLessThan(orbitRadius(0, 2));
  });
});

describe('Degeneracy', () => {
  it('is proportional to B', () => {
    expect(degeneracyDensity(2)).toBeCloseTo(2 * degeneracyDensity(1), 12);
    expect(degeneracyDensity(5) / degeneracyDensity(1)).toBeCloseTo(5, 12);
  });
});

describe('Filling at fixed Fermi energy', () => {
  it('counts the levels below E_F', () => {
    expect(filledCount(10, 1)).toBe(10);   // n=0..9 (9.5 <= 10)
    expect(filledCount(10, 2)).toBe(5);    // n=0..4 (4.5*2=9 <= 10)
    expect(highestFilledLevel(10, 2)).toBe(4);
  });
  it('fewer levels stay filled as B increases', () => {
    let prev = Infinity;
    for (const B of [1, 1.5, 2, 3, 4]) { const c = filledCount(10, B); expect(c).toBeLessThanOrEqual(prev); prev = c; }
  });
});
