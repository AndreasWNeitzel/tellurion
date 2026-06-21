// p- and g-mode cavities of a real n=3 polytrope.
//
// A non-radial oscillation of frequency omega propagates only where the local
// radial wavenumber is real. In the Cowling approximation
//   k_r^2 = (omega^2 - S_l^2)(omega^2 - N^2) / (omega^2 c^2),
// so the mode oscillates where omega lies ABOVE both characteristic
// frequencies (the acoustic p-mode cavity, k_r^2 > 0 with omega > S_l, N) or
// BELOW both (the buoyancy g-mode cavity, omega < S_l, N), and is evanescent in
// between (N < omega < S_l). A mode with one of each, coupled through the
// evanescent gap, is a mixed mode.
//
// The structure is the genuine n_poly = 3 Lane-Emden polytrope (shared engine):
// for a polytrope c^2 = Gamma1 P/rho ~ theta, the Lamb frequency
//   S_l^2 = l(l+1) c^2 / r^2,
// and the Brunt-Vaisala frequency
//   N^2 = g (1/Gamma1 dlnP/dr - dlnrho/dr)
//       = (n_poly+1) xi_1^2 / Gamma1 * |(n_poly+1)/Gamma1 - n_poly| * theta'^2/theta
// in units c_0 = R = 1, with omega in units of c_0/R. N is capped near the
// surface, where the zero-density polytrope boundary makes it diverge (a real
// star reflects acoustic modes at its atmosphere, not at this singularity).
//
// Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology (2010),
// Ch. 3 (the propagation diagram, eq. 3.150; mixed modes, sec. 3.4); Unno et
// al., Nonradial Oscillations of Stars (1989).

import { laneEmden, thetaAt, dthetaAt } from '../../../shared/js/engine/polytrope.js';

export const N_POLY = 3;
export const GAMMA1 = 5 / 3;

const MODEL = laneEmden(N_POLY);
const XI1 = MODEL.xi1;
const COEF = Math.abs((N_POLY + 1) / GAMMA1 - N_POLY);          // 0.6 for n=3, Gamma1=5/3
const KN = (N_POLY + 1) * XI1 * XI1 / GAMMA1 * COEF;            // Brunt prefactor
export const N_SURFACE_CAP = 8;                                // photospheric cap

// Fractional-radius structure functions (x = r/R in (0, 1)).
export function soundSpeed(x) { return Math.sqrt(Math.max(thetaAt(MODEL, x * XI1), 0)); }

export function bruntN(x) {
  if (x <= 0 || x >= 1) return 0;
  const xi = x * XI1;
  const T = Math.max(thetaAt(MODEL, xi), 1e-9);
  const Tp = dthetaAt(MODEL, xi);
  return Math.min(Math.sqrt(KN * Tp * Tp / T), N_SURFACE_CAP);
}

export function lambS(x, l) {
  if (l <= 0 || x <= 0) return 0;
  return Math.sqrt(l * (l + 1)) * soundSpeed(x) / x;
}

// Cowling local radial wavenumber squared.
export function krSquared(x, omega, l) {
  const c = soundSpeed(x);
  if (c <= 1e-6) return -1;
  const S = lambS(x, l), N = bruntN(x), w2 = omega * omega;
  return (w2 - S * S) * (w2 - N * N) / (w2 * c * c);
}

