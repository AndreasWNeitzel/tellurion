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

// Laplace transform at complex s = sx + i sy, returning { re, im }.
// Same closed forms as above, evaluated with complex arithmetic so the
// whole s-plane (the analytic landscape and its poles) can be drawn,
// not just the positive real axis. On the imaginary axis (sx = 0) this
// reduces to the Fourier transform.
export function laplaceComplex(sx, sy, fn, params) {
  const div = (ar, ai, br, bi) => {
    const d = br * br + bi * bi || 1e-30;
    return { re: (ar * br + ai * bi) / d, im: (ai * br - ar * bi) / d };
  };
  if (fn === 'exp') {
    return div(1, 0, sx + params.a, sy);                 // 1 / (s + a)
  }
  if (fn === 'cos') {
    const wx = sx + params.decay, wy = sy;               // w = s + decay
    const w2r = wx * wx - wy * wy, w2i = 2 * wx * wy;     // w^2
    return div(wx, wy, w2r + params.omega0 * params.omega0, w2i); // w / (w^2 + w0^2)
  }
  if (fn === 'ramp') {
    const wx = sx + params.decay, wy = sy;
    const w2r = wx * wx - wy * wy, w2i = 2 * wx * wy;
    return div(1, 0, w2r, w2i);                          // 1 / (s + decay)^2
  }
  if (fn === 'rect') {
    const ex = Math.exp(-sx * params.T);
    const er = ex * Math.cos(sy * params.T), ei = -ex * Math.sin(sy * params.T);
    return div(1 - er, -ei, sx, sy);                     // (1 - e^{-sT}) / s
  }
  return { re: 0, im: 0 };
}
