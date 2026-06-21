// sim.js
// Green's theorem in circulation form: the line integral of a field around a
// closed curve (the circulation) equals the integral of its curl over the
// enclosed region,
//   closed integral of F . dr = double integral of (curl F) dA,
// with the scalar two-dimensional curl  curl F = dFy/dx - dFx/dy. This is the
// planar Stokes theorem and the mathematics behind Ampere's law (the circulation
// of B around a loop counts the enclosed current). A point-vortex field makes the
// analogy exact: its circulation is 2 pi when the vortex is enclosed and zero
// otherwise.
//
// Reference: Stewart, Calculus, 8e, Sec. 16.4 (Green's theorem) and 16.5 (curl);
// Griffiths, Introduction to Electrodynamics, 5e, Sec. 1.3.5 and 5.3.

export const FIELDS = {
  vortex: { label: 'rotation  F = (-y, x)', F: (x, y) => [-y, x], curl: () => 2, singular: false },
  varying: { label: 'varying curl  F = (-y^2/2, x^2/2)', F: (x, y) => [-0.5 * y * y, 0.5 * x * x], curl: (x, y) => x + y, singular: false },
  source: { label: 'irrotational  F = (x, y)', F: (x, y) => [x, y], curl: () => 0, singular: false },
  shear: { label: 'shear  F = (y, 0)', F: (x, y) => [y, 0], curl: () => -1, singular: false },
  pointvortex: { label: 'point vortex  F = (-y, x)/r^2', F: (x, y) => { const r2 = x * x + y * y || 1e-12; return [-y / r2, x / r2]; }, curl: () => 0, singular: true },
};

// Circulation around a circle of radius R centred at (cx, cy): integral of F . t
// ds with t the counterclockwise unit tangent and ds = R d(theta).
export function circulationCircle(field, cx, cy, R, n = 720) {
  let s = 0; const dth = 2 * Math.PI / n;
  for (let i = 0; i < n; i += 1) {
    const th = (i + 0.5) * dth, c = Math.cos(th), sn = Math.sin(th);
    const [fx, fy] = field.F(cx + R * c, cy + R * sn);
    s += (fx * (-sn) + fy * c) * R * dth;        // F . t_hat times ds
  }
  return s;
}

// Area integral of the curl over the disc (midpoint rule on a grid).
export function curlIntegralCircle(field, cx, cy, R, n = 140) {
  let s = 0; const d = 2 * R / n;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const x = cx - R + (i + 0.5) * d, y = cy - R + (j + 0.5) * d;
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= R * R) s += field.curl(x, y) * d * d;
    }
  }
  return s;
}

export function enclosesOrigin(cx, cy, R) { return cx * cx + cy * cy < R * R; }
