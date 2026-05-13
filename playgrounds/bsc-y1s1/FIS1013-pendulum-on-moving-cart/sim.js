// sim.js
// Pendulum on a frictionless moving cart. Generalized coordinates:
//   q1 = x_cart (cart position)
//   q2 = theta  (pendulum angle from vertical, positive CCW)
//
// Cart mass M, pendulum bob mass m, pendulum length L, gravity g.
//
// Lagrangian: T = (1/2) (M + m) x'^2 + (1/2) m L^2 theta'^2 + m L cos(theta) x' theta'
//             V = -m g L cos(theta)
//
// Equations of motion (Marion-Thornton Ch. 7, `marion-thornton`):
//   (M + m) x'' + m L cos(theta) theta'' - m L sin(theta) theta'^2 = 0
//   L theta'' + cos(theta) x'' + g sin(theta) = 0
//
// Solve the 2x2 linear system for [x'', theta''] each step.

export const M_CART = 2.0;
export const M_BOB  = 0.5;
export const L_PEN  = 1.0;
export const G_GRAV = 9.81;

export function createCart({ x = 0, theta = 0.8, xdot = 0, thetadot = 0 } = {}) {
  return { x, theta, xdot, thetadot, t: 0, nSteps: 0 };
}

function accelerations(s) {
  const c = Math.cos(s.theta), si = Math.sin(s.theta);
  // (M+m) x'' + m L c th'' = m L si th'^2
  // c x'' + L th'' = -g si
  // Matrix A * [x'', th''] = b:
  const a11 = M_CART + M_BOB, a12 = M_BOB * L_PEN * c;
  const a21 = c,              a22 = L_PEN;
  const b1 = M_BOB * L_PEN * si * s.thetadot * s.thetadot;
  const b2 = -G_GRAV * si;
  const det = a11 * a22 - a12 * a21;
  const xdd = (b1 * a22 - b2 * a12) / det;
  const tdd = (a11 * b2 - a21 * b1) / det;
  return { xdd, tdd };
}

function deriv(s) {
  const { xdd, tdd } = accelerations(s);
  return { dx: s.xdot, dth: s.thetadot, dxdot: xdd, dtdot: tdd };
}

export function stepCart(s, dt = 0.005) {
  function combine(s0, k, fac) {
    return { x: s0.x + dt * fac * k.dx, theta: s0.theta + dt * fac * k.dth,
             xdot: s0.xdot + dt * fac * k.dxdot, thetadot: s0.thetadot + dt * fac * k.dtdot };
  }
  const k1 = deriv(s);
  const k2 = deriv(combine(s, k1, 0.5));
  const k3 = deriv(combine(s, k2, 0.5));
  const k4 = deriv(combine(s, k3, 1.0));
  s.x         += dt / 6 * (k1.dx     + 2 * k2.dx     + 2 * k3.dx     + k4.dx);
  s.theta     += dt / 6 * (k1.dth    + 2 * k2.dth    + 2 * k3.dth    + k4.dth);
  s.xdot      += dt / 6 * (k1.dxdot  + 2 * k2.dxdot  + 2 * k3.dxdot  + k4.dxdot);
  s.thetadot  += dt / 6 * (k1.dtdot  + 2 * k2.dtdot  + 2 * k3.dtdot  + k4.dtdot);
  s.t += dt;
  s.nSteps += 1;
}

export function energy(s) {
  const KE = 0.5 * (M_CART + M_BOB) * s.xdot * s.xdot
           + 0.5 * M_BOB * L_PEN * L_PEN * s.thetadot * s.thetadot
           + M_BOB * L_PEN * Math.cos(s.theta) * s.xdot * s.thetadot;
  const PE = -M_BOB * G_GRAV * L_PEN * Math.cos(s.theta);
  return KE + PE;
}

// Total horizontal momentum: should be conserved (no external horizontal force).
export function horizontalMomentum(s) {
  const c = Math.cos(s.theta);
  return (M_CART + M_BOB) * s.xdot + M_BOB * L_PEN * c * s.thetadot;
}
