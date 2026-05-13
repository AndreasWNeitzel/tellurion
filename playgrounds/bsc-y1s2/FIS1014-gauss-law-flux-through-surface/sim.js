// sim.js
// 2D Gauss's law. A point charge q at position (cx, cy) generates the
// 2D electric field E(r) = q / (2 pi epsilon_0 r) * r_hat, where r is
// the position vector from the charge. The total flux through any
// closed curve enclosing the charge is q / epsilon_0; if the charge
// is outside the curve, the flux is zero.
//
// Numerically: parameterize the curve as p(t) for t in [0, 2 pi] and
// integrate E . n |dp/dt| dt. The outward normal n = (dy/dt, -dx/dt)
// / |dp/dt|, so the integrand reduces to E_x dy/dt - E_y dx/dt.
//
// Reference: Griffiths, Introduction to Electrodynamics 5e Ch. 2
// (`griffithsem2017`).

export const EPS0 = 8.8541878128e-12;
export const Q_C = 1.602176634e-19;

// Field at point (x, y) due to charge q at (cx, cy). 2D Coulomb.
export function field(x, y, cx = 0, cy = 0, q = Q_C) {
  const dx = x - cx, dy = y - cy;
  const r2 = dx * dx + dy * dy;
  if (r2 < 1e-20) return { Ex: 0, Ey: 0 };
  const k = q / (2 * Math.PI * EPS0 * r2);
  return { Ex: k * dx, Ey: k * dy };
}

// Closed parameterized curve: ellipse centered at (x0, y0) with semi-axes a, b.
export function ellipse(x0, y0, a, b) {
  return {
    x: (t) => x0 + a * Math.cos(t),
    y: (t) => y0 + b * Math.sin(t),
    dx: (t) => -a * Math.sin(t),
    dy: (t) => b * Math.cos(t),
  };
}

// Closed parameterized curve: blob (ellipse plus a low-amplitude radial perturbation).
export function blob(x0, y0, a, b, amp = 0.3, k = 3) {
  return {
    x: (t) => x0 + (a + amp * Math.cos(k * t)) * Math.cos(t),
    y: (t) => y0 + (b + amp * Math.cos(k * t)) * Math.sin(t),
    dx: (t) => -amp * k * Math.sin(k * t) * Math.cos(t) - (a + amp * Math.cos(k * t)) * Math.sin(t),
    dy: (t) => -amp * k * Math.sin(k * t) * Math.sin(t) + (a + amp * Math.cos(k * t)) * Math.cos(t),
  };
}

// Simpson 1/3 integration.
function simpson(f, a, b, n) {
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i += 1) s += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
  return s * h / 3;
}

// Flux of E through the closed curve C: oint E . n ds.
// With p(t) = (x(t), y(t)), the outward normal is n = (dy/dt, -dx/dt)
// (assuming counterclockwise traversal). So E . n ds = (E_x dy/dt - E_y dx/dt) dt.
export function flux(curve, cx, cy, q, n = 400) {
  const integrand = (t) => {
    const x = curve.x(t), y = curve.y(t);
    const { Ex, Ey } = field(x, y, cx, cy, q);
    return Ex * curve.dy(t) - Ey * curve.dx(t);
  };
  return simpson(integrand, 0, 2 * Math.PI, n);
}

// Whether the charge is inside the curve (point-in-polygon, but we use
// the analytic ellipse-test which is enough for the implemented shapes).
export function insideEllipse(cx, cy, x0, y0, a, b) {
  const dx = (cx - x0) / a, dy = (cy - y0) / b;
  return dx * dx + dy * dy < 1;
}
