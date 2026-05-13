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

export const Q = 1.0;
export const M = 1.0;

export function driftVelocity(E, B) {
  // E in +x, B in +z: E x B = (E, 0, 0) x (0, 0, B) = (0, -E B, 0)
  // Then divided by B^2: drift = (0, -E / B, 0). But the standard E x B / B^2
  // formula gives drift along E x B direction which is -y. So drift = -E / B
  // in y. We'll write drift as positive number representing magnitude.
  // For clarity, we expose drift = {vx: 0, vy: -E / B} when E in +x, B in +z.
  return { vx: 0, vy: -E / B };
}

export function createExB({ E = 0.5, B = 1.0, x0 = 0, y0 = 0, vx0 = 0, vy0 = 0 } = {}) {
  return { x: x0, y: y0, vx: vx0, vy: vy0, E, B, t: 0, nSteps: 0 };
}

function deriv(s) {
  // a = (q/m) (E_x, 0) + (q/m) v x B,
  // v x B for B = B z-hat is (vy * B, -vx * B, 0).
  // So a_x = (q/m)(E + vy B), a_y = (q/m)(-vx B).
  return {
    dx: s.vx,
    dy: s.vy,
    dvx: (Q / M) * (s.E + s.vy * s.B),
    dvy: (Q / M) * (-s.vx * s.B),
  };
}

export function stepExB(s, dt = 0.01) {
  function combine(s0, k, fac) {
    return { x: s0.x + fac * k.dx, y: s0.y + fac * k.dy, vx: s0.vx + fac * k.dvx, vy: s0.vy + fac * k.dvy, E: s0.E, B: s0.B };
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

export function cyclotronPeriod(B) { return 2 * Math.PI * M / (Q * Math.abs(B)); }

// Analytic solution for v(t) and r(t) for crossed E, B with v(0) = (vx0, vy0)
// in the drift decomposition. Let omega = q B / m, drift = -E / B in y.
// In the drifting frame v' = v - drift, so v_perp' rotates at -omega.
// We export the analytic position and velocity to compare.
export function analyticState(s0, t) {
  const omega = Q * s0.B / M;
  const driftY = -s0.E / s0.B;
  const vpx0 = s0.vx - 0;
  const vpy0 = s0.vy - driftY;
  // Rotating: v_prime(t) = R(-omega t) v_prime(0). For B z-hat, the rotation
  // is clockwise (in xy plane); position obtained by integrating.
  const cos = Math.cos(omega * t), sin = Math.sin(omega * t);
  const vpx_t = cos * vpx0 + sin * vpy0;
  const vpy_t = -sin * vpx0 + cos * vpy0;
  // Position: x(t) = x0 + integral vx dt; vx = drift_x + vpx_t = 0 + vpx_t.
  // integral cos(omega t) = sin / omega, integral sin = -cos / omega + 1/omega.
  const x_t = s0.x + (sin / omega) * vpx0 + ((1 - cos) / omega) * vpy0;
  // y(t) = y0 + drift y * t + integral vpy_t.
  const y_t = s0.y + driftY * t + (-(1 - cos) / omega) * vpx0 + (sin / omega) * vpy0;
  return { x: x_t, y: y_t, vx: vpx_t, vy: vpy_t + driftY };
}
