// sim.js
// Projectile motion with air drag in 2D. Three drag laws:
//   1. No drag (vacuum).
//   2. Stokes (linear in v): F = -b v.
//   3. Quadratic (Newtonian): F = -c |v| v.
//
// Reference: Marion and Thornton, Classical Dynamics 5e Ch. 2
// (`marion-thornton`).

export const G = 9.81;
export const M = 1.0;

export function createProjectile({ v0 = 20, angleDeg = 45, dragMode = 'none', b = 0.1, c = 0.01 } = {}) {
  const theta = (angleDeg * Math.PI) / 180;
  return {
    x: 0, y: 0,
    vx: v0 * Math.cos(theta), vy: v0 * Math.sin(theta),
    dragMode, b, c,
    t: 0, nSteps: 0,
  };
}

function dragForce(s) {
  const vmag = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
  if (s.dragMode === 'stokes')    return { fx: -s.b * s.vx,            fy: -s.b * s.vy };
  if (s.dragMode === 'quadratic') return { fx: -s.c * vmag * s.vx,     fy: -s.c * vmag * s.vy };
  return { fx: 0, fy: 0 };
}

function deriv(s) {
  const { fx, fy } = dragForce(s);
  return {
    dx: s.vx,
    dy: s.vy,
    dvx: fx / M,
    dvy: -G + fy / M,
  };
}

export function stepProjectile(s, dt = 0.01) {
  function combine(s0, k, fac) {
    return { x: s0.x + fac * k.dx, y: s0.y + fac * k.dy, vx: s0.vx + fac * k.dvx, vy: s0.vy + fac * k.dvy,
             dragMode: s0.dragMode, b: s0.b, c: s0.c };
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

// Analytic terminal velocity for free-falling case.
export function terminalVelocityStokes(b) { return M * G / b; }
export function terminalVelocityQuadratic(c) { return Math.sqrt(M * G / c); }

// Vacuum trajectory:
//   x(t) = v0 cos(theta) t
//   y(t) = v0 sin(theta) t - 0.5 g t^2
// Range R = v0^2 sin(2 theta) / g.
export function vacuumRange(v0, angleDeg) {
  const theta = (angleDeg * Math.PI) / 180;
  return v0 * v0 * Math.sin(2 * theta) / G;
}
export function vacuumPeak(v0, angleDeg) {
  const theta = (angleDeg * Math.PI) / 180;
  return v0 * v0 * Math.sin(theta) ** 2 / (2 * G);
}
