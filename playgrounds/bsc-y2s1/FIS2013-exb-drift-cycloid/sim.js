// sim.js
// Charged particle in crossed uniform E and B fields:
//   B = B z-hat,  E = E x-hat
// The equation of motion is
//   d v / dt = (q / m) (E + v x B)
// With the drift decomposition v = v_drift + v_circ,
//   v_drift = (E x B) / B^2  (here = E / B in the y direction for B z-hat)
// the circular motion has the cyclotron frequency omega_c = q B / m and a
// radius determined by the perpendicular speed in the drifting frame.
//
// Reference: Jackson, Classical Electrodynamics Ch. 12 (E x B drift).

// Default species: q = +1, m = 1. Both are now slider-controlled in
// playground.js; pass through the state.
export const Q_DEFAULT = 1.0;
export const M_DEFAULT = 1.0;

// E x B drift is INDEPENDENT of charge and mass (this is a key physics
// insight): drift_v = (E x B) / B^2 = (0, -E / B, 0) for E along +x and
// B along +z. Negative-charge particles drift in the SAME direction as
// positive ones, but their cyclotron motion goes the opposite way.
export function driftVelocity(E, B) {
  return { vx: 0, vy: -E / B };
}

export function createExB({ E = 0.5, B = 1.0, q = Q_DEFAULT, m = M_DEFAULT, x0 = 0, y0 = 0, vx0 = 0, vy0 = 0 } = {}) {
  return { x: x0, y: y0, vx: vx0, vy: vy0, E, B, q, m, t: 0, nSteps: 0 };
}

function deriv(s) {
  const qom = s.q / s.m;
  return {
    dx: s.vx,
    dy: s.vy,
    dvx: qom * (s.E + s.vy * s.B),
    dvy: qom * (-s.vx * s.B),
  };
}

export function stepExB(s, dt = 0.01) {
  function combine(s0, k, fac) {
    return { x: s0.x + fac * k.dx, y: s0.y + fac * k.dy, vx: s0.vx + fac * k.dvx, vy: s0.vy + fac * k.dvy, E: s0.E, B: s0.B, q: s0.q, m: s0.m };
  }
  const k1 = deriv(s);
  const k2 = deriv(combine(s, k1, dt / 2));
  const k3 = deriv(combine(s, k2, dt / 2));
  const k4 = deriv(combine(s, k3, dt));
  s.x += dt / 6 * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
  s.y += dt / 6 * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy);
  s.vx += dt / 6 * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx);
  s.vy += dt / 6 * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy);
  s.t += dt;
  s.nSteps += 1;
}

export function cyclotronPeriod(B, q = Q_DEFAULT, m = M_DEFAULT) {
  return 2 * Math.PI * m / (Math.abs(q) * Math.abs(B));
}

// Analytic solution for v(t) and r(t) for crossed E, B with v(0) = (vx0, vy0).
// omega = q B / m, drift = -E / B in y.
export function analyticState(s0, t) {
  const omega = (s0.q ?? Q_DEFAULT) * s0.B / (s0.m ?? M_DEFAULT);
  const driftY = -s0.E / s0.B;
  const vpx0 = s0.vx - 0;
  const vpy0 = s0.vy - driftY;
  const cos = Math.cos(omega * t), sin = Math.sin(omega * t);
  const vpx_t = cos * vpx0 + sin * vpy0;
  const vpy_t = -sin * vpx0 + cos * vpy0;
  const x_t = s0.x + (sin / omega) * vpx0 + ((1 - cos) / omega) * vpy0;
  const y_t = s0.y + driftY * t + (-(1 - cos) / omega) * vpx0 + (sin / omega) * vpy0;
  return { x: x_t, y: y_t, vx: vpx_t, vy: vpy_t + driftY };
}
