// Linear transverse beam dynamics in a thin-lens FODO synchrotron
// (Courant and Snyder 1958; Wiedemann, Particle Accelerator Physics).
// One transverse plane, phase-space coordinates (x, x'). Thin
// quadrupoles and drifts give 2x2 symplectic transfer matrices; the
// one-turn matrix yields the Courant-Snyder (Twiss) parameters, the
// betatron tune from cos(mu) = trace(M)/2, the invariant emittance
// ellipse, and the integer / half-integer tune stop bands. Lengths in
// metres, momentum p in GeV/c, dipole field B in tesla.

export const C_RIGID = 0.299792458;                    // B*rho = p / (C_RIGID*q), p in GeV/c

// 2x2 matrices stored as [m11, m12, m21, m22].
export function matmul(A, B) {
  return [
    A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3],
    A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3],
  ];
}
export function matpow(M, n) {
  let R = [1, 0, 0, 1];
  for (let i = 0; i < n; i += 1) R = matmul(R, M);
  return R;
}
export const trace = (M) => M[0] + M[3];
export const det = (M) => M[0] * M[3] - M[1] * M[2];

export const driftM = (L) => [1, L, 0, 1];
// Thin lens of focal length f: focusing (f>0) bends x' toward the axis.
export const thinLens = (f) => [1, 0, -1 / f, 1];
// Horizontal transfer matrix of a sector dipole of length L and bend
// radius rho. It carries the 1/rho weak focusing of the bend; as
// rho -> Infinity (zero field) it reduces exactly to a drift.
export function dipoleM(L, rho) {
  if (!Number.isFinite(rho) || rho === 0) return driftM(L);
  const phi = L / rho;
  return [Math.cos(phi), rho * Math.sin(phi), -Math.sin(phi) / rho, Math.cos(phi)];
}

// Symmetric FODO cell of length L with a defocusing quad of focal
// length f at the centre and two half-strength focusing quads (focal
// 2f) at the ends. The half-cell sections are sector dipoles of bend
// radius rho (the bending magnets); with rho = Infinity they are pure
// drifts. Symmetric, so it is a periodic cell.
export function fodoCell(L, f, rho = Infinity) {
  const hF = thinLens(2 * f);                          // half focusing quad
  const D = thinLens(-f);                              // full defocusing quad
  const d = dipoleM(L / 2, rho);
  return matmul(hF, matmul(d, matmul(D, matmul(d, hF))));
}
export const oneTurn = (L, f, nCell, rho = Infinity) => matpow(fodoCell(L, f, rho), nCell);

export const isStable = (M) => Math.abs(trace(M)) < 2;

// Phase advance of a stable periodic matrix: cos(mu) = trace/2.
export function phaseAdvance(M) {
  const cmu = trace(M) / 2;
  if (Math.abs(cmu) >= 1) return NaN;                  // on or past the stop band
  return Math.acos(cmu);                               // in (0, pi)
}

// Betatron tune of the whole ring (cells x per-cell phase advance).
export function tune(L, f, nCell, rho = Infinity) {
  const mu = phaseAdvance(fodoCell(L, f, rho));
  return Number.isNaN(mu) ? NaN : nCell * mu / (2 * Math.PI);
}

// Courant-Snyder parameters of a periodic matrix M (beam ellipse).
// M = [[cos mu + a sin mu, b sin mu], [-g sin mu, cos mu - a sin mu]].
export function twiss(M) {
  const cmu = trace(M) / 2;
  if (Math.abs(cmu) >= 1) return null;
  const smu = Math.sign(M[1]) * Math.sqrt(1 - cmu * cmu);
  const beta = M[1] / smu;
  const alpha = (M[0] - M[3]) / (2 * smu);
  const gamma = -M[2] / smu;
  return { beta, alpha, gamma, mu: Math.acos(cmu) };
}

// Courant-Snyder invariant (the single-particle emittance): the area
// of the phase-space ellipse it lies on, conserved by any symplectic
// (det = 1) transport.
export const csInvariant = (x, xp, tw) =>
  tw.gamma * x * x + 2 * tw.alpha * x * xp + tw.beta * xp * xp;

