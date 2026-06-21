// sim.js
// The divergence theorem in the plane: the outward flux of a vector field
// through a closed curve equals the integral of its divergence over the enclosed
// region,
//   closed integral of F . n ds = double integral of (div F) dA.
// This is the two-dimensional Gauss theorem and the mathematics behind Gauss's
// law (the flux out of a region equals the enclosed source). A point-source field
// makes the Gauss analogy exact: its flux is 2 pi when the source is enclosed and
// zero when it is not.
//
// Reference: Stewart, Calculus, 8e, Sec. 16.5 (curl and divergence) and 16.9 (the
// divergence theorem); Griffiths, Introduction to Electrodynamics, 5e, Sec. 1.3.

export const FIELDS = {
  source: { label: 'radial source  F = (x, y)', F: (x, y) => [x, y], div: () => 2, singular: false },
  varying: { label: 'varying div  F = (x^2/2, y^2/2)', F: (x, y) => [0.5 * x * x, 0.5 * y * y], div: (x, y) => x + y, singular: false },
  rotation: { label: 'rotation  F = (-y, x)', F: (x, y) => [-y, x], div: () => 0, singular: false },
  saddle: { label: 'source and sink  F = (x, -y)', F: (x, y) => [x, -y], div: () => 0, singular: false },
  point: { label: 'point source  F = (x, y)/r^2', F: (x, y) => { const r2 = x * x + y * y || 1e-12; return [x / r2, y / r2]; }, div: () => 0, singular: true },
};

// Outward flux through a circle of radius R centred at (cx, cy): integral of
// F . n ds with n the outward unit normal and ds = R d(theta).
export function fluxCircle(field, cx, cy, R, n = 720) {
  let s = 0; const dth = 2 * Math.PI / n;
  for (let i = 0; i < n; i += 1) {
    const th = (i + 0.5) * dth, c = Math.cos(th), sn = Math.sin(th);
    const [fx, fy] = field.F(cx + R * c, cy + R * sn);
    s += (fx * c + fy * sn) * R * dth;       // F . n_hat times ds
  }
  return s;
}

// Area integral of the divergence over the disc (midpoint rule on a grid,
// counting only cells whose centre lies inside the circle).
export function divIntegralCircle(field, cx, cy, R, n = 140) {
  let s = 0; const d = 2 * R / n;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const x = cx - R + (i + 0.5) * d, y = cy - R + (j + 0.5) * d;
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= R * R) s += field.div(x, y) * d * d;
    }
  }
  return s;
}

// Whether the singular point (origin) is enclosed by the circle.
export function enclosesOrigin(cx, cy, R) { return cx * cx + cy * cy < R * R; }
