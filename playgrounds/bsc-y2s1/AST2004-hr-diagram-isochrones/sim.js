/**
 * sim.js: Pure, headless stellar evolution simulation module.
 *
 * Computes interpolated evolutionary tracks, main-sequence turn-off detection,
 * evolutionary timescales, and Gaia star density along the track, all without
 * DOM or canvas dependencies. Used by playground.js and test suites.
 *
 * Data sources (no fabricated values):
 * - Gaia DR3: ~3000 real stars with parallax_over_error > 10, RUWE < 1.4,
 *   parallax > 1 mas; M_G = G + 5*log10(parallax_mas) - 10. Teff/logg/[M/H] are
 *   the spectroscopic GSP-Spec values (logg uncapped, unlike GSP-Phot which
 *   saturates at 4.0). Gaia Collaboration 2023, A&A 674, A1.
 * - MESA 1 Msun solar metallicity track: 725 real evolutionary model points
 *   from ZAMS to white dwarf.
 *   Paxton et al. 2011, ApJS 192, 3 (and later instrument papers).
 */

import { GAIA_CMD } from './data-gaia.js';
import { MESA_TRACK } from './data-track.js';

/**
 * Validate GAIA_CMD data integrity.
 * Checks that all 2695 rows have 5 finite fields: [BP-RP, M_G, Teff, logg, [M/H]].
 * Returns {valid: boolean, errors: string[]}.
 */
