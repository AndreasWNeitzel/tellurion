// sim.js
// Magnus effect: a spinning ball in flight experiences a lift force
// perpendicular to its velocity:
//   F_M = c_M (omega x v) m_ball
// (Schematic form; in detail F_M = rho * Gamma x v where Gamma is the
// circulation around the ball. For a 2D problem with spin about z, this
// reduces to a sideways acceleration proportional to v.)
//
// Plus gravity and optionally drag.
//
// Reference: Adair 1990, The Physics of Baseball (`adair1990`); Jackson
// EM Ch. 12 (Magnus force).

export const G = 9.81;
export const M_BALL = 0.15;        // 150 g baseball
export const C_DRAG = 0.005;       // small drag coefficient
export const C_MAG = 0.0003;        // Magnus coefficient

export function createBall({ v0 = 25, angleDeg = 20, spin = 50 } = {}) {
  const t = (angleDeg * Math.PI) / 180;
  return { x: 0, y: 0, vx: v0 * Math.cos(t), vy: v0 * Math.sin(t), spin, t: 0, nSteps: 0 };
}

function deriv(s) {
  const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  // Drag opposes velocity
  const dragX = -C_DRAG * speed * s.vx;
  const dragY = -C_DRAG * speed * s.vy;
  // Magnus: omega = (0, 0, spin) (spin about +z is top-spin viewed from above
  // for a horizontal axis-aligned spin convention). For 2D in xy plane:
  // F_M = c_mag spin * (-vy, vx)  (pushes perpendicular to velocity)
  // Convention: positive spin = top-spin = ball rotates in flight direction
  // (so top of ball moves forward). Magnus force pushes down.
  const magX =  C_MAG * s.spin * s.vy;
  const magY = -C_MAG * s.spin * s.vx;
  return {
    dx: s.vx,
    dy: s.vy,
    dvx: (dragX + magX) / M_BALL,
    dvy: (dragY + magY) / M_BALL - G,
  };
}

export function stepBall(s, dt = 0.005) {
  function combine(s0, k, fac) {
    return { x: s0.x + dt * fac * k.dx, y: s0.y + dt * fac * k.dy, vx: s0.vx + dt * fac * k.dvx, vy: s0.vy + dt * fac * k.dvy, spin: s0.spin };
  }
  const k1 = deriv(s);
  const k2 = deriv(combine(s, k1, 0.5));
  const k3 = deriv(combine(s, k2, 0.5));
  const k4 = deriv(combine(s, k3, 1.0));
  s.x  += dt / 6 * (k1.dx  + 2 * k2.dx  + 2 * k3.dx  + k4.dx);
  s.y  += dt / 6 * (k1.dy  + 2 * k2.dy  + 2 * k3.dy  + k4.dy);
  s.vx += dt / 6 * (k1.dvx + 2 * k2.dvx + 2 * k3.dvx + k4.dvx);
  s.vy += dt / 6 * (k1.dvy + 2 * k2.dvy + 2 * k3.dvy + k4.dvy);
  s.t += dt;
  s.nSteps += 1;
}

export function trajectory(opts) {
  const s = createBall(opts);
  const path = [{ x: s.x, y: s.y }];
  while (s.y >= 0 || s.t < 0.1) {
    stepBall(s, 0.005);
    path.push({ x: s.x, y: s.y });
    if (s.t > 30) break;
  }
  return path;
}
