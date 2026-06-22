// sim.js
// The Stern-Gerlach experiment. A beam of atoms with magnetic moment mu passes
// through an inhomogeneous field; the force F_z = mu_z dB/dz deflects each atom by
// an amount set by mu_z. Classically mu_z = mu cos(theta) varies continuously, so
// the beam should smear into a band. Quantum mechanically mu_z is quantised,
// mu_z proportional to m_s with m_s in {-s, ..., s}, so the beam splits into
// exactly 2s + 1 discrete spots: the number of spots measures the spin.
//
// Reference: Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 4.4.1;
// Gerlach and Stern 1922, Z. Phys. 9, 349.

// the discrete landing positions, outermost spots at +/- d (m_s = +/- s).
export function spots(s, d) {
  const out = []; for (let ms = -s; ms <= s + 1e-9; ms += 1) out.push({ ms, y: (ms / s) * d });
  return out;
}
export function spotCount(s) { return Math.round(2 * s + 1); }

// classical half-width of the smear: mu_z ranges over +/- mu = +/- g mu_B
// sqrt(s(s+1)), so the band reaches d sqrt(s(s+1))/s, wider than the spots.
export function classicalHalfWidth(s, d) { return d * Math.sqrt(s * (s + 1)) / s; }

// a seeded RNG (mulberry32) for reproducible accumulation.
export function makeRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(rng) { let u = 0, v = 0; while (u === 0) u = rng(); while (v === 0) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

// sample a quantum landing: a random m_s (uniform over the 2s+1 states) plus beam
// spread.
export function sampleQuantum(s, d, spread, rng) {
  const n = spotCount(s); const idx = Math.floor(rng() * n); const ms = -s + idx;
  return { ms, y: (ms / s) * d + spread * gauss(rng) };
}
// sample a classical landing: mu_z = mu cos(theta), cos(theta) uniform on [-1, 1].
export function sampleClassical(s, d, spread, rng) {
  const c = 2 * rng() - 1; return classicalHalfWidth(s, d) * c + spread * gauss(rng);
}
