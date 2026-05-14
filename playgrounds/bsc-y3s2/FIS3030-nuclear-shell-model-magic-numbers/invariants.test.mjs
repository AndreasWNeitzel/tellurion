// Shell-model invariants.
// (a) Magic numbers are exactly 2, 8, 20, 28, 50, 82, 126.
// (b) Each level has occupancy 2j+1.
// (c) Cumul grows monotonically.
// (d) Cumul reaches 126 at the last shown level.

import { describe, it, expect } from 'vitest';
import { LEVELS, MAGIC, fillIndex, isMagic, levelEnergyMeV } from './sim.js';

describe('nuclear-shell-model-magic-numbers', () => {
  it('MAGIC sequence is 2, 8, 20, 28, 50, 82, 126', () => {
    expect(MAGIC).toEqual([2, 8, 20, 28, 50, 82, 126]);
  });

  it('each level occupancy equals 2 j + 1', () => {
    for (const lvl of LEVELS) {
      expect(lvl.occ).toBe(2 * lvl.j + 1);
    }
  });

  it('cumul grows monotonically across levels', () => {
    let prev = 0;
    for (const lvl of LEVELS) {
      expect(lvl.cumul).toBeGreaterThan(prev);
      prev = lvl.cumul;
    }
  });

  it('cumul = sum of occupancies up to and including each level', () => {
    let sum = 0;
    for (const lvl of LEVELS) {
      sum += lvl.occ;
      expect(lvl.cumul).toBe(sum);
    }
  });

  it('every MAGIC number appears as a cumul somewhere', () => {
    const cumuls = new Set(LEVELS.map(l => l.cumul));
    for (const m of MAGIC) expect(cumuls.has(m)).toBe(true);
  });

  it('fillIndex(8) returns the 1p1/2 level', () => {
    const idx = fillIndex(8);
    expect(LEVELS[idx].label).toBe('1p1/2');
  });

  it('fillIndex(126) reaches the last 1i13/2 level', () => {
    const idx = fillIndex(126);
    expect(LEVELS[idx].label).toBe('1i13/2');
  });

  it('isMagic identifies magic numbers exactly', () => {
    for (const m of MAGIC) expect(isMagic(m)).toBe(true);
    for (const n of [4, 10, 15, 100]) expect(isMagic(n)).toBe(false);
  });

  it('levelEnergyMeV grows monotonically', () => {
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(levelEnergyMeV(i)).toBeGreaterThanOrEqual(levelEnergyMeV(i - 1));
    }
  });
});
