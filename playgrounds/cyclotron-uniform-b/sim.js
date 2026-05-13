// sim.js
// Charged particle in a uniform magnetic field B = B z-hat. With initial
// velocity v_perp (in xy-plane) and v_par (along z), the motion in xy is
// a circle of radius r = m v_perp / (q B) at angular frequency
// omega_c = q B / m. Period T_c = 2 pi m / (q B).
//
// We work in 2D (z component dropped). Trajectory is a circle.
//
// Reference: Jackson, Classical Electrodynamics Ch. 12.

export const Q = 1.0;
export const M = 1.0;

export function cyclotronOmega(B) { return Q * B / M; }
export function cyclotronRadius(v, B) { return M * v / (Q * Math.abs(B)); }
export function cyclotronPeriod(B) { return 2 * Math.PI * M / (Q * Math.abs(B)); }

export function createCyclotron({ B = 1.0, v = 1.0, x0 = 0, y0 = 0, vx0 = null, vy0 = null } = {}) {
  // If vx0, vy0 not provided, set vx = 0, vy = v (counter-clockwise circle for B > 0).
  if (vx0 === null) vx0 = 0;
  if (vy0 === null) vy0 = v;
  return { x: x0, y: y0, vx: vx0, vy: vy0, B, t: 0, nSteps: 0 };
}

// 4th-order Runge-Kutta for d2 r / dt^2 = (q / m) v x B = (qB/m) (vy, -vx).
function deriv(state) {
  const omega = Q * state.B / M;
  return {
    dx: state.vx,
    dy: state.vy,
    dvx: omega * state.vy,
    dvy: -omega * state.vx,
  };
}

export function stepCyclotron(s, dt = 0.01) {
  function combine(s0, k, fac) {
    return { x: s0.x + fac * k.dx, y: s0.y + fac * k.dy, vx: s0.vx + fac * k.dvx, vy: s0.vy + fac * k.dvy, B: s0.B };
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

export function speed(s) { return Math.sqrt(s.vx * s.vx + s.vy * s.vy); }
