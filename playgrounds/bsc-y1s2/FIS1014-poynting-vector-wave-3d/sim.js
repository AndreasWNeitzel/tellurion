// Plane electromagnetic wave fields and the Poynting vector. Headless,
// closed-form, deterministic. Units c = 1, mu0 = 1, so |E| = |B| for a
// traveling wave and <S> = E0^2 / 2 for linear polarisation.
//   linear:    E = E0 cos(kz - wt) e_pol,  B = (1/c) z_hat x E
//   circular:  E = E0 [cos(kz-wt) x + sin(kz-wt) y]
//   standing:  E = 2 E0 sin(kz) sin(wt) x  (two counter-propagating)
// S = E x B / mu0 points along the propagation direction for a plane
// traveling wave. Reference: Griffiths, Introduction to Electrodynamics
// (4th ed.), Sec. 9.2; Jackson, Classical Electrodynamics, Ch. 7.

export const C = 1;

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);
export { cross, dot, norm };

// Returns { E, B, S } at position z and time t for the chosen mode.
// pol is the linear polarisation angle (rad) about the z axis.
export function fields(z, t, { mode = 'linear', k = 1, E0 = 1, pol = 0 } = {}) {
  const w = C * k;
  let E, B;
  if (mode === 'circular') {
    const ph = k * z - w * t;
    E = [E0 * Math.cos(ph), E0 * Math.sin(ph), 0];
    B = cross([0, 0, 1 / C], E);                       // (1/c) z_hat x E
  } else if (mode === 'standing') {
    const s = 2 * E0 * Math.sin(k * z) * Math.sin(w * t);
    // Superpose +z and -z traveling waves; B follows from Faraday.
    const bAmp = 2 * (E0 / C) * Math.cos(k * z) * Math.cos(w * t);
    E = [s * Math.cos(pol), s * Math.sin(pol), 0];
    B = [-bAmp * Math.sin(pol), bAmp * Math.cos(pol), 0];
  } else {
    // linear (and elliptical via a y-component scale).
    const ph = k * z - w * t;
    const ex = E0 * Math.cos(ph);
    const ey = mode === 'elliptical' ? 0.45 * E0 * Math.sin(ph) : 0;
    E = [ex * Math.cos(pol) - ey * Math.sin(pol), ex * Math.sin(pol) + ey * Math.cos(pol), 0];
    B = cross([0, 0, 1 / C], E);
  }
  const S = cross(E, B);                                // mu0 = 1
  return { E, B, S };
}

// Time-averaged Poynting magnitude for a linear plane wave.
export function avgPoynting(E0) { return E0 * E0 / (2 * C); }
