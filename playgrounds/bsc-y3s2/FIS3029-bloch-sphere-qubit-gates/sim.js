// sim.js
// Single-qubit dynamics on the Bloch sphere. State |psi> = cos(theta/2) |0>
// + e^{i phi} sin(theta/2) |1> parameterized by (theta, phi); Bloch vector
// r = (sin(theta) cos(phi), sin(theta) sin(phi), cos(theta)) on the unit
// 2-sphere. Gates are 2x2 unitaries; we apply them by updating (theta, phi)
// through complex multiplication.

// Complex helpers (real, imag pairs).
function cmul(ar, ai, br, bi) { return [ar*br - ai*bi, ar*bi + ai*br]; }
function cnorm(r, i)         { return Math.hypot(r, i); }

// (alpha, beta) on the projective sphere: |psi> = alpha|0> + beta|1>.
export function blochToAmps(theta, phi) {
  const a = [Math.cos(theta / 2), 0];
  const b = [Math.cos(phi) * Math.sin(theta / 2), Math.sin(phi) * Math.sin(theta / 2)];
  return { a, b };
}

export function ampsToBloch(a, b) {
  // Renormalize first.
  const norm = Math.hypot(a[0], a[1], b[0], b[1]);
  if (norm === 0) return { theta: 0, phi: 0 };
  const an = [a[0] / norm, a[1] / norm];
  const bn = [b[0] / norm, b[1] / norm];
  // Bloch vector: r_x = 2 Re(a* b), r_y = 2 Im(a* b), r_z = |a|^2 - |b|^2.
  // a* = (an[0], -an[1])
  const rxRe = an[0] * bn[0] + an[1] * bn[1];
  const ryIm = an[0] * bn[1] - an[1] * bn[0];
  const rx = 2 * rxRe;
  const ry = 2 * ryIm;
  const rz = an[0] * an[0] + an[1] * an[1] - bn[0] * bn[0] - bn[1] * bn[1];
  const theta = Math.acos(Math.max(-1, Math.min(1, rz)));
  const phi   = Math.atan2(ry, rx);
  return { theta, phi };
}

// Apply a 2x2 unitary U to (a, b). U entries are complex.
export function applyGate(U, a, b) {
  const aNew = [
    U[0][0][0] * a[0] - U[0][0][1] * a[1] + U[0][1][0] * b[0] - U[0][1][1] * b[1],
    U[0][0][0] * a[1] + U[0][0][1] * a[0] + U[0][1][0] * b[1] + U[0][1][1] * b[0],
  ];
  const bNew = [
    U[1][0][0] * a[0] - U[1][0][1] * a[1] + U[1][1][0] * b[0] - U[1][1][1] * b[1],
    U[1][0][0] * a[1] + U[1][0][1] * a[0] + U[1][1][0] * b[1] + U[1][1][1] * b[0],
  ];
  return { a: aNew, b: bNew };
}

// Standard single-qubit gates as 2x2 complex matrices (entries [re, im]).
const r2 = 1 / Math.SQRT2;
export const GATES = {
  I: [[[1, 0], [0, 0]], [[0, 0], [1, 0]]],
  X: [[[0, 0], [1, 0]], [[1, 0], [0, 0]]],
  Y: [[[0, 0], [0, -1]], [[0, 1], [0, 0]]],
  Z: [[[1, 0], [0, 0]], [[0, 0], [-1, 0]]],
  H: [[[r2, 0], [r2, 0]], [[r2, 0], [-r2, 0]]],
  S: [[[1, 0], [0, 0]], [[0, 0], [0, 1]]],
  T: [[[1, 0], [0, 0]], [[0, 0], [r2, r2]]],
};

// Continuous rotation gates: R_n(angle) = cos(a/2) I - i sin(a/2) (n . sigma).
export function Rx(angle) {
  const c = Math.cos(angle / 2), s = Math.sin(angle / 2);
  return [[[c, 0], [0, -s]], [[0, -s], [c, 0]]];
}
export function Ry(angle) {
  const c = Math.cos(angle / 2), s = Math.sin(angle / 2);
  return [[[c, 0], [-s, 0]], [[s, 0], [c, 0]]];
}
export function Rz(angle) {
  const c = Math.cos(angle / 2), s = Math.sin(angle / 2);
  return [[[c, -s], [0, 0]], [[0, 0], [c, s]]];
}

// Test for unitarity: ||U^dagger U - I||_F < tol.
export function unitarityNorm(U) {
  // (U^dagger U)_{ij} = sum_k conj(U[k][i]) * U[k][j]
  let s = 0;
  for (let i = 0; i < 2; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      let re = 0, im = 0;
      for (let k = 0; k < 2; k += 1) {
        // conj(U[k][i]) = (U[k][i][0], -U[k][i][1])
        const [r, di] = cmul(U[k][i][0], -U[k][i][1], U[k][j][0], U[k][j][1]);
        re += r; im += di;
      }
      const target = (i === j) ? 1 : 0;
      s += (re - target) * (re - target) + im * im;
    }
  }
  return Math.sqrt(s);
}
