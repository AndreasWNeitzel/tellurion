// Compare Fourier and Laplace transforms of standard functions.
// f(t) = e^{-a t} u(t):
//   FT: F(omega) = 1 / (a + i omega) -> |F(omega)|^2 = 1 / (a^2 + omega^2) (Lorentzian).
//   LT: F(s) = 1 / (s + a), single pole at s = -a.
// f(t) = cos(omega_0 t) u(t):
//   FT: ((pi/2)(delta(omega - omega_0) + delta(omega + omega_0))) + i omega / (omega_0^2 - omega^2).
//   LT: s / (s^2 + omega_0^2).
// f(t) = t u(t):
//   LT: 1 / s^2 (FT does not exist as ordinary function).
// Reference: Arfken-Weber Ch. 15 (`arfken-weber`); Riley-Hobson Ch. 13 (`riley-hobson`).
export function timeFn(t, fn, params) {
  if (t < 0) return 0;
  switch (fn) {
    case 'exp': return Math.exp(-params.a * t);
    case 'cos': return Math.cos(params.omega0 * t) * Math.exp(-params.decay * t);
    case 'ramp': return t * Math.exp(-params.decay * t);
    case 'rect': return (t < params.T) ? 1 : 0;
  }
  return 0;
}
export function fourierMag2(omega, fn, params) {
  switch (fn) {
    case 'exp': return 1 / (params.a * params.a + omega * omega);
    case 'cos': {
      const a = params.decay, w0 = params.omega0;
      // |F|^2 of cos(w0 t) e^(-a t) u(t):
      const denom = (a * a + (omega - w0) ** 2) * (a * a + (omega + w0) ** 2);
      return 0.25 * (a * a + w0 * w0 + omega * omega) * (a * a + w0 * w0 + omega * omega) / denom;
    }
    case 'ramp': {
      const a = params.decay;
      return 1 / Math.pow(a * a + omega * omega, 2);
    }
    case 'rect': {
      const T = params.T;
      if (Math.abs(omega) < 1e-10) return T * T;
      return Math.pow(Math.sin(omega * T / 2) / (omega / 2), 2);
    }
  }
  return 0;
}
// Laplace transform value at real s (positive).
export function laplaceReal(s, fn, params) {
  switch (fn) {
    case 'exp': return 1 / (s + params.a);
    case 'cos': return (s + params.decay) / ((s + params.decay) ** 2 + params.omega0 ** 2);
    case 'ramp': return 1 / Math.pow(s + params.decay, 2);
    case 'rect': return (1 - Math.exp(-s * params.T)) / s;
  }
  return 0;
}
