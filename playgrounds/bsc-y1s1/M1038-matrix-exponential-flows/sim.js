// sim.js
// The matrix exponential as a flow. The linear system x' = A x has solution
// x(t) = exp(A t) x0, and the shape of the flow in the plane is decided entirely
// by the eigenvalues of A: real same-sign gives a node, real opposite-sign a
// saddle, complex with nonzero real part a spiral, and pure-imaginary a centre.
// For a 2x2 matrix exp(A t) has a closed form in the eigenvalues.
//
// Reference: Strang, Introduction to Linear Algebra, 5th ed., Sec. 6.3 (systems of
// differential equations); Hirsch, Smale, Devaney, Differential Equations,
// Dynamical Systems, and an Introduction to Chaos, Ch. 3-4.

export function trace(A) { return A[0][0] + A[1][1]; }
export function det(A) { return A[0][0] * A[1][1] - A[0][1] * A[1][0]; }

export function eigen(A) {
  const tau = trace(A), dt = det(A), disc = tau * tau - 4 * dt;
  if (disc >= 0) { const s = Math.sqrt(disc); return { real: true, l1: (tau + s) / 2, l2: (tau - s) / 2, alpha: tau / 2, beta: 0 }; }
  return { real: false, l1: tau / 2, l2: tau / 2, alpha: tau / 2, beta: Math.sqrt(-disc) / 2 };
}

// closed-form 2x2 matrix exponential exp(A t).
export function expAt(A, t) {
  const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
  const tau = a + d, dt = a * d - b * c, disc = tau * tau - 4 * dt;
  if (Math.abs(disc) < 1e-9) { const l = tau / 2, e = Math.exp(l * t); return [[e * (1 + (a - l) * t), e * b * t], [e * c * t, e * (1 + (d - l) * t)]]; }
  if (disc > 0) { const s = Math.sqrt(disc), l1 = (tau + s) / 2, l2 = (tau - s) / 2, e1 = Math.exp(l1 * t), e2 = Math.exp(l2 * t), f = 1 / (l1 - l2);
    return [[f * (e1 * (a - l2) - e2 * (a - l1)), f * b * (e1 - e2)], [f * c * (e1 - e2), f * (e1 * (d - l2) - e2 * (d - l1))]]; }
  const al = tau / 2, be = Math.sqrt(-disc) / 2, e = Math.exp(al * t), co = Math.cos(be * t), si = Math.sin(be * t) / be;
  return [[e * (co + si * (a - al)), e * si * b], [e * si * c, e * (co + si * (d - al))]];
}
export function flow(A, x0, t) { const M = expAt(A, t); return [M[0][0] * x0[0] + M[0][1] * x0[1], M[1][0] * x0[0] + M[1][1] * x0[1]]; }
export function apply(A, x) { return [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]]; }

export function classify(A) {
  const e = eigen(A), dt = det(A);
  if (!e.real) { if (Math.abs(e.alpha) < 1e-6) return 'centre'; return e.alpha < 0 ? 'stable spiral' : 'unstable spiral'; }
  if (dt < -1e-9) return 'saddle';
  if (Math.abs(e.l1) < 1e-9 || Math.abs(e.l2) < 1e-9) return 'degenerate';
  return e.l1 < 0 ? 'stable node' : 'unstable node';
}

// real eigenvectors (invariant directions), for the real-eigenvalue cases.
export function eigvecs(A) {
  const e = eigen(A); if (!e.real) return null; const a = A[0][0], b = A[0][1], c = A[1][0], d = A[1][1];
  const vof = (l) => { let vx, vy; if (Math.abs(b) > 1e-9 || Math.abs(c) > 1e-9) { if (Math.abs(b) >= Math.abs(c)) { vx = b; vy = l - a; } else { vx = l - d; vy = c; } } else { vx = Math.abs(l - a) < 1e-9 ? 1 : 0; vy = vx === 1 ? 0 : 1; } const n = Math.hypot(vx, vy) || 1; return [vx / n, vy / n]; };
  return [{ l: e.l1, v: vof(e.l1) }, { l: e.l2, v: vof(e.l2) }];
}

export const PRESETS = {
  stableNode: { label: 'stable node', A: [[-1, 0], [0, -2]] },
  unstableNode: { label: 'unstable node', A: [[1, 0], [0, 2]] },
  saddle: { label: 'saddle', A: [[1, 0.6], [0.6, -1]] },
  centre: { label: 'centre', A: [[0, -1.4], [1, 0]] },
  stableSpiral: { label: 'stable spiral', A: [[-0.35, -1.3], [1.3, -0.35]] },
  unstableSpiral: { label: 'unstable spiral', A: [[0.35, -1.3], [1.3, 0.35]] },
};
