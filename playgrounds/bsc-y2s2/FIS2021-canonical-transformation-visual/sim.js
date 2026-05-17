// Canonical transformations. A map (q,p) -> (Q,P) is canonical iff
// the Poisson bracket {Q,P}_{q,p} = dQ/dq dP/dp - dQ/dp dP/dq = 1,
// equivalently its Jacobian determinant is 1, equivalently it
// preserves the phase-space area (the symplectic 2-form). Linear
// canonical maps M obey M^T J M = J. Examples here: identity, the
// harmonic scaling (sqrt(w) q, p/sqrt(w)) that turns the HO ellipse
// into a circle, a phase-space rotation, an area-preserving squeeze,
// a point + momentum transform, and a deliberately non-canonical
// p-doubling for contrast. Headless, deterministic. Reference:
// Goldstein, Poole and Safko, Classical Mechanics (3rd ed.), Ch. 9
// (`goldstein-mech`); Landau and Lifshitz, Mechanics (3rd ed.),
// Sec. 45 (`landau-mechanics`).

// Each map: apply(q,p,par) -> [Q,P]; jac(q,p,par) -> [[dQq,dQp],
// [dPq,dPp]] (constant for the linear ones).
export const MAPS = {
  identity: {
    apply: (q, p) => [q, p],
    jac: () => [[1, 0], [0, 1]],
    canonical: true,
  },
  hoScale: { // (sqrt(w) q, p/sqrt(w)): HO ellipse -> circle
    apply: (q, p, { w }) => [Math.sqrt(w) * q, p / Math.sqrt(w)],
    jac: (q, p, { w }) => [[Math.sqrt(w), 0], [0, 1 / Math.sqrt(w)]],
    canonical: true,
  },
  rotation: { // phase-space rotation by angle a
    apply: (q, p, { a }) => [q * Math.cos(a) + p * Math.sin(a), -q * Math.sin(a) + p * Math.cos(a)],
    jac: (q, p, { a }) => [[Math.cos(a), Math.sin(a)], [-Math.sin(a), Math.cos(a)]],
    canonical: true,
  },
  squeeze: { // (lam q, p/lam): area-preserving but distorts
    apply: (q, p, { lam }) => [lam * q, p / lam],
    jac: (q, p, { lam }) => [[lam, 0], [0, 1 / lam]],
    canonical: true,
  },
  point: { // Q = q^3 ... + the momentum that keeps it canonical
    apply: (q, p) => [q + 0.3 * q * q * q, p / (1 + 0.9 * q * q)],
    jac: (q, p) => [[1 + 0.9 * q * q, 0],
      [-(0.9 * 2 * q) * p / ((1 + 0.9 * q * q) ** 2), 1 / (1 + 0.9 * q * q)]],
    canonical: true,
  },
  pDouble: { // NOT canonical: doubles the area ({Q,P}=2)
    apply: (q, p) => [q, 2 * p],
    jac: () => [[1, 0], [0, 2]],
    canonical: false,
  },
};

export function mapApply(name, q, p, par = {}) { return MAPS[name].apply(q, p, par); }

// Poisson bracket {Q,P} from the analytic Jacobian (= det J).
export function poissonBracket(name, q, p, par = {}) {
  const j = MAPS[name].jac(q, p, par);
  return j[0][0] * j[1][1] - j[0][1] * j[1][0];
}

// Linear-map matrix M (constant Jacobian); throws if q-dependent.
export function linMatrix(name, par = {}) { return MAPS[name].jac(0, 0, par); }

// M^T J M, J = [[0,1],[-1,0]] (should equal J for canonical linear).
export function symplecticForm(M) {
  const J = [[0, 1], [-1, 0]];
  // M^T J M
  const Mt = [[M[0][0], M[1][0]], [M[0][1], M[1][1]]];
  const mul = (A, B) => [
    [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
    [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
  ];
  return mul(Mt, mul(J, M));
}

// Polygon (shoelace) signed area of a list of [x,y].
export function polyArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i += 1) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return 0.5 * s;
}

// A sample shape in (q,p): an ellipse of the HO at energy E,
// p^2 + w^2 q^2 = 2E, returned as a closed polygon.
export function hoEllipse(E, w, n = 200) {
  const pts = [];
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * 2 * Math.PI;
    pts.push([Math.sqrt(2 * E) / w * Math.cos(a), Math.sqrt(2 * E) * Math.sin(a)]);
  }
  return pts;
}

export function isCircle(pts, tol = 1e-6) {
  let cx = 0, cy = 0;
  for (const [x, y] of pts) { cx += x; cy += y; }
  cx /= pts.length; cy /= pts.length;
  let rmin = Infinity, rmax = 0;
  for (const [x, y] of pts) { const r = Math.hypot(x - cx, y - cy); rmin = Math.min(rmin, r); rmax = Math.max(rmax, r); }
  return rmax - rmin < tol * rmax;
}

export function hamiltonianHO(q, p) { return 0.5 * (p * p + q * q); }
