// sim.js
// Van der Pol oscillator:
//
//   x'' - mu (1 - x^2) x' + x = 0
//
// or as a 2D system with v = x':
//
//   x' = v
//   v' = mu (1 - x^2) v - x
//
// Small mu (~0.5): near-harmonic limit cycle with small distortion.
// Large mu (~5): relaxation oscillator with two characteristic phases.
// The limit cycle is unique and globally attracting.
//
// Reference: Strogatz, Nonlinear Dynamics and Chaos Ch. 7 (`strogatz`).

export function createVdP({ mu = 1.0, x0 = 1.5, v0 = 0 } = {}) {
  return { x: x0, v: v0, mu, t: 0, nSteps: 0 };
}

function deriv(s) {
  return {
    dx: s.v,
    dv: s.mu * (1 - s.x * s.x) * s.v - s.x,
  };
}

export function stepVdP(s, dt = 0.01) {
  function combine(s0, k, fac) {
    return { x: s0.x + fac * k.dx, v: s0.v + fac * k.dv, mu: s0.mu };
  }
  const k1 = deriv(s);
  const k2 = deriv(combine(s, k1, dt / 2));
  const k3 = deriv(combine(s, k2, dt / 2));
  const k4 = deriv(combine(s, k3, dt));
  s.x += dt / 6 * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx);
  s.v += dt / 6 * (k1.dv + 2 * k2.dv + 2 * k3.dv + k4.dv);
  s.t += dt;
  s.nSteps += 1;
}

// Asymptotic period for the relaxation regime (Strogatz 7.5):
//   T_rel approx (3 - 2 ln 2) mu approx 1.614 mu for mu >> 1.
// For mu << 1: T = 2 pi (1 + mu^2 / 16 + ...).
export function asymptoticPeriod(mu) {
  return (3 - 2 * Math.log(2)) * mu;
}