// Propagating cavities: [x_start, x_end] segments where the mode oscillates.
// p-cavity: omega above both S_l and N. g-cavity: omega below both.
const X_SURF = 0.992;                 // reflecting boundary; the polytrope edge is singular
const MIN_CAVITY = 0.012;             // drop degenerate slivers from the discrete scan
export function cavities(omega, l, samples = 600) {
  const pCavities = [], gCavities = [];
  let inP = false, sP = 0, inG = false, sG = 0;
  for (let i = 1; i <= samples; i += 1) {
    const x = i / samples * X_SURF;
    const N = bruntN(x), S = lambS(x, l);
    const isP = omega > Math.max(N, S);
    const isG = omega < Math.min(N, S);
    if (isP && !inP) { sP = x; inP = true; }
    if (!isP && inP) { pCavities.push([sP, x]); inP = false; }
    if (isG && !inG) { sG = x; inG = true; }
    if (!isG && inG) { gCavities.push([sG, x]); inG = false; }
  }
  if (inP) pCavities.push([sP, X_SURF]);
  if (inG) gCavities.push([sG, X_SURF]);
  const wide = (segs) => segs.filter(([a, b]) => b - a >= MIN_CAVITY);
  return { pCavities: wide(pCavities), gCavities: wide(gCavities) };
}

export function modeType(omega, l) {
  const { pCavities, gCavities } = cavities(omega, l);
  if (pCavities.length && gCavities.length) return 'mixed';
  if (pCavities.length) return 'p';
  if (gCavities.length) return 'g';
  return 'evanescent';
}

// Turning points: radii where omega crosses N or S_l (the cavity edges).
export function turningPoints(omega, l, samples = 600) {
  const out = [];
  let prevN = bruntN(1 / samples) - omega, prevS = lambS(1 / samples, l) - omega;
  for (let i = 2; i <= samples; i += 1) {
    const x = i / samples * X_SURF;
    const dN = bruntN(x) - omega, dS = lambS(x, l) - omega;
    if (prevN * dN < 0) out.push(x);
    if (prevS * dS < 0) out.push(x);
    prevN = dN; prevS = dS;
  }
  return out;
}

// Radial displacement eigenfunction xi_r(x) built from the real Cowling
// wavenumber: oscillatory (JWKB phase) inside cavities, exponentially
// evanescent in the gap. k_r diverges at the centre for g-modes, so it is
// capped for the finite-resolution display (the core is genuinely node-rich).
const KR_CAP = 70;        // phase wavenumber cap (the g-mode core is node-rich)
const DECAY_CAP = 11;     // evanescent-gap decay cap; keeps a coupled mixed mode visible in both cavities
export function eigenfunction(omega, l, n = 400) {
  const x = new Float64Array(n + 1);
  const xi = new Float64Array(n + 1);
  let phase = 0, A = 0;
  const dx = 1 / n;
  for (let i = 0; i <= n; i += 1) {
    const xx = i / n;
    x[i] = xx;
    if (xx < 0.01) { xi[i] = 0; continue; }
    const k2 = krSquared(xx, omega, l);
    if (k2 > 0) {
      const kr = Math.min(Math.sqrt(k2), KR_CAP);
      phase += kr * dx;
      A = Math.min(1, A + 2.6 * dx);            // couple into the cavity
      xi[i] = A * Math.sin(phase);
    } else {
      const decay = Math.min(DECAY_CAP, Math.sqrt(-k2));
      A *= Math.exp(-decay * dx);               // evanescent decay
      xi[i] = A * Math.sin(phase);
    }
  }
  let peak = 1e-9;
  for (let i = 0; i <= n; i += 1) peak = Math.max(peak, Math.abs(xi[i]));
  for (let i = 0; i <= n; i += 1) xi[i] /= peak;
  return { x, xi };
}

// Mode energy fraction in the g- and p-cavities (integral of xi^2 over each).
export function energySplit(omega, l) {
  const { x, xi } = eigenfunction(omega, l);
  const { pCavities, gCavities } = cavities(omega, l);
  const inSeg = (r, segs) => segs.some(([a, b]) => r >= a && r <= b);
  let eg = 0, ep = 0, et = 1e-12;
  for (let i = 0; i < x.length; i += 1) {
    const e = xi[i] * xi[i];
    et += e;
    if (inSeg(x[i], gCavities)) eg += e;
    if (inSeg(x[i], pCavities)) ep += e;
  }
  return { g: eg / et, p: ep / et };
}
