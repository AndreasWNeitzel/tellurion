// Toy least-squares orbit fit. Given three (or more) noisy plane-of-sky positions
// (x_i, y_i) at times t_i, fit a Keplerian orbit a, e, omega, M_0. Here we restrict
// to a 2D orbit (i = 0, Omega = 0) and use linear-LS for a circular orbit of unknown
// (x0, y0, r) plus a phase fit.
// Reference: Bate-Mueller-White Fundamentals of Astrodynamics Ch. 5 (`bmw`);
// Carroll-Ostlie Ch. 2.3 (`carroll-ostlie`).
import { makeRng } from '../../../shared/js/render/rng.js';
export function generateData(a, e, omega, P, t_arr, sigma_noise = 0.02, seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  const data = [];
  for (const t of t_arr) {
    const M = 2 * Math.PI * (t / P);
    let E = M;
    for (let it = 0; it < 30; it += 1) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
    const r = a * (1 - e * e) / (1 + e * Math.cos(nu));
    const xp = r * Math.cos(nu + omega), yp = r * Math.sin(nu + omega);
    const u1 = rng() + 1e-9, u2 = rng();
    const gx = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const gy = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
    data.push({ t, x: xp + sigma_noise * gx, y: yp + sigma_noise * gy });
  }
  return data;
}
// Fit a circle by linear LS to (x_i, y_i): minimize sum (xi^2 + yi^2 - 2 x0 xi - 2 y0 yi - (r^2 - x0^2 - y0^2))^2.
export function fitCircle(data) {
  let Sx = 0, Sy = 0, Sxx = 0, Syy = 0, Sxy = 0, Sxz = 0, Syz = 0, Sz = 0;
  const N = data.length;
  for (const { x, y } of data) {
    const z = x * x + y * y;
    Sx += x; Sy += y; Sxx += x * x; Syy += y * y; Sxy += x * y;
    Sxz += x * z; Syz += y * z; Sz += z;
  }
  // Solve 3x3 system.
  const A = [[Sxx, Sxy, Sx], [Sxy, Syy, Sy], [Sx, Sy, N]];
  const b = [Sxz, Syz, Sz];
  // Cramer's rule.
  const det = (M) => M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1]) - M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0]) + M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);
  const detA = det(A);
  if (Math.abs(detA) < 1e-12) return { x0: 0, y0: 0, r: 1 };
  const A1 = [[b[0], A[0][1], A[0][2]], [b[1], A[1][1], A[1][2]], [b[2], A[2][1], A[2][2]]];
  const A2 = [[A[0][0], b[0], A[0][2]], [A[1][0], b[1], A[1][2]], [A[2][0], b[2], A[2][2]]];
  const A3 = [[A[0][0], A[0][1], b[0]], [A[1][0], A[1][1], b[1]], [A[2][0], A[2][1], b[2]]];
  const a_c = det(A1) / detA, b_c = det(A2) / detA, c_c = det(A3) / detA;
  const x0 = a_c / 2, y0 = b_c / 2;
  const r = Math.sqrt(c_c + x0 * x0 + y0 * y0);
  return { x0, y0, r };
}
export function rms(data, fit) {
  let s = 0;
  for (const { x, y } of data) s += (Math.hypot(x - fit.x0, y - fit.y0) - fit.r) ** 2;
  return Math.sqrt(s / data.length);
}
