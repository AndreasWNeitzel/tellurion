// sim.js
// Least squares as projection. Fitting a line y = m x + c to points (x_i, y_i) is
// projecting the data vector b onto the column space of A = [x | 1]: the fitted
// values p = A x_hat are the closest point in that plane to b, so the residual
// r = b - p is orthogonal to it, A^T r = 0, which is exactly the normal equations
// A^T A x_hat = A^T b. For a line this reads
//   m_hat = Sxy / Sxx,   c_hat = ybar - m_hat xbar,
// and the line passes through the centroid. The sum of squared residuals is a
// parabola in the slope, SSR(m) = Syy - 2 m Sxy + m^2 Sxx, minimised at m_hat.
//
// Reference: Strang, Introduction to Linear Algebra, 5th ed., Sec. 4.3 (least
// squares and the normal equations); Lay, Linear Algebra and Its Applications,
// Sec. 6.5 and 6.6.

export function stats(pts) {
  const n = pts.length; let sx = 0, sy = 0; for (const p of pts) { sx += p.x; sy += p.y; }
  const xbar = sx / n, ybar = sy / n; let Sxx = 0, Sxy = 0, Syy = 0;
  for (const p of pts) { const dx = p.x - xbar, dy = p.y - ybar; Sxx += dx * dx; Sxy += dx * dy; Syy += dy * dy; }
  return { n, xbar, ybar, Sxx, Sxy, Syy };
}
export function lsSlope(pts) { const s = stats(pts); return s.Sxx > 1e-12 ? s.Sxy / s.Sxx : 0; }
export function lsIntercept(pts) { const s = stats(pts); return s.ybar - lsSlope(pts) * s.xbar; }
export function ssr(pts, m, c) { let v = 0; for (const p of pts) { const r = p.y - (m * p.x + c); v += r * r; } return v; }

// SSR of the centroid line of slope m (the natural one-parameter family), a clean
// parabola whose vertex is the least-squares slope.
export function ssrCentroid(pts, m) { const s = stats(pts); return s.Syy - 2 * m * s.Sxy + m * m * s.Sxx; }
export function ssrMin(pts) { const s = stats(pts); return s.Syy - (s.Sxx > 1e-12 ? s.Sxy * s.Sxy / s.Sxx : 0); }

// residuals to the centroid line of slope m, and the two normal-equation sums
// (sum r and sum r (x - xbar)), both zero at the least-squares slope.
export function residuals(pts, m) { const s = stats(pts); return pts.map((p) => p.y - (s.ybar + m * (p.x - s.xbar))); }
export function normalSums(pts, m) { const s = stats(pts); const r = residuals(pts, m); let s0 = 0, s1 = 0; r.forEach((ri, i) => { s0 += ri; s1 += ri * (pts[i].x - s.xbar); }); return { sumR: s0, sumRx: s1 }; }
export function rSquared(pts, m) { const s = stats(pts); return s.Syy > 1e-12 ? 1 - ssrCentroid(pts, m) / s.Syy : 1; }

export const PRESET = [
  { x: -2.6, y: -1.7 }, { x: -1.8, y: -1.5 }, { x: -1.0, y: -0.4 }, { x: -0.3, y: -0.7 },
  { x: 0.4, y: 0.3 }, { x: 1.1, y: 0.6 }, { x: 1.7, y: 1.4 }, { x: 2.5, y: 1.2 },
];
