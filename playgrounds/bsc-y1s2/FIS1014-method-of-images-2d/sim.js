// Method of images for a point charge above a grounded conducting plane.
// Place the real charge q at (a, b) with b > 0 above the y = 0 plane.
// The potential above the plane equals that of the real charge plus an
// image charge -q at (a, -b). Below the plane the potential is zero.
// Reference: Griffiths E&M Ch. 3.2 (`griffiths-em`).
export function potential(x, y, q, a, b) {
  if (y <= 0) return 0;
  const r1 = Math.hypot(x - a, y - b) + 1e-8;
  const r2 = Math.hypot(x - a, y + b) + 1e-8;
  return q / r1 - q / r2;
}
export function field(x, y, q, a, b) {
  if (y <= 0) return { ex: 0, ey: 0 };
  const dx1 = x - a, dy1 = y - b, r1 = Math.hypot(dx1, dy1) + 1e-8;
  const dx2 = x - a, dy2 = y + b, r2 = Math.hypot(dx2, dy2) + 1e-8;
  const r1_3 = r1 ** 3, r2_3 = r2 ** 3;
  return { ex: q * dx1 / r1_3 - q * dx2 / r2_3, ey: q * dy1 / r1_3 - q * dy2 / r2_3 };
}
// Surface charge on plane: sigma(x) = -q b / (2 pi (x^2 + b^2)^{3/2}).
export function inducedSigma(x, q, b) {
  return -q * b / (2 * Math.PI * Math.pow(x * x + b * b, 1.5));
}
// Integrated total induced charge = -q.
export function totalInducedCharge(q, b, L = 1e4, N = 20000) {
  let s = 0;
  const dx = (2 * L) / N;
  for (let i = -N / 2; i <= N / 2; i += 1) {
    const x = i * dx;
    s += inducedSigma(x, q, b);
  }
  return s * dx;
}
