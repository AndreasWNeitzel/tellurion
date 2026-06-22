// Invariants for the two-level Boltzmann system: normalized populations, the low- and
// high-temperature limits, the heat capacity as the temperature derivative of the mean
// energy, the Schottky anomaly (peak that vanishes at both ends), and the peak location
// kT/Delta ~ 0.417 for equal degeneracies.

import { describe, it, expect } from 'vitest';
import { popExcited, popGround, meanEnergy, heatCapacity, schottkyPeak } from './sim.js';

describe('Populations', () => {
  it('sum to 1', () => {
    for (const [T, d, g0, g1] of [[1, 1, 1, 1], [0.4, 2, 1, 3], [5, 1, 2, 1]]) expect(popExcited(T, d, g0, g1) + popGround(T, d, g0, g1)).toBeCloseTo(1, 12);
  });
  it('limits: empty excited at T->0, ratio g1/(g0+g1) at T->infinity', () => {
    expect(popExcited(1e-3, 1, 1, 1)).toBeCloseTo(0, 6);
    expect(popExcited(1e6, 1, 1, 3)).toBeCloseTo(3 / 4, 4);
    expect(popExcited(1e6, 1, 2, 1)).toBeCloseTo(1 / 3, 4);
  });
});

describe('Mean energy', () => {
  it('rises from 0 to Delta g1/(g0+g1)', () => {
    expect(meanEnergy(1e-3, 2, 1, 1)).toBeCloseTo(0, 5);
    expect(meanEnergy(1e6, 2, 1, 1)).toBeCloseTo(2 * 0.5, 3);
    expect(meanEnergy(1e6, 2, 1, 3)).toBeCloseTo(2 * 0.75, 3);
  });
});

describe('Heat capacity is the Schottky anomaly', () => {
  it('vanishes at both temperature extremes and is positive between', () => {
    expect(heatCapacity(1e-3, 1, 1, 1)).toBeCloseTo(0, 6);
    expect(heatCapacity(1e4, 1, 1, 1)).toBeLessThan(1e-3);
    expect(heatCapacity(0.42, 1, 1, 1)).toBeGreaterThan(0.4);
  });
  it('equals d<E>/dT', () => {
    const d = 1.5, g0 = 1, g1 = 2, h = 1e-5;
    for (const T of [0.3, 0.7, 1.5]) { const num = (meanEnergy(T + h, d, g0, g1) - meanEnergy(T - h, d, g0, g1)) / (2 * h); expect(num).toBeCloseTo(heatCapacity(T, d, g0, g1), 4); }
  });
  it('peaks near kT/Delta = 0.417 for equal degeneracies', () => {
    expect(schottkyPeak(1, 1, 1).ratio).toBeCloseTo(0.417, 2);
    expect(schottkyPeak(2, 1, 1).ratio).toBeCloseTo(0.417, 2);
  });
});
