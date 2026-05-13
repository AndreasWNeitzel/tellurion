// sim.js
// Gravitational redshift in the Schwarzschild geometry.
//
// A photon emitted at radius r_em with frequency f_em is observed at
// radius r_obs with frequency
//   f_obs / f_em = sqrt((1 - 2 M / r_em) / (1 - 2 M / r_obs))
//
// In units G = c = 1, M is the mass in geometric units. r_obs > r_em
// gives redshift (f_obs < f_em). At r_em = 2M (the horizon) the photon
// frequency observed at infinity vanishes; this is the source of the
// infinite redshift at the event horizon.
//
// Reference: Hartle, Gravity: An Introduction to Einstein's General
// Relativity Ch. 9 (`schutz-firstcourse`); Carroll Ch. 5.

export const M = 1.0;        // Schwarzschild mass (geometric units)
export const HORIZON = 2 * M;

export function redshiftFactor(r_em, r_obs = Infinity) {
  if (r_em <= HORIZON) return 0;       // photon trapped at horizon
  const top = 1 - 2 * M / r_em;
  const bot = r_obs === Infinity ? 1 : 1 - 2 * M / r_obs;
  if (bot <= 0) return 0;
  return Math.sqrt(top / bot);
}

// Proper time rate for a stationary clock at radius r vs coordinate time
// (equivalent to clock vs observer at infinity).
export function clockRate(r) {
  if (r <= HORIZON) return 0;
  return Math.sqrt(1 - 2 * M / r);
}

// Wavelength shift z = lambda_obs / lambda_em - 1 = f_em / f_obs - 1.
export function redshift_z(r_em, r_obs = Infinity) {
  const f_ratio = redshiftFactor(r_em, r_obs);
  if (f_ratio <= 0) return Infinity;
  return 1 / f_ratio - 1;
}

// Convert wavelength (nm) to RGB for visualization.
export function wavelengthToRGB(lambda) {
  let R = 0, G = 0, B = 0;
  const lam = Math.max(380, Math.min(780, lambda));
  if (lam < 440) { R = -(lam - 440) / 60; B = 1; }
  else if (lam < 490) { G = (lam - 440) / 50; B = 1; }
  else if (lam < 510) { G = 1; B = -(lam - 510) / 20; }
  else if (lam < 580) { R = (lam - 510) / 70; G = 1; }
  else if (lam < 645) { R = 1; G = -(lam - 645) / 65; }
  else                { R = 1; }
  let factor = 1;
  if (lam < 420) factor = 0.3 + 0.7 * (lam - 380) / 40;
  if (lam > 700) factor = 0.3 + 0.7 * (780 - lam) / 80;
  return [Math.max(0, R * factor * 255) | 0, Math.max(0, G * factor * 255) | 0, Math.max(0, B * factor * 255) | 0];
}
