// sim.js
// FitzHugh-Nagumo (FHN) reduced neuron model:
//   v' = v - v^3 / 3 - w + I
//   w' = epsilon (v + a - b w)
//
// with a = 0.7, b = 0.8, epsilon = 0.08 by default. v is the fast voltage
// variable; w is the slow recovery. I is an external input current.
//
// Behavior depends on I:
//   I = 0: stable rest state (excitable). Small perturbations decay; large
//          perturbations trigger one spike before returning to rest.
//   I above threshold (around 0.4): Hopf bifurcation; system oscillates
//          periodically.
//
// Reference: FitzHugh 1961 Biophys J; Nagumo, Arimoto, Yoshizawa 1962
// (`fitzhugh-nagumo1961`).

export const A_FN = 0.7;
export const B_FN = 0.8;
export const EPS_FN = 0.08;

export function createFHN({ v = -1.2, w = -0.6, I = 0 } = {}) {
  return { v, w, I, t: 0, nSteps: 0 };
}

function deriv(s) {
  return {
    dv: s.v - s.v ** 3 / 3 - s.w + s.I,
    dw: EPS_FN * (s.v + A_FN - B_FN * s.w),
  };
}

export function stepFHN(s, dt = 0.05) {
  function combine(s0, k, fac) {
    return { v: s0.v + dt * fac * k.dv, w: s0.w + dt * fac * k.dw, I: s0.I };
  }
  const k1 = deriv(s);
  const k2 = deriv(combine(s, k1, 0.5));
  const k3 = deriv(combine(s, k2, 0.5));
  const k4 = deriv(combine(s, k3, 1.0));
  s.v += dt / 6 * (k1.dv + 2 * k2.dv + 2 * k3.dv + k4.dv);
  s.w += dt / 6 * (k1.dw + 2 * k2.dw + 2 * k3.dw + k4.dw);
  s.t += dt;
  s.nSteps += 1;
}

// Rest state: solve v - v^3/3 - w + I = 0 and v + a - b w = 0.
//   w = (v + a) / b
//   v - v^3/3 - (v + a) / b + I = 0
// For I = 0 this gives v_rest approx -1.199 and w_rest approx -0.624.
export function restState(I = 0) {
  // Newton's method.
  let v = -1.2;
  for (let i = 0; i < 20; i += 1) {
    const w = (v + A_FN) / B_FN;
    const f = v - v * v * v / 3 - w + I;
    const fp = 1 - v * v - 1 / B_FN;
    v -= f / fp;
  }
  const w = (v + A_FN) / B_FN;
  return { v, w };
}
