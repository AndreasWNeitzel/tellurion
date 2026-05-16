// sim.js
// A light ball levitated in a turbulent air jet (the classic "ball on a
// hair-dryer" demo). The jet issues from a nozzle along an axis that can
// be tilted; its centreline speed decays with distance and it spreads
// with a Gaussian cross-section. The ball feels gravity plus quadratic
// aerodynamic drag from the local air velocity:
//
//   F_drag = 0.5 rho C_d A |v_rel| v_rel,   v_rel = u_air - v_ball.
//
// Vertical balance sets the levitation height (drag = m g). Lateral
// stability is automatic: drift off-axis and the side nearer the fast
// core gets more drag, pushing the ball back. That restoring force is
// the everyday Bernoulli/entrainment effect.
//
// Reference: Massey, Mechanics of Fluids 9e, ch. 3 and ch. 8 (turbulent
// free jet); Tritton, Physical Fluid Dynamics 2e (`tritton`).

export const G = 9.81;          // m/s^2
export const RHO_AIR = 1.2;     // kg/m^3
export const CD = 0.47;         // sphere drag coefficient

export function createBlower({
  U0 = 18, tiltDeg = 0, ballR = 0.02, ballM = 0.0027,  // ~ table-tennis ball
  nozzle = { x: 0, y: 0 }, x0 = 0, y0 = 0.6, on = true,
} = {}) {
  return {
    U0, tiltDeg, ballR, ballM, nozzle, on,
    x: x0, y: y0, vx: 0, vy: 0, t: 0,
    w0: 0.035, spread: 0.13, coreLen: 0.55,
  };
}

// Jet axis unit vector (tilt measured from +y, toward +x).
function axis(s) {
  const a = (s.tiltDeg * Math.PI) / 180;
  return { ax: Math.sin(a), ay: Math.cos(a) };
}

// Air velocity vector at world point (x, y).
export function airVelocityAt(s, x, y) {
  if (!s.on) return { ux: 0, uy: 0, speed: 0 };
  const { ax, ay } = axis(s);
  const dx = x - s.nozzle.x, dy = y - s.nozzle.y;
  const sAxis = dx * ax + dy * ay;                 // distance along jet
  if (sAxis <= 0) return { ux: 0, uy: 0, speed: 0 };
  const rPerp = Math.abs(-dx * ay + dy * ax);      // perpendicular offset
  const wHalf = s.w0 + s.spread * sAxis;           // jet half-width grows
  const core = 1 / (1 + sAxis / s.coreLen);        // centreline decay
  const prof = Math.exp(-(rPerp * rPerp) / (wHalf * wHalf));
  const speed = s.U0 * core * prof;
  return { ux: speed * ax, uy: speed * ay, speed };
}

// Bernoulli restoring force: a finite sphere samples the jet velocity
// across its diameter. The side nearer the fast core sees higher speed
// and lower static pressure (p + 1/2 rho v^2 = const), so there is a
// net force toward the core, F ~ 1/2 rho A (v_in^2 - v_out^2). This is
// what makes the levitation laterally stable.
export function bernoulliLateral(s) {
  const a = (s.tiltDeg * Math.PI) / 180;
  // Perpendicular unit vector to the jet axis (points toward +x side).
  const px = Math.cos(a), py = -Math.sin(a);
  const vIn = airVelocityAt(s, s.x - px * s.ballR, s.y - py * s.ballR).speed;
  const vOut = airVelocityAt(s, s.x + px * s.ballR, s.y + py * s.ballR).speed;
  const A = Math.PI * s.ballR * s.ballR;
  const mag = 0.5 * RHO_AIR * A * (vIn * vIn - vOut * vOut);  // toward -p side
  return { fx: mag * (-px), fy: mag * (-py) };
}

// One semi-implicit Euler step. Quadratic sphere drag plus the
// Bernoulli cross-jet restoring force.
export function step(s, dt = 1 / 240) {
  const { ux, uy } = airVelocityAt(s, s.x, s.y);
  const rvx = ux - s.vx, rvy = uy - s.vy;
  const rel = Math.hypot(rvx, rvy);
  const A = Math.PI * s.ballR * s.ballR;
  const k = 0.5 * RHO_AIR * CD * A;
  const bl = bernoulliLateral(s);
  const Fx = k * rel * rvx + bl.fx;
  const Fy = k * rel * rvy + bl.fy - s.ballM * G;
  s.vx += (Fx / s.ballM) * dt;
  s.vy += (Fy / s.ballM) * dt;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  if (s.y < s.ballR) {                              // floor
    s.y = s.ballR; s.vy = Math.max(0, s.vy); s.vx *= 0.6;
  }
  s.t += dt;
}

// Levitation height on the jet axis: the y where upward drag from a
// still ball equals m g (bisection along the axis).
export function equilibriumHeight(s) {
  const { ax, ay } = axis(s);
  const A = Math.PI * s.ballR * s.ballR;
  const k = 0.5 * RHO_AIR * CD * A;
  const dragUpAt = (yy) => {
    const u = airVelocityAt(s, s.nozzle.x + ax * (yy - s.nozzle.y) / (ay || 1e-9), yy);
    // On-axis: v_rel = u (ball still); vertical drag component:
    return k * u.speed * u.uy;
  };
  let lo = s.nozzle.y + 1e-3, hi = s.nozzle.y + 5.0;
  const W = s.ballM * G;
  if (dragUpAt(lo) < W) return null;                // jet too weak
  for (let i = 0; i < 80; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (dragUpAt(mid) > W) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

export function diagnostics(s) {
  const yeq = equilibriumHeight(s);
  return {
    speed: Math.hypot(s.vx, s.vy),
    height: s.y - s.nozzle.y,
    yeq,
    offAxis: s.x - s.nozzle.x,
  };
}
