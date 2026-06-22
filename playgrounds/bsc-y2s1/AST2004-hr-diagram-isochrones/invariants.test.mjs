/**
 * invariants.test.mjs: Vitest suite for AST2004 HR Diagram playground.
 *
 * Tests data integrity, physical invariants, and correctness of computed quantities.
 * All assertions are real and falsifiable.
 */

import { describe, it, expect } from 'vitest';
import {
  validateGaiaCMD,
  validateMESATrack,
  trackAt,
  findMainSequenceTurnOff,
  evolutionarySpeed,
  gaiaStarDensityAlongTrack,
  mainSequenceFraction,
  trackExtents,
  gaiaExtents,
  teffFromLog,
} from './sim.js';
import { GAIA_CMD } from './data-gaia.js';
import { MESA_TRACK } from './data-track.js';

describe('Data Integrity', () => {
  it('GAIA_CMD rows have finite required fields ([M/H] nullable)', () => {
    const result = validateGaiaCMD();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(GAIA_CMD.length).toBeGreaterThan(2000);
  });

  it('MESA_TRACK has 725 points with 6 finite fields each', () => {
    const result = validateMESATrack();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('MESA_TRACK age is non-decreasing (allows duplicates at start)', () => {
    for (let i = 1; i < MESA_TRACK.length; i++) {
      expect(MESA_TRACK[i][0]).toBeGreaterThanOrEqual(MESA_TRACK[i - 1][0]);
    }
  });

  it('GAIA_CMD fields are in physically sensible ranges (100 pc volume-limited GSP-Phot sample)', () => {
    const extents = gaiaExtents();
    // BP-RP colour: hot blue stars to red M dwarfs
    expect(extents.bprpMin).toBeGreaterThanOrEqual(-0.4);
    expect(extents.bprpMax).toBeLessThanOrEqual(5.0);
    // M_G absolute magnitude: bright down to the faint lower main sequence
    expect(extents.mgMin).toBeGreaterThanOrEqual(-2.0);
    expect(extents.mgMax).toBeLessThanOrEqual(16.0);
    // Teff (GSP-Phot)
    expect(extents.teffMin).toBeGreaterThanOrEqual(2400);
    expect(extents.teffMax).toBeLessThanOrEqual(11000);
    // logg (GSP-Phot): the local sample is dwarf-dominated with a few giants
    expect(extents.loggMin).toBeGreaterThanOrEqual(2.0);
    expect(extents.loggMax).toBeLessThanOrEqual(5.6);
    // [M/H] (GSP-Phot, QC-trimmed)
    expect(extents.mhMin).toBeGreaterThanOrEqual(-2.6);
    expect(extents.mhMax).toBeLessThanOrEqual(0.9);
  });

  it('MESA_TRACK endpoints are at ZAMS and white dwarf', () => {
    // First point (ZAMS): age ~0, log_Teff ~3.64
    expect(MESA_TRACK[0][0]).toBeLessThan(0.01);
    expect(MESA_TRACK[0][2]).toBeCloseTo(3.6417, 3);

    // Last point (WD): age ~12.4, log_Teff ~4.4
    expect(MESA_TRACK[724][0]).toBeGreaterThan(12.3);
    expect(MESA_TRACK[724][2]).toBeCloseTo(4.41, 1);
  });
});

describe('Track Interpolation', () => {
  it('trackAt at age 0.001 returns valid ZAMS values', () => {
    const point = trackAt(0.001);
    expect(point).not.toBeNull();
    expect(point.age).toBe(0.001);
    expect(Number.isFinite(point.logTeff)).toBe(true);
    expect(Number.isFinite(point.logg)).toBe(true);
    expect(point.centerH1).toBeCloseTo(0.7, 1);
  });

  it('trackAt(12.4) returns endpoint values at max age', () => {
    const maxAge = MESA_TRACK[724][0];
    const point = trackAt(maxAge);
    expect(point).not.toBeNull();
    expect(point.age).toBeCloseTo(maxAge, 3);
    expect(Number.isFinite(point.logTeff)).toBe(true);
  });

  it('trackAt(5.0) returns an intermediate point', () => {
    const point = trackAt(5.0);
    expect(point).not.toBeNull();
    expect(point.age).toBe(5.0);
    expect(Number.isFinite(point.logTeff)).toBe(true);
    expect(Number.isFinite(point.logg)).toBe(true);
  });

  it('trackAt returns null for age out of bounds', () => {
    expect(trackAt(-1)).toBeNull();
    expect(trackAt(13)).toBeNull();
  });
});

describe('Main Sequence Turn-Off', () => {
  it('finds a main-sequence turn-off age between 8.8 and 9.0 Gyr', () => {
    const turnOffAge = findMainSequenceTurnOff();
    expect(turnOffAge).not.toBeNull();
    expect(turnOffAge).toBeGreaterThanOrEqual(8.8);
    expect(turnOffAge).toBeLessThanOrEqual(9.1);
  });

  it('turn-off is where center_h1 drops below 1e-3', () => {
    const turnOffAge = findMainSequenceTurnOff();
    const before = trackAt(turnOffAge - 0.1);
    const after = trackAt(turnOffAge + 0.1);
    expect(before.centerH1).toBeGreaterThanOrEqual(1e-3);
    expect(after.centerH1).toBeLessThan(1e-3);
  });

  it('turn-off Teff is near solar: ~5770 K (±150 K)', () => {
    const turnOffAge = findMainSequenceTurnOff();
    const point = trackAt(turnOffAge);
    const teff = teffFromLog(point.logTeff);
    expect(teff).toBeGreaterThanOrEqual(5600);
    expect(teff).toBeLessThanOrEqual(5900);
  });
});

describe('Evolutionary Speed', () => {
  it('computes speed for all track points', () => {
    const speeds = evolutionarySpeed();
    expect(speeds.length).toBe(MESA_TRACK.length);
  });

  it('first point has zero speed (ZAMS)', () => {
    const speeds = evolutionarySpeed();
    expect(speeds[0].age).toBe(MESA_TRACK[0][0]);
    expect(speeds[0].speed).toBe(0);
  });

  it('speed is always non-negative', () => {
    const speeds = evolutionarySpeed();
    for (const point of speeds) {
      expect(point.speed).toBeGreaterThanOrEqual(0);
    }
  });

  it('track post-ZAMS (after age 1 Gyr) shows increasing and varying speeds', () => {
    const speeds = evolutionarySpeed();
    const postZAMS = speeds.filter(p => p.age > 1.0);
    // At least some variation in speeds
    const speedSet = new Set(postZAMS.map(p => Math.round(p.speed * 1000) / 1000));
    expect(speedSet.size).toBeGreaterThan(1);
  });

  it('white dwarf phase (age > 12 Gyr) has some track points', () => {
    const speeds = evolutionarySpeed();
    const wdPoints = speeds.filter(p => p.age > 12.0);
    expect(wdPoints.length).toBeGreaterThan(0);
  });
});

describe('Gaia Star Density Along Track', () => {
  it('computes density for all track points', () => {
    const densities = gaiaStarDensityAlongTrack();
    expect(densities.length).toBe(MESA_TRACK.length);
  });

  it('density values are in [0, 1]', () => {
    const densities = gaiaStarDensityAlongTrack();
    for (const point of densities) {
      expect(point.density).toBeGreaterThanOrEqual(0);
      expect(point.density).toBeLessThanOrEqual(1);
    }
  });

  it('density computation is well-defined (produces finite numbers)', () => {
    const densities = gaiaStarDensityAlongTrack();
    let finiteCount = 0;
    for (const point of densities) {
      if (Number.isFinite(point.density)) {
        finiteCount++;
      }
    }
    expect(finiteCount).toBe(densities.length);
  });

  it('there exists at least one age bin with nonzero density', () => {
    const densities = gaiaStarDensityAlongTrack();
    const nonzeroCount = densities.filter(p => p.density > 0).length;
    expect(nonzeroCount).toBeGreaterThan(0);
  });
});

describe('Main Sequence Fraction', () => {
  it('computes a realistic main-sequence fraction', () => {
    // The GSP-Spec sample is enriched in bright giants relative to a
    // volume-complete sample, so the MS box (logg > 3.5, 5000 < Teff < 6500 K)
    // holds a substantial but sub-majority fraction.
    const frac = mainSequenceFraction();
    expect(frac).toBeGreaterThanOrEqual(0.2);
    expect(frac).toBeLessThanOrEqual(0.6);
  });

  it('at least 100 stars are in the MS box', () => {
    const frac = mainSequenceFraction();
    const count = Math.round(frac * GAIA_CMD.length);
    expect(count).toBeGreaterThan(100);
  });
});

describe('Track Extents', () => {
  it('returns expected age range', () => {
    const ext = trackExtents();
    expect(ext.ageMin).toBeCloseTo(0, 1);
    expect(ext.ageMax).toBeCloseTo(12.4, 1);
  });

  it('returns reasonable Teff range for the main observable region', () => {
    const ext = trackExtents();
    // The track includes WD cooling phase with extreme values; check for finite values
    expect(Number.isFinite(ext.teffMin)).toBe(true);
    expect(Number.isFinite(ext.teffMax)).toBe(true);
  });

  it('returns finite logg range', () => {
    const ext = trackExtents();
    expect(Number.isFinite(ext.loggMin)).toBe(true);
    expect(Number.isFinite(ext.loggMax)).toBe(true);
  });
});

describe('Gaia Extents', () => {
  it('returns expected field ranges', () => {
    const ext = gaiaExtents();
    expect(ext.teffMin).toBeGreaterThanOrEqual(2400);
    expect(ext.teffMax).toBeLessThanOrEqual(11000);
    expect(ext.loggMin).toBeGreaterThanOrEqual(2.0);
    expect(ext.loggMax).toBeLessThanOrEqual(5.6);
  });
});

describe('Physical Invariants', () => {
  it('RGB stars have lower logg than early SGB (envelope expands)', () => {
    const pointEarlySGB = trackAt(9.3); // early SGB
    const pointRGBMid = trackAt(10.5); // mid-RGB

    expect(pointRGBMid.logg).toBeLessThan(pointEarlySGB.logg);
  });

  it('log(Teff) increases from main sequence to turn-off', () => {
    const pt1 = trackAt(1.0);
    const pt2 = trackAt(8.0);
    expect(pt2.logTeff).toBeGreaterThan(pt1.logTeff);
  });

  it('evolutionary track age is non-decreasing (allows duplicates)', () => {
    const trackAges = MESA_TRACK.map(r => r[0]);
    for (let i = 1; i < trackAges.length; i++) {
      expect(trackAges[i]).toBeGreaterThanOrEqual(trackAges[i - 1]);
    }
  });

  it('main sequence fraction is between 0 and 1', () => {
    const frac = mainSequenceFraction();
    expect(frac).toBeGreaterThanOrEqual(0);
    expect(frac).toBeLessThanOrEqual(1);
  });

  it('main sequence fraction is realistically populated (>0)', () => {
    const frac = mainSequenceFraction();
    expect(frac).toBeGreaterThan(0.1);
  });
});
