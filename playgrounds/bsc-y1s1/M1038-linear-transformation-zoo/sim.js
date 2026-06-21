// sim.js
// A 2x2 linear map M = [[a, b], [c, d]] acting on the plane. The columns are the
// images of the basis vectors, (a, c) and (b, d). The map sends the unit square to
// a parallelogram of signed area det(M) and the unit circle to an ellipse whose
// semi-axes are the singular values; real eigenvectors are the directions the map
// only stretches, M v = lambda v.
//
// Reference: Strang, Introduction to Linear Algebra, 5th ed., Ch. 6 (eigenvalues)
// and Sec. 7.1 (the SVD and the image of the unit circle); Lay, Linear Algebra and
// Its Applications, Ch. 5.

export function apply(M, x, y) { return [M.a * x + M.b * y, M.c * x + M.d * y]; }
export function determinant(M) { return M.a * M.d - M.b * M.c; }
export function trace(M) { return M.a + M.d; }

// real eigenvalues/eigenvectors of the 2x2 map (complex flagged when the
// discriminant is negative, e.g. a pure rotation).
export function eigen(M) {
  const tr = trace(M), det = determinant(M), disc = tr * tr - 4 * det;
  if (disc < 0) return { real: false, values: [], vectors: [] };
  const s = Math.sqrt(disc), l1 = (tr + s) / 2, l2 = (tr - s) / 2;
  const vec = (l) => {
    let vx, vy;
    if (Math.abs(M.b) > 1e-9 || Math.abs(M.c) > 1e-9) {
      if (Math.abs(M.b) >= Math.abs(M.c)) { vx = M.b; vy = l - M.a; } else { vx = l - M.d; vy = M.c; }
    } else { vx = Math.abs(l - M.a) < 1e-9 ? 1 : 0; vy = vx === 1 ? 0 : 1; }
    const n = Math.hypot(vx, vy) || 1; return [vx / n, vy / n];
  };
  return { real: true, values: [l1, l2], vectors: [vec(l1), vec(l2)] };
}

// singular values: square roots of the eigenvalues of M^T M (descending).
export function singularValues(M) {
  const p = M.a * M.a + M.c * M.c, q = M.b * M.b + M.d * M.d, r = M.a * M.b + M.c * M.d;
  const tr = p + q, det = p * q - r * r, s = Math.sqrt(Math.max(0, tr * tr - 4 * det));
  return [Math.sqrt(Math.max(0, (tr + s) / 2)), Math.sqrt(Math.max(0, (tr - s) / 2))];
}

// length of the image of the unit vector at angle theta (the stretch in that
// direction); its max and min over theta are the singular values.
export function stretch(M, theta) { const [u, v] = apply(M, Math.cos(theta), Math.sin(theta)); return Math.hypot(u, v); }

export const PRESETS = {
  identity: { label: 'identity', M: { a: 1, b: 0, c: 0, d: 1 } },
  rotation: { label: 'rotation 40 deg', M: { a: 0.766, b: -0.643, c: 0.643, d: 0.766 } },
  scale: { label: 'scaling', M: { a: 1.7, b: 0, c: 0, d: 0.6 } },
  shear: { label: 'shear', M: { a: 1, b: 0.85, c: 0, d: 1 } },
  reflection: { label: 'reflection', M: { a: 1, b: 0, c: 0, d: -1 } },
  rotscale: { label: 'rotation + scale', M: { a: 0.95, b: -0.95, c: 0.95, d: 0.95 } },
  projection: { label: 'projection (det 0)', M: { a: 1, b: 0.6, c: 0, d: 0 } },
};