// Track one particle over N turns of the one-turn map; return the
// trajectory and the per-turn emittance (constant for a symplectic map).
export function trackTurns(L, f, nCell, x0, xp0, N) {
  const M = oneTurn(L, f, nCell);
  const tw = twiss(M);
  const xs = new Float64Array(N + 1), xps = new Float64Array(N + 1);
  const eps = new Float64Array(N + 1);
  let x = x0, xp = xp0;
  for (let i = 0; i <= N; i += 1) {
    xs[i] = x; xps[i] = xp;
    eps[i] = tw ? csInvariant(x, xp, tw) : NaN;
    const nx = M[0] * x + M[1] * xp;
    const nxp = M[2] * x + M[3] * xp;
    x = nx; xp = nxp;
  }
  return { xs, xps, eps, tw };
}

// The invariant ellipse gamma x^2 + 2 alpha x x' + beta x'^2 = eps.
export function ellipsePoints(tw, eps, npts = 200) {
  const xs = new Float64Array(npts + 1), xps = new Float64Array(npts + 1);
  const s = Math.sqrt(eps);
  for (let i = 0; i <= npts; i += 1) {
    const ph = 2 * Math.PI * i / npts;
    xs[i] = s * Math.sqrt(tw.beta) * Math.cos(ph);
    xps[i] = -s / Math.sqrt(tw.beta) * (Math.sin(ph) + tw.alpha * Math.cos(ph));
  }
  return { xs, xps };
}

// Scan quad focal length: trace/2, tune, stability and the maximum
// beta (which diverges as 1/sin(mu) at the stop-band edges).
export function tuneScan(L, nCell, fMin, fMax, steps) {
  const f = new Float64Array(steps + 1), half = new Float64Array(steps + 1);
  const Q = new Float64Array(steps + 1), bmax = new Float64Array(steps + 1);
  const stab = new Uint8Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const ff = fMin + (fMax - fMin) * i / steps;
    const M = fodoCell(L, ff);
    f[i] = ff; half[i] = trace(M) / 2;
    const st = isStable(M); stab[i] = st ? 1 : 0;
    Q[i] = st ? tune(L, ff, nCell) : NaN;
    const tw = st ? twiss(M) : null;
    bmax[i] = tw ? tw.beta : NaN;
  }
  return { f, half, Q, bmax, stab };
}

// Driven-resonance amplification: a gradient or steering error excites
// the beam with a response proportional to 1/|sin(2 pi Q)|, which
// diverges when the tune Q hits an integer or half-integer.
export function resonanceAmp(Q) {
  if (!Number.isFinite(Q)) return Infinity;
  const s = Math.abs(Math.sin(2 * Math.PI * Q));
  return s < 1e-12 ? Infinity : 1 / s;
}
export function nearestResonance(Q) {
  const h = Math.round(2 * Q) / 2;                     // nearest n/2
  return { value: h, distance: Math.abs(Q - h) };
}

// Dipole: magnetic rigidity and the Lorentz relation.
// B*rho = p / (C_RIGID*q)  (T*m, p in GeV/c, q in units of e).
export const rigidity = (p, q = 1) => p / (C_RIGID * q);
export const bendRadius = (p, B, q = 1) => p / (C_RIGID * q * B);
// Bend angle of a dipole of arc length Ld for the given rigidity.
export const bendAngle = (Ld, p, B, q = 1) => Ld / bendRadius(p, B, q);

// Circular-motion identity from d p / d t = q v x B: with rho = p/(qB)
// the centripetal momentum rate q v B equals p v / rho exactly.
export function lorentzIdentity(p, B, q, v) {
  const rho = bendRadius(p, B, q);                     // metres (p in GeV/c)
  const qvB = q * v * B;                               // proportional to the Lorentz force
  const pOverRho = (p / C_RIGID) * v / rho;            // p-scaled v / rho
  return { rho, qvB, pOverRho, ratio: qvB / pOverRho };
}
