// Diffraction grating: N-slit interference pattern.
// I(theta) ~ (sin(N delta / 2) / sin(delta / 2))^2 * (sin(beta) / beta)^2,
// where delta = (2 pi d / lambda) sin theta, beta = (pi a / lambda) sin theta.
// Resolving power R = lambda / dlambda = m N (m: order, N: slits).
// Reference: Hecht Optics Ch. 10 (`hecht2017`); French Wave Phys (`french-waves`).
export function intensity(theta, lambdaNm, d_um, a_um, N) {
  const lambda = lambdaNm * 1e-9;
  const d = d_um * 1e-6, a = a_um * 1e-6;
  const sinTh = Math.sin(theta);
  const delta = (2 * Math.PI * d / lambda) * sinTh;
  const beta = (Math.PI * a / lambda) * sinTh;
  let multi = N * N;
  if (Math.abs(Math.sin(delta / 2)) > 1e-10) {
    const s = Math.sin(N * delta / 2) / Math.sin(delta / 2);
    multi = s * s;
  }
  let env = 1;
  if (Math.abs(beta) > 1e-10) { const t = Math.sin(beta) / beta; env = t * t; }
  return multi * env;
}
export function resolvingPower(m, N) { return m * N; }
// Principal maxima at d sin theta_m = m lambda.
export function principalMaxAngle(m, lambdaNm, d_um) {
  return Math.asin(Math.min(1, m * lambdaNm * 1e-9 / (d_um * 1e-6)));
}
