// Jones calculus. A fully polarized field is a Jones vector
// E = (Ex, Ey) of complex amplitudes; an optical element is a 2x2
// complex Jones matrix and a chain of elements is their product.
// Polarizers project (idempotent), wave plates and rotators are
// unitary. From E we recover the Stokes vector (S0..S3, on the
// Poincare sphere) and the polarization ellipse (orientation psi,
// ellipticity chi, handedness). Headless, deterministic. Reference:
// Hecht, Optics (5th ed.), Ch. 8 (`hecht2017`); Born and Wolf,
// Principles of Optics (7th ed.), Sec. 1.4 (`born-wolf`).

// Complex helpers as {re, im}.
const C = (re, im = 0) => ({ re, im });
const cadd = (a, b) => C(a.re + b.re, a.im + b.im);
const cmul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cconj = (a) => C(a.re, -a.im);
const cabs2 = (a) => a.re * a.re + a.im * a.im;
export function expI(phi) { return C(Math.cos(phi), Math.sin(phi)); }

// A Jones vector is [ax, ay] with ax, ay complex.
export function jLinear(theta) { return [C(Math.cos(theta)), C(Math.sin(theta))]; }
export function jCircular(right = true) {
  const s = 1 / Math.SQRT2;
  return [C(s), C(0, right ? -s : s)];   // (1, -i)/sqrt2 = right-handed
}
export function normalize(v) {
  const n = Math.sqrt(cabs2(v[0]) + cabs2(v[1])) || 1;
  return [C(v[0].re / n, v[0].im / n), C(v[1].re / n, v[1].im / n)];
}

// Jones matrices as [[m00,m01],[m10,m11]] of complex entries.
export function matApply(M, v) {
  return [
    cadd(cmul(M[0][0], v[0]), cmul(M[0][1], v[1])),
    cadd(cmul(M[1][0], v[0]), cmul(M[1][1], v[1])),
  ];
}
export function matMul(A, B) {
  const r = [[C(0), C(0)], [C(0), C(0)]];
  for (let i = 0; i < 2; i += 1) for (let j = 0; j < 2; j += 1) {
    r[i][j] = cadd(cmul(A[i][0], B[0][j]), cmul(A[i][1], B[1][j]));
  }
  return r;
}
function rot(a) { const c = Math.cos(a), s = Math.sin(a); return [[C(c), C(-s)], [C(s), C(c)]]; }
function conjugateByRot(M0, theta) { return matMul(rot(theta), matMul(M0, rot(-theta))); }

export function linearPolarizer(theta) {
  return conjugateByRot([[C(1), C(0)], [C(0), C(0)]], theta);
}
// General retarder, retardance delta, fast axis at theta. In the
// fast/slow frame diag(1, e^{-i delta}) (global phase dropped).
export function retarder(delta, theta) {
  return conjugateByRot([[C(1), C(0)], [C(0), expI(-delta)]], theta);
}
export const quarterWave = (theta) => retarder(Math.PI / 2, theta);
export const halfWave = (theta) => retarder(Math.PI, theta);
export function rotatorMatrix(phi) { return rot(phi); }
export const identityM = [[C(1), C(0)], [C(0), C(1)]];

export function intensity(v) { return cabs2(v[0]) + cabs2(v[1]); }

// Stokes parameters from a Jones vector.
export function stokes(v) {
  const [ax, ay] = v;
  const axc_ay = cmul(cconj(ax), ay);                 // ax* ay
  const S0 = cabs2(ax) + cabs2(ay);
  const S1 = cabs2(ax) - cabs2(ay);
  const S2 = 2 * axc_ay.re;
  const S3 = -2 * axc_ay.im;
  return { S0, S1, S2, S3 };
}
export function degreeOfPolarization(v) {
  const { S0, S1, S2, S3 } = stokes(v);
  return S0 === 0 ? 0 : Math.sqrt(S1 * S1 + S2 * S2 + S3 * S3) / S0;
}

// Polarization ellipse: orientation psi in [0,pi), ellipticity chi
// in [-pi/4, pi/4] (sign = handedness; +chi right-handed here).
export function ellipse(v) {
  const { S1, S2, S3, S0 } = stokes(v);
  const psi = 0.5 * Math.atan2(S2, S1);
  const chi = 0.5 * Math.asin(Math.max(-1, Math.min(1, S3 / (S0 || 1))));
  return {
    psi: (psi + Math.PI) % Math.PI,
    chi,
    handed: S3 > 1e-9 ? 'right' : (S3 < -1e-9 ? 'left' : 'linear'),
    axialRatio: Math.abs(Math.tan(chi)),
  };
}

// Apply a chain (array of matrices, first element first) to a vector.
export function applyChain(chain, v) {
  let out = v;
  for (const M of chain) out = matApply(M, out);
  return out;
}
