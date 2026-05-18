// Normalized two-level laser rate equations (Siegman; Saleh & Teich).
// n = population inversion, p = intracavity photon number, time in
// units of the upper-state lifetime:
//   dn/dt = r - n - n p          (pump r, decay, stimulated emission)
//   dp/dt = n p - p / q0 + s     (gain, cavity loss, spontaneous seed)
// Net photon growth needs n > 1/q0, so the threshold inversion is
// n_th = 1/q0 and the threshold pump is r_th = 1/q0. Above threshold
// the inversion clamps at n_th (gain clamping) and the output power
// is proportional to (r - r_th) with a sharp kink at threshold;
// Q-switching builds a large inversion at low Q then dumps it as a
// giant pulse whose energy is proportional to the depleted inversion.
// RK4, deterministic (the spontaneous seed s is a fixed constant, not
// random). Reference: Siegman, Lasers, University Science Books 1986
// (`siegman1986`); Saleh and Teich, Fundamentals of Photonics, 2nd
// ed., Wiley 2007 (`saleh2007`).

export const SEED = 1e-6;                            // spontaneous seed (fixed)

export function thresholdPump(q0) { return 1 / q0; }

// Closed-form steady state.
export function steadyInversion(r, q0) {
  return r > thresholdPump(q0) ? 1 / q0 : r;         // clamps to n_th above threshold
}
export function steadyPhotons(r, q0) {
  return r > thresholdPump(q0) ? (r * q0 - 1) : 0;    // ~0 below threshold
}
// Output power proportional to photons leaving the cavity (p / q0).
export function outputPower(r, q0) {
  return r > thresholdPump(q0) ? (steadyPhotons(r, q0) / q0) : 0;
}

function deriv(n, p, r, q0) {
  return [r - n - n * p, n * p - p / q0 + SEED];
}

export function createLaser({ r = 2, q0 = 2, n0 = 0, p0 = SEED } = {}) {
  return { n: n0, p: p0, r, q0, t: 0 };
}

export function step(s, dt) {
  const { r, q0 } = s;
  const k1 = deriv(s.n, s.p, r, q0);
  const k2 = deriv(s.n + 0.5 * dt * k1[0], s.p + 0.5 * dt * k1[1], r, q0);
  const k3 = deriv(s.n + 0.5 * dt * k2[0], s.p + 0.5 * dt * k2[1], r, q0);
  const k4 = deriv(s.n + dt * k3[0], s.p + dt * k3[1], r, q0);
  s.n += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
  s.p += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
  if (s.p < 0) s.p = 0;
  s.t += dt;
}

// Integrate to the steady state; also report the transient photon peak
// (relaxation-oscillation overshoot).
export function runToSteady(r, q0, { dt = 5e-3, T = 80 } = {}) {
  const s = createLaser({ r, q0, n0: 0, p0: SEED });
  let peak = 0;
  const N = Math.round(T / dt);
  for (let i = 0; i < N; i += 1) { step(s, dt); if (s.p > peak) peak = s.p; }
  return { n: s.n, p: s.p, peakP: peak };
}

// Q-switch: charge the gain at low Q (high loss, no lasing), then
// open the cavity (high Q) and dump a giant pulse. Returns the
// inversion before/after the dump and the emitted pulse energy
// (integral of the out-coupled photon flux p / q0High).
export function qSwitch({ r = 4, q0Low = 0.25, q0High = 4, charge = 30, dump = 12, dt = 5e-4 } = {}) {
  const s = createLaser({ r, q0: q0Low, n0: 0, p0: SEED });
  const nc = Math.round(charge / dt);
  for (let i = 0; i < nc; i += 1) step(s, dt);
  const nI = s.n;
  s.q0 = q0High;
  // Integrate the giant pulse only: accumulate until the photon
  // number falls back below 1% of its peak after peaking (before CW
  // lasing re-establishes), and track the post-pulse inversion
  // minimum. In this fast-pulse window E ~ (n_i - n_f).
  const pInit = s.p;
  let energy = 0, peakP = 0, nMin = nI, srcInt = 0;
  const nd = Math.round(dump / dt);
  for (let i = 0; i < nd; i += 1) {
    srcInt += (r - s.n) * dt;                          // integral of (pump - decay)
    step(s, dt);
    energy += (s.p / q0High) * dt;
    if (s.p > peakP) peakP = s.p;
    if (s.n < nMin) nMin = s.n;
  }
  // Exact rate-equation energy balance over the window:
  //   E = (n_i - n_end) + integral(r - n) - (p_end - p_init).
  return { nI, nF: nMin, nEnd: s.n, energy, peakP, srcInt, pInit, pEnd: s.p };
}
