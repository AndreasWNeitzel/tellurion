// sim.js
// Change of basis in the plane. A vector is one geometric object, but its
// coordinates depend on the basis you measure it in. With a basis {b1, b2} the
// change-of-basis matrix P = [b1 | b2] has columns the new basis vectors written
// in standard coordinates, so a vector v with B-coordinates c satisfies P c = v,
// i.e. v = c1 b1 + c2 b2, and the coordinates are recovered by c = P^{-1} v. The
// standard basis gives c = v; any other basis re-reads the same arrow.
//
// Reference: Strang, Introduction to Linear Algebra, 5th ed., Sec. 7.2 (change of
// basis and the matrix in a new basis); Axler, Linear Algebra Done Right, Ch. 3.

export function det2(b1, b2) { return b1[0] * b2[1] - b2[0] * b1[1]; }

// coordinates of v in the basis {b1, b2}: c = P^{-1} v.
export function coordsInBasis(b1, b2, v) {
  const d = det2(b1, b2);
  return [(b2[1] * v[0] - b2[0] * v[1]) / d, (-b1[1] * v[0] + b1[0] * v[1]) / d];
}

// reconstruct the vector from its B-coordinates: v = c1 b1 + c2 b2.
export function reconstruct(b1, b2, c) { return [c[0] * b1[0] + c[1] * b2[0], c[0] * b1[1] + c[1] * b2[1]]; }

// the change-of-basis matrix P = [b1 | b2] and its inverse, row-major 2x2.
export function matrixP(b1, b2) { return [[b1[0], b2[0]], [b1[1], b2[1]]]; }
export function inverseP(b1, b2) { const d = det2(b1, b2); return [[b2[1] / d, -b2[0] / d], [-b1[1] / d, b1[0] / d]]; }

// the same operator A in the basis B: A_B = P^{-1} A P (similarity transform).
export function similarity(b1, b2, A) {
  const d = det2(b1, b2); const Pi = [[b2[1] / d, -b2[0] / d], [-b1[1] / d, b1[0] / d]]; const P = [[b1[0], b2[0]], [b1[1], b2[1]]];
  const AP = [[A[0][0] * P[0][0] + A[0][1] * P[1][0], A[0][0] * P[0][1] + A[0][1] * P[1][1]], [A[1][0] * P[0][0] + A[1][1] * P[1][0], A[1][0] * P[0][1] + A[1][1] * P[1][1]]];
  return [[Pi[0][0] * AP[0][0] + Pi[0][1] * AP[1][0], Pi[0][0] * AP[0][1] + Pi[0][1] * AP[1][1]], [Pi[1][0] * AP[0][0] + Pi[1][1] * AP[1][0], Pi[1][0] * AP[0][1] + Pi[1][1] * AP[1][1]]];
}
