// Spin-1/2 on the Bloch sphere. The Bloch vector S of a pure state
// has |S| = 1 and obeys the torque equation dS/dt = Omega(t) x S,
// where for a static field B0 z-hat plus a circularly polarized RF
// field of amplitude B1 rotating at w_rf,
//   Omega(t) = ( w1 cos(w_rf t), w1 sin(w_rf t), w0 ),
// with w0 = gamma B0 (Larmor) and w1 = gamma B1 (Rabi). Circular
// polarization makes the rotating-frame field exactly static, so no
// rotating-wave approximation is needed: the closed-form generalized
// Rabi solution is exact. Each step is an exact rotation (Rodrigues),
// so |S| is conserved to machine precision. Headless, deterministic.
// Reference: Sakurai and Napolitano, Modern Quantum Mechanics
// (2nd ed.), Sec. 2.1; Griffiths, Introduction to Quantum Mechanics
// (3rd ed.), Sec. 4.4 (Larmor precession and Rabi flopping).

export function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function norm(v) { return Math.hypot(v[0], v[1], v[2]); }

// Rotate v about the unit axis k by angle ang (Rodrigues' formula).
// Exactly length-preserving for any ang.
export function rodrigues(v, k, ang) {
  const km = Math.hypot(k[0], k[1], k[2]);
  if (km < 1e-15) return [v[0], v[1], v[2]];
  const kx = k[0] / km, ky = k[1] / km, kz = k[2] / km;
  const c = Math.cos(ang), s = Math.sin(ang);
  const kv = cross([kx, ky, kz], v);
  const kd = kx * v[0] + ky * v[1] + kz * v[2];
  return [
    v[0] * c + kv[0] * s + kx * kd * (1 - c),
    v[1] * c + kv[1] * s + ky * kd * (1 - c),
    v[2] * c + kv[2] * s + kz * kd * (1 - c),
  ];
}

// Instantaneous precession axis at time t. p = { w0, w1, wrf }.
export function omega(t, p) {
  return [p.w1 * Math.cos(p.wrf * t), p.w1 * Math.sin(p.wrf * t), p.w0];
}

// One exact step: rotate S about the midpoint axis by |Omega| dt.
// For a constant axis (w1 = 0, free Larmor) this is exact; otherwise
// the midpoint rule is third-order in dt and norm stays exact.
export function stepBloch(S, t, dt, p) {
  const ax = omega(t + 0.5 * dt, p);
  const m = Math.hypot(ax[0], ax[1], ax[2]);
  if (m < 1e-15) return [S[0], S[1], S[2]];
  return rodrigues(S, ax, m * dt);
}

// Integrate from t = 0 to T in steps of dt; return the final S.
export function evolve(S0, p, T, dt) {
  let S = [S0[0], S0[1], S0[2]];
  const n = Math.max(1, Math.round(T / dt));
  const h = T / n;
  for (let i = 0; i < n; i += 1) S = stepBloch(S, i * h, h, p);
  return S;
}

export function genRabi(w1, delta) { return Math.hypot(w1, delta); }

// Closed-form Sz(t) for S0 = +z under a detuned drive, detuning
// delta = w0 - w_rf, in the (exact) rotating frame with effective
// field (w1, 0, delta). OmegaR = sqrt(w1^2 + delta^2). Sz is the same
// in the lab and rotating frames (they differ only by a z-rotation).
export function rabiSz(t, w1, delta) {
  const OR2 = w1 * w1 + delta * delta;
  if (OR2 < 1e-30) return 1;
  const OR = Math.sqrt(OR2);
  return (delta * delta + w1 * w1 * Math.cos(OR * t)) / OR2;
}

// Deepest inversion reachable off resonance: min over a Rabi cycle
// of Sz, from S0 = +z. cos(OR t) = -1 gives this value.
export function maxInversionSz(w1, delta) {
  const OR2 = w1 * w1 + delta * delta;
  if (OR2 < 1e-30) return 1;
  return (delta * delta - w1 * w1) / OR2;
}

export function blochAngles(S) {
  const r = norm(S) || 1;
  return { theta: Math.acos(Math.max(-1, Math.min(1, S[2] / r))), phi: Math.atan2(S[1], S[0]) };
}
