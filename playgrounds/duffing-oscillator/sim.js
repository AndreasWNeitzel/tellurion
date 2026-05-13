// sim.js
// Driven, damped Duffing oscillator with a double-well potential:
//
//   x'' + delta x' - x + x^3 = gamma cos(omega t)
//
// Equivalent first-order system y = (x, v):
//
//   dx/dt = v
//   dv/dt = x - x^3 - delta v + gamma cos(omega t)
//
// At fixed delta = 0.3, omega = 1.2, the parameter gamma controls a route
// to chaos via period-doubling. The classic chaotic value is gamma = 0.5;
// period-1, period-2, period-4 cycles are visible for smaller gamma.
//
// Wraps shared/js/engine/ode-rk.js.

import { create as engineCreate, step as engineStep } from '../../shared/js/engine/ode-rk.js';

export const DEFAULT_DT = 0.01;
export const DEFAULT_PARAMS = { delta: 0.3, gamma: 0.5, omega: 1.2 };

export function makeDuffingRhs({ delta, gamma, omega }) {
  return function rhs(t, y, out) {
    out[0] = y[1];
    out[1] = y[0] - y[0] * y[0] * y[0] - delta * y[1] + gamma * Math.cos(omega * t);
  };
}

export function createDuffing({ params = DEFAULT_PARAMS, ic = [0.1, 0], dt = DEFAULT_DT, method = 'rk4' } = {}) {
  const state = Float64Array.from([ic[0], ic[1]]);
  const inst = engineCreate({ state, rhs: makeDuffingRhs(params), method });
  return { inst, params, dt };
}

export function rebuildRhs(duf, params) {
  duf.params = params;
  duf.inst.rhs = makeDuffingRhs(params);
}

export function stepDuffing(duf) {
  engineStep(duf.inst, duf.dt);
}

// Build a bifurcation diagram in gamma. For each gamma value, integrate to
// drop transients, then sample the stroboscopic Poincare section (one point
// per drive period T = 2 pi / omega) for nSamples cycles. Returns
// { gammas, sections } where sections[i] is an array of nSamples x values.
export function bifurcationGamma({
  gammas, omega = 1.2, delta = 0.3, nTransient = 200, nSamples = 60, stepsPerPeriod = 200, ic = [0.1, 0],
} = {}) {
  const sections = new Array(gammas.length);
  for (let i = 0; i < gammas.length; i += 1) {
    const gamma = gammas[i];
    const duf = createDuffing({ params: { delta, gamma, omega }, ic, dt: (2 * Math.PI / omega) / stepsPerPeriod });
    for (let p = 0; p < nTransient; p += 1) {
      for (let s = 0; s < stepsPerPeriod; s += 1) stepDuffing(duf);
    }
    const xs = new Float64Array(nSamples);
    for (let p = 0; p < nSamples; p += 1) {
      for (let s = 0; s < stepsPerPeriod; s += 1) stepDuffing(duf);
      xs[p] = duf.inst.y[0];
    }
    sections[i] = xs;
  }
  return { gammas, sections };
}

export function duffingEnergy(y) {
  const x = y[0], v = y[1];
  return 0.5 * v * v - 0.5 * x * x + 0.25 * x * x * x * x;
}
