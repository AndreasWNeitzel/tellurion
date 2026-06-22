// sim.js
// Legendre polynomials and the multipole expansion. The potential of a charge
// distribution expands in Legendre polynomials, V(r, theta) = sum_l (A_l r^l +
// B_l r^{-l-1}) P_l(cos theta), so the angular shape of each multipole is
// P_l(cos theta): the monopole (l=0) is isotropic, the dipole (l=1) is cos theta
// with one nodal cone, the quadrupole (l=2) has two, and in general P_l has l
// zeros in (-1, 1), the l nodal cones separating l+1 lobes of alternating sign.
//
// Reference: Jackson, Classical Electrodynamics, 3rd ed., Sec. 3.2-3.3; Arfken,
// Weber, Harris, Mathematical Methods for Physicists, 7th ed., Sec. 15.

// Legendre polynomial P_l(x) by Bonnet's recurrence.
export function legendreP(l, x) {
  if (l === 0) return 1; if (l === 1) return x;
  let p0 = 1, p1 = x; for (let k = 1; k < l; k += 1) { const p2 = ((2 * k + 1) * x * p1 - k * p0) / (k + 1); p0 = p1; p1 = p2; } return p1;
}

// the l roots of P_l in (-1, 1), by scanning for sign changes and bisecting.
export function legendreRoots(l) {
  if (l === 0) return []; const out = []; let prev = legendreP(l, -1); const dx = 0.001;
  for (let x = -1 + dx; x <= 1 + 1e-9; x += dx) { const cur = legendreP(l, x); if (prev * cur < 0) { let a = x - dx, b = x; for (let i = 0; i < 60; i += 1) { const m = 0.5 * (a + b); if (legendreP(l, a) * legendreP(l, m) <= 0) b = m; else a = m; } out.push(0.5 * (a + b)); } prev = cur; }
  return out;
}

// angular shape of the multipole: P_l(cos theta).
export function angular(l, theta) { return legendreP(l, Math.cos(theta)); }
// polar angles of the nodal cones (where P_l(cos theta) = 0).
export function nodalAngles(l) { return legendreRoots(l).map((x) => Math.acos(x)); }

// numeric inner product of P_l and P_m over [-1, 1] (for the orthogonality check).
export function inner(l, m, N = 4000) { let s = 0; const dx = 2 / N; for (let i = 0; i < N; i += 1) { const x = -1 + (i + 0.5) * dx; s += legendreP(l, x) * legendreP(m, x) * dx; } return s; }
