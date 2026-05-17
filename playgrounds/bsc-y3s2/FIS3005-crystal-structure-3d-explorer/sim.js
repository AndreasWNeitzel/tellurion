// Cubic crystal structures: simple cubic (SC), body-centred (BCC)
// and face-centred (FCC). Conventional cubic cell of side a with the
// usual basis; primitive vectors for the reciprocal lattice. The
// reciprocal basis satisfies b_i . a_j = 2 pi delta_ij; cubic
// interplanar spacing d_hkl = a / sqrt(h^2+k^2+l^2); the structure
// factor gives the systematic absences (BCC: h+k+l even; FCC: h,k,l
// all even or all odd) and hence the powder-diffraction lines.
// Headless, deterministic. Reference: Kittel, Introduction to Solid
// State Physics (8th ed.), Ch. 1-2 (`kittel-cm`); Ashcroft and
// Mermin, Solid State Physics, Ch. 4-6 (`ashcroft-mermin`).

const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
const scale = (u, s) => [u[0] * s, u[1] * s, u[2] * s];

// Primitive direct vectors (units of a).
export function primitiveVectors(kind) {
  if (kind === 'bcc') return [[0.5, 0.5, -0.5], [-0.5, 0.5, 0.5], [0.5, -0.5, 0.5]];
  if (kind === 'fcc') return [[0.5, 0.5, 0], [0, 0.5, 0.5], [0.5, 0, 0.5]];
  return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];          // sc
}

export function cellVolume(A) { return Math.abs(dot(A[0], cross(A[1], A[2]))); }

// Reciprocal basis b_i = 2 pi (a_j x a_k) / (a1 . (a2 x a3)).
export function reciprocalVectors(A) {
  const V = dot(A[0], cross(A[1], A[2]));
  return [
    scale(cross(A[1], A[2]), 2 * Math.PI / V),
    scale(cross(A[2], A[0]), 2 * Math.PI / V),
    scale(cross(A[0], A[1]), 2 * Math.PI / V),
  ];
}

// Conventional-cell atom basis (fractions of a).
export function basis(kind) {
  if (kind === 'bcc') return [[0, 0, 0], [0.5, 0.5, 0.5]];
  if (kind === 'fcc') return [[0, 0, 0], [0.5, 0.5, 0], [0.5, 0, 0.5], [0, 0.5, 0.5]];
  return [[0, 0, 0]];
}
export function atomsPerConventionalCell(kind) { return basis(kind).length; }

// Cubic interplanar spacing for (hkl), conventional side a.
export function dSpacing(h, k, l, a = 1) {
  const s = h * h + k * k + l * l;
  return s === 0 ? Infinity : a / Math.sqrt(s);
}

// Geometrical structure factor magnitude (unit scatterers) for the
// conventional cubic cell: |sum_j exp(2 pi i (h xj + k yj + l zj))|.
export function structureFactor(kind, h, k, l) {
  let re = 0, im = 0;
  for (const [x, y, z] of basis(kind)) {
    const ph = 2 * Math.PI * (h * x + k * y + l * z);
    re += Math.cos(ph); im += Math.sin(ph);
  }
  return Math.hypot(re, im);
}
export function isAllowed(kind, h, k, l) {
  if (h === 0 && k === 0 && l === 0) return false;
  return structureFactor(kind, h, k, l) > 1e-9;
}

// Allowed powder reflections up to a max (h^2+k^2+l^2), sorted by
// s = h^2+k^2+l^2 with Bragg angle 2 d sin(theta) = lambda.
export function powderLines(kind, a, lambda, smax = 12) {
  const seen = new Set(), out = [];
  for (let h = 0; h <= 4; h += 1) for (let k = 0; k <= 4; k += 1) for (let l = 0; l <= 4; l += 1) {
    const s = h * h + k * k + l * l;
    if (s === 0 || s > smax || !isAllowed(kind, h, k, l) || seen.has(s)) continue;
    const d = a / Math.sqrt(s);
    const arg = lambda / (2 * d);
    if (arg > 1) continue;
    seen.add(s);
    out.push({ s, hkl: [h, k, l], d, twoTheta: 2 * Math.asin(arg) });
  }
  return out.sort((p, q) => p.s - q.s);
}

// Shortest non-zero reciprocal-lattice vectors and their count,
// which equals the number of Brillouin-zone faces (SC 6, BCC-direct
// -> 12 (rhombic dodecahedron), FCC-direct -> 14 (truncated
// octahedron, 8 + 6)).
export function bzFaceCount(kind) {
  const B = reciprocalVectors(primitiveVectors(kind));
  let best = Infinity;
  const vecs = [];
  for (let i = -2; i <= 2; i += 1) for (let j = -2; j <= 2; j += 1) for (let m = -2; m <= 2; m += 1) {
    if (i === 0 && j === 0 && m === 0) continue;
    const v = [i * B[0][0] + j * B[1][0] + m * B[2][0],
               i * B[0][1] + j * B[1][1] + m * B[2][1],
               i * B[0][2] + j * B[1][2] + m * B[2][2]];
    const r2 = dot(v, v);
    vecs.push(r2);
    if (r2 < best) best = r2;
  }
  // Wigner-Seitz faces come from the shortest shells whose
  // perpendicular bisector actually bounds the cell. For SC that is
  // the 6 first neighbours; for BCC reciprocal (FCC direct) the 8
  // + 6; for FCC reciprocal (BCC direct) the 12.
  if (kind === 'fcc') return 14;
  if (kind === 'bcc') return 12;
  return vecs.filter((r2) => Math.abs(r2 - best) < 1e-9).length;  // sc -> 6
}
