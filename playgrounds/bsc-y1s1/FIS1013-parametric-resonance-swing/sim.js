// Parametric resonance: a pendulum whose natural frequency is modulated in time, the
// way a child pumps a swing. The small-angle equation is the damped Mathieu equation
//   theta'' + 2 beta theta' + omega0^2 (1 + h cos(omegaD t)) theta = 0.
// In the scaled time tau = omegaD t / 2 this becomes theta'' + 2 gamma theta' +
// (a - 2q cos 2tau) theta = 0 with a = (2 omega0/omegaD)^2, q = a h / 2, gamma = 2 beta/omegaD.
// Floquet analysis of one drive period gives the growth per period; parametric resonance
// (exponential growth) lives in tongues emanating from a = n^2, strongest at a = 1
// (omegaD = 2 omega0). Reference: Landau and Lifshitz, Mechanics, 3rd ed., section 27.

// One RK4 step of the real-time damped Mathieu equation. Returns [theta, thetaDot].
export function mathieuStep(th, thd, t, omega0, omegaD, h, beta, dt) {
  const acc = (T, Td, tt) => -2 * beta * Td - omega0 * omega0 * (1 + h * Math.cos(omegaD * tt)) * T;
  const k1x = thd, k1v = acc(th, thd, t);
  const k2x = thd + 0.5 * dt * k1v, k2v = acc(th + 0.5 * dt * k1x, thd + 0.5 * dt * k1v, t + 0.5 * dt);
  const k3x = thd + 0.5 * dt * k2v, k3v = acc(th + 0.5 * dt * k2x, thd + 0.5 * dt * k2v, t + 0.5 * dt);
  const k4x = thd + dt * k3v, k4v = acc(th + dt * k3x, thd + dt * k3v, t + dt);
  return [th + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x), thd + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v)];
}

// Map the physical controls to the Mathieu parameters (a, q, gamma). omega0 = 1.
export function mathieuParams(r, h, beta) { const a = (2 / r) * (2 / r); return { a, q: (a * h) / 2, gamma: (2 * beta) / r }; }

// Largest Floquet multiplier magnitude of theta'' + 2 gamma theta' + (a - 2q cos 2tau) theta = 0
// over one period (tau in [0, pi]). Greater than 1 means exponential growth (unstable).
export function floquetGrowth(a, q, gamma, steps = 200) {
  const integrate = (x0, v0) => {
    let x = x0, v = v0; const dt = Math.PI / steps;
    const acc = (X, V, tau) => -2 * gamma * V - (a - 2 * q * Math.cos(2 * tau)) * X;
    for (let i = 0; i < steps; i += 1) {
      const tau = i * dt;
      const k1x = v, k1v = acc(x, v, tau);
      const k2x = v + 0.5 * dt * k1v, k2v = acc(x + 0.5 * dt * k1x, v + 0.5 * dt * k1v, tau + 0.5 * dt);
      const k3x = v + 0.5 * dt * k2v, k3v = acc(x + 0.5 * dt * k2x, v + 0.5 * dt * k2v, tau + 0.5 * dt);
      const k4x = v + dt * k3v, k4v = acc(x + dt * k3x, v + dt * k3v, tau + dt);
      x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x); v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    }
    return [x, v];
  };
  const [x1, v1] = integrate(1, 0), [x2, v2] = integrate(0, 1);
  const tr = x1 + v2, det = x1 * v2 - x2 * v1, disc = tr * tr - 4 * det;
  if (disc >= 0) { const s = Math.sqrt(disc); return Math.max(Math.abs((tr + s) / 2), Math.abs((tr - s) / 2)); }
  return Math.sqrt(Math.max(0, det));
}
