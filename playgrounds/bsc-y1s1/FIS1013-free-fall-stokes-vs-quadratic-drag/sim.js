// sim.js
// Vertical free fall of a unit-mass particle under three drag laws:
//   1. No drag.            dv/dt = -g
//   2. Stokes (linear):    dv/dt = -g - b v        (v < 0 for falling)
//   3. Quadratic (Newton): dv/dt = -g - c |v| v
//
// Sign convention: y increases upward; v is dy/dt. The particle is
// released from rest at y = y_0 > 0 and falls to y = 0 (ground).
//
// Terminal velocity (magnitude, downward direction):
//   Stokes:    v_t = m g / b
//   Quadratic: v_t = sqrt(m g / c)
//
// Stokes vs quadratic crossover at velocity v_c where b v_c = c v_c^2,
// i.e. v_c = b / c.
//
// Reference: Marion-Thornton, Classical Dynamics 5e Ch. 2
// (`marion-thornton`).

export const G = 9.81;
export const M = 1.0;

export function createFall({ y0 = 100, b = 0.5, c = 0.05, mode = 'quadratic' } = {}) {
  return { y: y0, v: 0, t: 0, y0, b, c, mode, nSteps: 0 };
}

function accel(s) {
  if (s.mode === 'none')      return -G;
  if (s.mode === 'stokes')    return -G - s.b * s.v;
  // quadratic: opposite of motion direction
  return -G - s.c * Math.abs(s.v) * s.v;
}

// RK4 (good enough for a smooth ODE with no impulses; analytic terminal
// velocity is reproduced to better than 1e-6 at dt = 1e-3).
export function stepFall(s, dt = 0.01) {
  const f1 = { dv: accel(s), dy: s.v };
  const s2 = { ...s, y: s.y + 0.5 * dt * f1.dy, v: s.v + 0.5 * dt * f1.dv };
  const f2 = { dv: accel(s2), dy: s2.v };
  const s3 = { ...s, y: s.y + 0.5 * dt * f2.dy, v: s.v + 0.5 * dt * f2.dv };
  const f3 = { dv: accel(s3), dy: s3.v };
  const s4 = { ...s, y: s.y + dt * f3.dy, v: s.v + dt * f3.dv };
  const f4 = { dv: accel(s4), dy: s4.v };
  s.y += dt / 6 * (f1.dy + 2 * f2.dy + 2 * f3.dy + f4.dy);
  s.v += dt / 6 * (f1.dv + 2 * f2.dv + 2 * f3.dv + f4.dv);
  s.t += dt;
  s.nSteps += 1;
}

export function terminalVelocityStokes(b) { return M * G / b; }
export function terminalVelocityQuadratic(c) { return Math.sqrt(M * G / c); }

// Analytic vacuum fall: y(t) = y_0 - g t^2 / 2; v(t) = -g t.
export function analyticVacuum(t, y0) {
  return { y: y0 - 0.5 * G * t * t, v: -G * t };
}

// Analytic Stokes fall from rest: v(t) = -v_t (1 - exp(-b t / m)).
export function analyticStokesV(t, b) {
  const vt = terminalVelocityStokes(b);
  return -vt * (1 - Math.exp(-b * t / M));
}

// Crossover velocity above which quadratic drag dominates over Stokes.
export function crossoverV(b, c) { return b / c; }