export function validateGaiaCMD() {
  const errors = [];
  if (!Array.isArray(GAIA_CMD) || GAIA_CMD.length < 2000) {
    errors.push(`GAIA_CMD length ${GAIA_CMD?.length} too small (data truncated?)`);
    return { valid: false, errors };
  }
  for (let i = 0; i < GAIA_CMD.length; i++) {
    const row = GAIA_CMD[i];
    if (!Array.isArray(row) || row.length !== 5) {
      errors.push(`Row ${i}: not an array of 5 elements`);
      continue;
    }
    // The four required fields (BP-RP, M_G, Teff, logg) must be finite real values.
    for (let j = 0; j < 4; j++) {
      const val = row[j];
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        errors.push(`Row ${i}, col ${j}: non-finite value ${val}`);
      }
    }
    // [M/H] may be null where Gaia GSP-Spec provides no valid measurement; an
    // absent value is null, never imputed.
    const mh = row[4];
    if (mh !== null && (typeof mh !== 'number' || !Number.isFinite(mh))) {
      errors.push(`Row ${i}, col 4: [M/H] must be a finite number or null, got ${mh}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validate MESA_TRACK data integrity.
 * Checks that all 725 rows have 6 finite fields and age is non-decreasing
 * (allows duplicates at the beginning for ZAMS initialization).
 * Returns {valid: boolean, errors: string[]}.
 */
export function validateMESATrack() {
  const errors = [];
  if (!Array.isArray(MESA_TRACK) || MESA_TRACK.length !== 725) {
    errors.push(`MESA_TRACK length ${MESA_TRACK.length} != 725`);
    return { valid: false, errors };
  }
  for (let i = 0; i < MESA_TRACK.length; i++) {
    const row = MESA_TRACK[i];
    if (!Array.isArray(row) || row.length !== 6) {
      errors.push(`Row ${i}: not an array of 6 elements`);
      continue;
    }
    for (let j = 0; j < 6; j++) {
      const val = row[j];
      if (typeof val !== 'number' || !Number.isFinite(val)) {
        errors.push(`Row ${i}, col ${j}: non-finite value ${val}`);
      }
    }
    if (i > 0) {
      const prevAge = MESA_TRACK[i - 1][0];
      const currAge = row[0];
      if (currAge < prevAge) {
        errors.push(`Row ${i}: age ${currAge} not >= previous ${prevAge}`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Linear interpolation helper: given arrays x and y (same length, x strictly
 * increasing), interpolate y at position xTarget.
 * Returns the interpolated value, or null if xTarget is out of bounds.
 */
function interpolate1D(x, y, xTarget) {
  if (xTarget < x[0] || xTarget > x[x.length - 1]) {
    return null;
  }
  for (let i = 0; i < x.length - 1; i++) {
    if (xTarget >= x[i] && xTarget <= x[i + 1]) {
      const frac = (xTarget - x[i]) / (x[i + 1] - x[i]);
      return y[i] + frac * (y[i + 1] - y[i]);
    }
  }
  return null;
}

/**
 * Interpolate MESA track at a given age (Gyr).
 * Linear interpolation across the 725 real track points.
 * Returns {age, mass, logTeff, logL, logg, centerH1}, or null if age out of bounds.
 */
export function trackAt(ageGyr) {
  if (ageGyr < MESA_TRACK[0][0] || ageGyr > MESA_TRACK[MESA_TRACK.length - 1][0]) {
    return null;
  }

  const ages = MESA_TRACK.map(r => r[0]);
  const masses = MESA_TRACK.map(r => r[1]);
  const logTeffs = MESA_TRACK.map(r => r[2]);
  const logLs = MESA_TRACK.map(r => r[3]);
  const loggs = MESA_TRACK.map(r => r[4]);
  const centerH1s = MESA_TRACK.map(r => r[5]);

  return {
    age: ageGyr,
    mass: interpolate1D(ages, masses, ageGyr),
    logTeff: interpolate1D(ages, logTeffs, ageGyr),
    logL: interpolate1D(ages, logLs, ageGyr),
    logg: interpolate1D(ages, loggs, ageGyr),
    centerH1: interpolate1D(ages, centerH1s, ageGyr),
  };
}

/**
 * Convert log10(Teff) to Teff (K).
 */
export function teffFromLog(logTeff) {
  return Math.pow(10, logTeff);
}

/**
 * Find the core-hydrogen-burning turn-off: the age at which center_h1 first
 * drops below 1e-3, marking the end of the main sequence.
 * Returns age in Gyr, or null if turn-off not found in the track.
 */
export function findMainSequenceTurnOff() {
  for (let i = 0; i < MESA_TRACK.length - 1; i++) {
    const curr = MESA_TRACK[i][5]; // center_h1
    const next = MESA_TRACK[i + 1][5];
    if (curr >= 1e-3 && next < 1e-3) {
      // Linear interpolation to find exact crossing age
      const ageCurr = MESA_TRACK[i][0];
      const ageNext = MESA_TRACK[i + 1][0];
      const frac = (1e-3 - curr) / (next - curr);
      return ageCurr + frac * (ageNext - ageCurr);
    }
  }
  return null;
}

/**
 * Compute evolutionary speed along the track: path length per Gyr.
 * Speed at index i is distance from i-1 to i divided by time step, in Gyr^-1.
 * Kiel distance is sqrt((Δ log_Teff)^2 + (Δ logg)^2).
 * Returns array of {age, speed} pairs, one per track point (first is 0).
 */
export function evolutionarySpeed() {
  const result = [];
  result.push({ age: MESA_TRACK[0][0], speed: 0 });

  for (let i = 1; i < MESA_TRACK.length; i++) {
    const agePrev = MESA_TRACK[i - 1][0];
    const ageCurr = MESA_TRACK[i][0];
    const dt = ageCurr - agePrev;

    const logTeffPrev = MESA_TRACK[i - 1][2];
    const logTeffCurr = MESA_TRACK[i][2];
    const dLogTeff = logTeffCurr - logTeffPrev;

    const loggPrev = MESA_TRACK[i - 1][4];
    const loggCurr = MESA_TRACK[i][4];
    const dLogg = loggCurr - loggPrev;

    const distance = Math.sqrt(dLogTeff * dLogTeff + dLogg * dLogg);
    const speed = dt > 0 ? distance / dt : 0;

    result.push({ age: ageCurr, speed });
  }
  return result;
}

/**
 * Compute local Gaia star density along the track.
 * For each point on the track, count Gaia stars within a tube:
 * Teff within ±200 K, logg within ±0.2 dex.
 * Returns array of {age, density} pairs (normalized to [0,1] by max count).
 */
export function gaiaStarDensityAlongTrack() {
  const result = [];
  let maxCount = 0;

  // First pass: find max count for normalization
  for (let ti = 0; ti < MESA_TRACK.length; ti++) {
    const track = MESA_TRACK[ti];
    const trackAge = track[0];
    const trackLogTeff = track[2];
    const trackLogg = track[4];
    const trackTeff = Math.pow(10, trackLogTeff);

    let count = 0;
    for (let gi = 0; gi < GAIA_CMD.length; gi++) {
      const star = GAIA_CMD[gi];
      const starTeff = star[2]; // direct Teff, not log
      const starLogg = star[3];

      if (Math.abs(starTeff - trackTeff) <= 200 &&
          Math.abs(starLogg - trackLogg) <= 0.2) {
        count++;
      }
    }
    maxCount = Math.max(maxCount, count);
  }

  // Second pass: compute normalized density
  for (let ti = 0; ti < MESA_TRACK.length; ti++) {
    const track = MESA_TRACK[ti];
    const trackAge = track[0];
    const trackLogTeff = track[2];
    const trackLogg = track[4];
    const trackTeff = Math.pow(10, trackLogTeff);

    let count = 0;
    for (let gi = 0; gi < GAIA_CMD.length; gi++) {
      const star = GAIA_CMD[gi];
      const starTeff = star[2];
      const starLogg = star[3];

      if (Math.abs(starTeff - trackTeff) <= 200 &&
          Math.abs(starLogg - trackLogg) <= 0.2) {
        count++;
      }
    }
    result.push({
      age: trackAge,
      density: maxCount > 0 ? count / maxCount : 0,
    });
  }
  return result;
}

/**
 * Compute the fraction of Gaia stars in the rough main-sequence box.
 * Criteria: logg > 3.5 and 5000 K < Teff < 6500 K.
 * Returns fraction in [0, 1].
 */
export function mainSequenceFraction() {
  let count = 0;
  for (let i = 0; i < GAIA_CMD.length; i++) {
    const star = GAIA_CMD[i];
    const teff = star[2];
    const logg = star[3];
    if (logg > 3.5 && teff > 5000 && teff < 6500) {
      count++;
    }
  }
  return count / GAIA_CMD.length;
}

/**
 * Get summary statistics for the MESA track.
 * Returns {ageMin, ageMax, teffMin, teffMax, loggMin, loggMax}.
 */
export function trackExtents() {
  let ageMin = MESA_TRACK[0][0];
  let ageMax = MESA_TRACK[0][0];
  let teffMin = teffFromLog(MESA_TRACK[0][2]);
  let teffMax = teffMin;
  let loggMin = MESA_TRACK[0][4];
  let loggMax = loggMin;

  for (let i = 1; i < MESA_TRACK.length; i++) {
    const age = MESA_TRACK[i][0];
    const teff = teffFromLog(MESA_TRACK[i][2]);
    const logg = MESA_TRACK[i][4];

    ageMin = Math.min(ageMin, age);
    ageMax = Math.max(ageMax, age);
    teffMin = Math.min(teffMin, teff);
    teffMax = Math.max(teffMax, teff);
    loggMin = Math.min(loggMin, logg);
    loggMax = Math.max(loggMax, logg);
  }

  return { ageMin, ageMax, teffMin, teffMax, loggMin, loggMax };
}

/**
 * Get summary statistics for the Gaia stars.
 * Returns {teffMin, teffMax, loggMin, loggMax, bprpMin, bprpMax, mgMin, mgMax, mhMin, mhMax}.
 */
export function gaiaExtents() {
  let teffMin = GAIA_CMD[0][2];
  let teffMax = teffMin;
  let loggMin = GAIA_CMD[0][3];
  let loggMax = loggMin;
  let bprpMin = GAIA_CMD[0][0];
  let bprpMax = bprpMin;
  let mgMin = GAIA_CMD[0][1];
  let mgMax = mgMin;
  let mhMin = GAIA_CMD[0][4];
  let mhMax = mhMin;

  for (let i = 1; i < GAIA_CMD.length; i++) {
    const star = GAIA_CMD[i];
    const teff = star[2];
    const logg = star[3];
    const bprp = star[0];
    const mg = star[1];
    const mh = star[4];

    teffMin = Math.min(teffMin, teff);
    teffMax = Math.max(teffMax, teff);
    loggMin = Math.min(loggMin, logg);
    loggMax = Math.max(loggMax, logg);
    bprpMin = Math.min(bprpMin, bprp);
    bprpMax = Math.max(bprpMax, bprp);
    mgMin = Math.min(mgMin, mg);
    mgMax = Math.max(mgMax, mg);
    mhMin = Math.min(mhMin, mh);
    mhMax = Math.max(mhMax, mh);
  }

  return { teffMin, teffMax, loggMin, loggMax, bprpMin, bprpMax, mgMin, mgMax, mhMin, mhMax };
}
