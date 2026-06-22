// sim.js
// The Maxwell-Boltzmann speed distribution of an ideal gas. Each velocity
// component is Gaussian with variance a^2 = kT/m, so the speed v = |velocity| has
// the distribution
//   f(v) = sqrt(2/pi) v^2 / a^3 exp(-v^2 / 2a^2),   a = sqrt(kT/m),
// a lopsided bell that rises from zero, peaks at the most probable speed, and
// trails off. Three speeds summarise it, in fixed ratio and always ordered
//   v_p = sqrt(2) a < v_avg = sqrt(8/pi) a < v_rms = sqrt(3) a.
// Raising T (or lowering m) widens and shifts the distribution to higher speeds,
// while its area stays one.
//
// Units k_B = 1; T and m are reduced, so a = sqrt(T/m).
//
// Reference: Reif, Fundamentals of Statistical and Thermal Physics, Sec. 7.9-7.10;
// Blundell and Blundell, Concepts in Thermal Physics, 2nd ed., Ch. 5.

export function speedScale(T, m) { return Math.sqrt(T / m); }
export function mbPdf(v, T, m) { const a = speedScale(T, m); if (v < 0) return 0; return Math.sqrt(2 / Math.PI) * v * v / (a * a * a) * Math.exp(-v * v / (2 * a * a)); }
export function vMostProbable(T, m) { return Math.SQRT2 * speedScale(T, m); }
export function vMean(T, m) { return Math.sqrt(8 / Math.PI) * speedScale(T, m); }
export function vRms(T, m) { return Math.sqrt(3) * speedScale(T, m); }

// sample a speed: magnitude of a 3D velocity with N(0, a^2) components.
function gauss(rng) { let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
export function sampleSpeed(T, m, rng) { const a = speedScale(T, m); const g1 = gauss(rng), g2 = gauss(rng), g3 = gauss(rng); return a * Math.sqrt(g1 * g1 + g2 * g2 + g3 * g3); }

// numeric normalization and moments, for the invariant checks.
export function integrate(T, m, fn, vmax = null, N = 6000) { const vm = vmax || (12 * speedScale(T, m)); let s = 0; const dv = vm / N; for (let i = 0; i < N; i += 1) { const v = (i + 0.5) * dv; s += fn(v) * mbPdf(v, T, m) * dv; } return s; }

export function makeRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
