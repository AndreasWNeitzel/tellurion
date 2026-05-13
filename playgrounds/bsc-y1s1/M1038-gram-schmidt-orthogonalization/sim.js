// sim.js
// Modified Gram-Schmidt orthogonalization in 2D and 3D.
//
// Given a list of vectors v_1, ..., v_k, returns the orthonormal set
// u_1, ..., u_k by iteratively subtracting projections onto earlier u's:
//
//   u_i = v_i - sum_{j < i} <v_i, u_j> u_j
//   u_i = u_i / |u_i|
//
// Modified Gram-Schmidt (use updated u_i instead of v_i at each
// subtraction) is numerically stabler than classical Gram-Schmidt and
// is what every numerical linalg textbook recommends. The two are
// algebraically identical in exact arithmetic.
//
// Reference: Arfken-Weber, Mathematical Methods for Physicists 7e Ch. 3
// (`arfken-weber`).

export function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i += 1) s += a[i] * b[i];
  return s;
}
export function norm(a) { return Math.sqrt(dot(a, a)); }
export function scale(a, s) { return a.map(x => x * s); }
export function sub(a, b) { return a.map((x, i) => x - b[i]); }

export function gramSchmidt(vectors) {
  // Modified Gram-Schmidt: subtract projection onto each previously
  // orthonormalized vector in-place. Returns the orthonormal list u_i.
  const u = vectors.map(v => v.slice());
  for (let i = 0; i < u.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      const proj = dot(u[i], u[j]);
      u[i] = sub(u[i], scale(u[j], proj));
    }
    const n = norm(u[i]);
    if (n < 1e-15) {
      u[i] = u[i].map(() => 0);
    } else {
      u[i] = scale(u[i], 1 / n);
    }
  }
  return u;
}

// Returns the projection of v onto the unit vector u: <v, u> u.
export function project(v, u) {
  return scale(u, dot(v, u));
}

// Returns the residual after one projection step: v - <v, u> u.
export function residual(v, u) {
  return sub(v, project(v, u));
}
