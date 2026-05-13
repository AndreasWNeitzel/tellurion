// sim.js
// Closed-form SVD of a 2x2 real matrix.
//
//   M = U S V^T
//
// with U, V orthogonal 2x2 and S = diag(s_1, s_2), s_1 >= s_2 >= 0.
//
// Strategy: M^T M is 2x2 symmetric positive semi-definite. Its eigenvalues
// are s_1^2, s_2^2. The eigenvectors form V. Then u_i = M v_i / s_i for
// s_i > 0; for s_i = 0 fall back to the orthogonal complement of u_1.
//
// Reference: Arfken-Weber 7e Ch. 3 (`arfken-weber`).

function eigSym2x2(a, b, d) {
  // Eigenvalues of [[a, b], [b, d]] (symmetric).
  const tr = a + d;
  const det = a * d - b * b;
  const disc = Math.max(0, tr * tr - 4 * det); // PSD by construction; clamp
  const root = Math.sqrt(disc);
  const l1 = (tr + root) / 2;
  const l2 = (tr - root) / 2;
  // Eigenvector for lambda satisfies (a - lambda) x + b y = 0.
  function ev(lam) {
    let x, y;
    if (Math.abs(b) > 1e-15) {
      x = b;
      y = -(a - lam);
    } else if (Math.abs(a - lam) < 1e-12) {
      x = 1; y = 0;
    } else {
      x = 0; y = 1;
    }
    const n = Math.hypot(x, y);
    return { x: x / n, y: y / n };
  }
  return { l1, l2, v1: ev(l1), v2: ev(l2) };
}

export function svd2x2(a, b, c, d) {
  // Form M^T M = [[a^2 + c^2, a b + c d], [a b + c d, b^2 + d^2]].
  const A = a * a + c * c;
  const B = a * b + c * d;
  const D = b * b + d * d;
  const { l1, l2, v1, v2 } = eigSym2x2(A, B, D);
  const s1 = Math.sqrt(Math.max(0, l1));
  const s2 = Math.sqrt(Math.max(0, l2));

  function applyM(v) {
    return { x: a * v.x + b * v.y, y: c * v.x + d * v.y };
  }
  function normalize(v) {
    const n = Math.hypot(v.x, v.y);
    if (n < 1e-15) return { x: 1, y: 0 };
    return { x: v.x / n, y: v.y / n };
  }

  let u1, u2;
  if (s1 > 1e-15) {
    u1 = normalize(applyM(v1));
  } else {
    u1 = { x: 1, y: 0 };
  }
  if (s2 > 1e-15) {
    u2 = normalize(applyM(v2));
  } else {
    // u2 is the orthogonal complement of u1 (in 2D, just rotate 90 deg).
    u2 = { x: -u1.y, y: u1.x };
  }
  // Make sure (u1, u2) forms a right-handed frame; flip u2 if needed to
  // keep the determinant of U equal to +1 (so signs of s_i are
  // unambiguous and U is a rotation, not a reflection).
  const det_U = u1.x * u2.y - u1.y * u2.x;
  if (det_U < 0) u2 = { x: -u2.x, y: -u2.y };

  return {
    s1, s2,
    u1, u2,
    v1, v2,
  };
}

// Apply just the rotation V^T (the right-rotation step).
export function applyVT(v1, v2, p) {
  return {
    x: v1.x * p.x + v1.y * p.y,
    y: v2.x * p.x + v2.y * p.y,
  };
}
// Apply diag(s1, s2).
export function applyS(s1, s2, p) {
  return { x: s1 * p.x, y: s2 * p.y };
}
// Apply U.
export function applyU(u1, u2, p) {
  return {
    x: u1.x * p.x + u2.x * p.y,
    y: u1.y * p.x + u2.y * p.y,
  };
}
