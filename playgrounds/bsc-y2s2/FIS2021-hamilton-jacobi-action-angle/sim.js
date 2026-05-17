// Action-angle variables. For a 1-DOF bound system the action is
//   J = (1/2 pi) contour p dq = (enclosed phase area) / 2 pi,
// the angle theta is cyclic with theta-dot = omega(J) = dH/dJ, and a
// canonical transform turns the orbit into a circle of radius
// sqrt(2 J) traced at constant angular rate. Harmonic oscillator
// H = 1/2 (p^2 + w0^2 q^2): J = E / w0 and omega = w0 (isochronous).
// Pendulum H = 1/2 p^2 + w0^2 (1 - cos q): J grows and omega(J) falls
// with amplitude (anharmonic), with adiabatic invariance of J under
// a slow w0(t). Headless, deterministic. Reference: Goldstein, Poole
// and Safko, Classical Mechanics (3rd ed.), Ch. 10 (`goldstein-mech`);
// Landau and Lifshitz, Mechanics (3rd ed.), Sec. 49-50
// (`landau-mechanics`).

// Potentials V(q) (mass = 1).
export function potential(kind, q, w0 = 1) {
  if (kind === 'pendulum') return w0 * w0 * (1 - Math.cos(q));
  if (kind === 'quartic') return 0.25 * w0 * w0 * q * q * q * q;
  return 0.5 * w0 * w0 * q * q;                       // harmonic
}
export function energyOf(kind, q, p, w0 = 1) { return 0.5 * p * p + potential(kind, q, w0); }

// Turning points of the bound orbit at energy E (libration only).
export function turningPoints(kind, E, w0 = 1) {
  if (kind === 'harmonic') { const a = Math.sqrt(2 * E) / w0; return [-a, a]; }
  if (kind === 'pendulum') { const c = 1 - E / (w0 * w0); if (c <= -1) return null; const a = Math.acos(Math.max(-1, c)); return [-a, a]; }
  const a = Math.pow(4 * E / (w0 * w0), 0.25); return [-a, a];   // quartic
}

// Action J = (1/2 pi) contour p dq = (1/pi) integral_{q-}^{q+} p dq,
// p = sqrt(2 (E - V)). Substituting q = mid + h cos u removes the
// inverse-sqrt turning-point singularities.
export function action(kind, E, w0 = 1, N = 4000) {
  const tp = turningPoints(kind, E, w0);
  if (!tp) return Infinity;
  const [qm, qp] = tp, mid = 0.5 * (qm + qp), h = 0.5 * (qp - qm);
  let s = 0;
  for (let i = 0; i < N; i += 1) {
    const u = ((i + 0.5) / N) * Math.PI;                // 0..pi
    const q = mid + h * Math.cos(u);
    const v = 2 * (E - potential(kind, q, w0));
    if (v > 0) s += Math.sqrt(v) * h * Math.sin(u) * (Math.PI / N);
  }
  return s / Math.PI;                                   // (1/pi) int p dq
}

// Period T(E) = contour dq / p = 2 integral dq / sqrt(2(E-V)); for
// the harmonic this is 2 pi / w0 for every E (isochronous).
export function period(kind, E, w0 = 1, N = 4000) {
  const tp = turningPoints(kind, E, w0);
  if (!tp) return Infinity;
  const [qm, qp] = tp, mid = 0.5 * (qm + qp), h = 0.5 * (qp - qm);
  let s = 0;
  for (let i = 0; i < N; i += 1) {
    const u = ((i + 0.5) / N) * Math.PI;
    const q = mid + h * Math.cos(u);
    const v = 2 * (E - potential(kind, q, w0));
    if (v > 1e-12) s += (h * Math.sin(u) / Math.sqrt(v)) * (Math.PI / N);
  }
  return 2 * s;
}
export function omegaOfE(kind, E, w0 = 1) { return 2 * Math.PI / period(kind, E, w0); }

// Harmonic closed forms.
export function harmonicActionExact(E, w0) { return E / w0; }
export function energyFromAction(kind, J, w0 = 1) {
  if (kind === 'harmonic') return w0 * J;
  // invert E -> J by bisection (monotone)
  let lo = 1e-9, hi = (kind === 'pendulum') ? 2 * w0 * w0 - 1e-9 : 50;
  for (let i = 0; i < 80; i += 1) { const m = 0.5 * (lo + hi); if (action(kind, m, w0) < J) lo = m; else hi = m; }
  return 0.5 * (lo + hi);
}

// One harmonic trajectory point at time t from amplitude A: the
// action-angle picture is a circle radius sqrt(2J) = A sqrt(w0).
export function harmonicState(A, w0, t) {
  return { q: A * Math.cos(w0 * t), p: -A * w0 * Math.sin(w0 * t), theta: (w0 * t) % (2 * Math.PI) };
}
// Scaled coords (Q, P) = (sqrt(w0) q, p/sqrt(w0)): the harmonic
// orbit is the circle Q^2 + P^2 = 2E/w0 = 2J.
export function toCircle(q, p, w0) { return { Q: Math.sqrt(w0) * q, P: p / Math.sqrt(w0) }; }
