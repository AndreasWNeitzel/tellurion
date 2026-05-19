// Laser rate equations (DOM-free engine). Dimensionless two-level
// cavity model:
//
//   dN/dt   = P - N/tau - B N n        (population inversion)
//   dn/dt   = B N n - n/tauC + s N/tau  (cavity photon number)
//
// N is the inversion, n the intracavity photon number, P the pump
// rate, tau the upper-state lifetime, tauC the cavity photon lifetime
// (set by the mirror loss: tauC = (2 Lc / c0) / (1 - R), longer when
// the mirrors are better or the cavity longer), B the stimulated-
// emission coupling, and s a tiny spontaneous-emission seed so the
// laser can start. The lasing threshold is not scripted: it falls out
// of the steady state. Setting dn/dt = 0 gives the gain-clamped
// inversion N_th = 1 / (B tauC); the threshold pump is
// P_th = N_th / tau. Below P_th the steady photon number is the
// negligible spontaneous floor; above it the inversion clamps at
// N_th and every extra pump photon goes into the beam, so the output
// is a straight line with a sharp kink at threshold. A Q-switch holds
// tauC tiny (no feedback) while the pump piles up a huge inversion,
// then restores it: the stored inversion dumps as one giant pulse.
//
// References: Siegman, Lasers, University Science Books 1986, Ch. 13;
// Svelto, Principles of Lasers, 5th ed., Springer 2010, Ch. 7-8.

export function cavityLifetime(Lc, R, c0 = 1) {
  const loss = Math.max(1e-6, 1 - R);
  return (2 * Lc / c0) / loss;
}

// Gain-clamped threshold inversion and threshold pump rate.
export function thresholdInversion(B, tauC) { return 1 / (B * tauC); }
export function thresholdPump(B, tauC, tau) { return thresholdInversion(B, tauC) / tau; }

export function makeLaser(opts = {}) {
  return {
    N: 0, n: 1e-6, t: 0,
    P: opts.P ?? 2,
    tau: opts.tau ?? 1,
    tauC: opts.tauC ?? 0.1,
    B: opts.B ?? 1,
    seed: opts.seed ?? 1e-6,
    qLow: opts.qLow ?? 1e-3,        // tauC while the Q-switch is closed
  };
}

// One RK4 step of the rate equations. qOpen = false forces a tiny
// cavity lifetime (Q-switch closed: photons leak instantly).
export function step(s, dt, qOpen = true) {
  const tauC = qOpen ? s.tauC : s.qLow;
  const deriv = (N, n) => [
    s.P - N / s.tau - s.B * N * n,
    s.B * N * n - n / tauC + s.seed * N / s.tau,
  ];
  const [a1, b1] = deriv(s.N, s.n);
  const [a2, b2] = deriv(s.N + 0.5 * dt * a1, s.n + 0.5 * dt * b1);
  const [a3, b3] = deriv(s.N + 0.5 * dt * a2, s.n + 0.5 * dt * b2);
  const [a4, b4] = deriv(s.N + dt * a3, s.n + dt * b3);
  s.N += (dt / 6) * (a1 + 2 * a2 + 2 * a3 + a4);
  s.n += (dt / 6) * (b1 + 2 * b2 + 2 * b3 + b4);
  if (s.N < 0) s.N = 0;
  if (s.n < 1e-12) s.n = 1e-12;
  s.t += dt;
}

// Output power leaving the cavity: photons escaping per unit time.
export function outputPower(s) { return s.n / s.tauC; }

// Run to steady state at the current parameters and return (N, n,
// output). Used by the invariant tests and the threshold curve.
export function steadyState(s, dt = 2e-3, nstep = 60000) {
  const c = makeLaser(s);
  c.P = s.P; c.tau = s.tau; c.tauC = s.tauC; c.B = s.B; c.seed = s.seed;
  for (let i = 0; i < nstep; i += 1) step(c, dt, true);
  return { N: c.N, n: c.n, output: c.n / c.tauC };
}
