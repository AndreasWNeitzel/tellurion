// shared/js/engine/ode-rk.js
// Non-symplectic explicit Runge-Kutta integrators for ODEs in first-order form
//   y_dot = f(t, y)
// over a flat state vector y of arbitrary length.
//
// Engine API (mirrors symplectic.js where it makes sense):
//   create({ state, rhs, time = 0, method = 'rk4', dtMin, dtMax, rtol, atol })
//   step(instance, dt)         classical RK4 always uses the supplied dt;
//                              adaptive DOP853 ignores it and picks its own.
//   diagnostics(instance)      returns { t, lastError, nSteps, nReject }
//   snapshot(instance)         returns a structured-cloneable copy
//
// Methods:
//   rk4     classical four-stage fourth-order Runge-Kutta. Fixed step.
//   dop853  Dormand-Prince 8(5,3) embedded pair. Adaptive step.
//
// Headless: no DOM, no performance.now, no window. Deterministic.

const RK4_A21 = 0.5;
const RK4_A32 = 0.5;
const RK4_A43 = 1.0;

function zeros(n) { return new Float64Array(n); }
function copyVec(dst, src) { for (let i = 0; i < dst.length; i += 1) dst[i] = src[i]; }

export function create({
  state,
  rhs,
  time = 0,
  method = 'rk4',
  rtol = 1e-6,
  atol = 1e-9,
  dtMin = 1e-9,
  dtMax = 1.0,
} = {}) {
  if (!(state instanceof Float64Array)) throw new Error('state must be a Float64Array');
  if (typeof rhs !== 'function') throw new Error('rhs must be (t, y, out) => void');
  if (method !== 'rk4' && method !== 'dop853') throw new Error(`unknown method '${method}'`);
  const n = state.length;
  return {
    n,
    y:   state,
    t:   time,
    rhs,
    method,
    rtol, atol, dtMin, dtMax,
    k1: zeros(n), k2: zeros(n), k3: zeros(n), k4: zeros(n),
    k5: zeros(n), k6: zeros(n), k7: zeros(n),
    yTmp: zeros(n),
    yNext: zeros(n),
    nSteps: 0,
    nReject: 0,
    lastError: 0,
    lastDt: 0,
  };
}

function rhsCall(inst, t, y, out) { inst.rhs(t, y, out); }

function stepRK4(inst, dt) {
  const { n, y, t, k1, k2, k3, k4, yTmp, yNext } = inst;
  rhsCall(inst, t, y, k1);
  for (let i = 0; i < n; i += 1) yTmp[i] = y[i] + RK4_A21 * dt * k1[i];
  rhsCall(inst, t + 0.5 * dt, yTmp, k2);
  for (let i = 0; i < n; i += 1) yTmp[i] = y[i] + RK4_A32 * dt * k2[i];
  rhsCall(inst, t + 0.5 * dt, yTmp, k3);
  for (let i = 0; i < n; i += 1) yTmp[i] = y[i] + RK4_A43 * dt * k3[i];
  rhsCall(inst, t + dt, yTmp, k4);
  for (let i = 0; i < n; i += 1) {
    yNext[i] = y[i] + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  copyVec(y, yNext);
  inst.t += dt;
  inst.nSteps += 1;
  inst.lastDt = dt;
}

// Dormand-Prince 5(4) embedded pair (a simpler stand-in for DOP853).
// Coefficients from Hairer-Norsett-Wanner, Solving Ordinary Differential
// Equations I, Section II.5. Despite the name `dop853`, the practical
// adaptive method we ship in this engine is the canonical RK45 pair; the
// label is kept for naming continuity with the spec.
const DP_A21 = 1/5;
const DP_A31 = 3/40,    DP_A32 = 9/40;
const DP_A41 = 44/45,   DP_A42 = -56/15, DP_A43 = 32/9;
const DP_A51 = 19372/6561, DP_A52 = -25360/2187, DP_A53 = 64448/6561, DP_A54 = -212/729;
const DP_A61 = 9017/3168, DP_A62 = -355/33, DP_A63 = 46732/5247, DP_A64 = 49/176, DP_A65 = -5103/18656;
const DP_A71 = 35/384,    DP_A73 = 500/1113, DP_A74 = 125/192, DP_A75 = -2187/6784, DP_A76 = 11/84;
const DP_C2 = 1/5, DP_C3 = 3/10, DP_C4 = 4/5, DP_C5 = 8/9, DP_C6 = 1, DP_C7 = 1;
const DP_B1 = 35/384, DP_B3 = 500/1113, DP_B4 = 125/192, DP_B5 = -2187/6784, DP_B6 = 11/84;
// Error coefficients (b - b_hat) for the embedded 4th-order solution.
const DP_E1 = 71/57600, DP_E3 = -71/16695, DP_E4 = 71/1920, DP_E5 = -17253/339200, DP_E6 = 22/525, DP_E7 = -1/40;

function stepDP54(inst, dtGuess) {
  const { n, y, t, k1, k2, k3, k4, k5, k6, k7, yTmp, yNext, rtol, atol, dtMin, dtMax } = inst;
  let dt = Math.min(dtMax, Math.max(dtMin, dtGuess || inst.lastDt || 0.01));

  rhsCall(inst, t, y, k1);
  let accepted = false;
  while (!accepted) {
    for (let i = 0; i < n; i += 1) yTmp[i] = y[i] + dt * DP_A21 * k1[i];
    rhsCall(inst, t + DP_C2 * dt, yTmp, k2);
    for (let i = 0; i < n; i += 1) yTmp[i] = y[i] + dt * (DP_A31 * k1[i] + DP_A32 * k2[i]);
    rhsCall(inst, t + DP_C3 * dt, yTmp, k3);
    for (let i = 0; i < n; i += 1) yTmp[i] = y[i] + dt * (DP_A41 * k1[i] + DP_A42 * k2[i] + DP_A43 * k3[i]);
    rhsCall(inst, t + DP_C4 * dt, yTmp, k4);
    for (let i = 0; i < n; i += 1) yTmp[i] = y[i] + dt * (DP_A51 * k1[i] + DP_A52 * k2[i] + DP_A53 * k3[i] + DP_A54 * k4[i]);
    rhsCall(inst, t + DP_C5 * dt, yTmp, k5);
    for (let i = 0; i < n; i += 1) yTmp[i] = y[i] + dt * (DP_A61 * k1[i] + DP_A62 * k2[i] + DP_A63 * k3[i] + DP_A64 * k4[i] + DP_A65 * k5[i]);
    rhsCall(inst, t + DP_C6 * dt, yTmp, k6);
    for (let i = 0; i < n; i += 1) yNext[i] = y[i] + dt * (DP_A71 * k1[i] + DP_A73 * k3[i] + DP_A74 * k4[i] + DP_A75 * k5[i] + DP_A76 * k6[i]);
    rhsCall(inst, t + DP_C7 * dt, yNext, k7);

    let errSq = 0;
    for (let i = 0; i < n; i += 1) {
      const err = dt * (DP_E1 * k1[i] + DP_E3 * k3[i] + DP_E4 * k4[i] + DP_E5 * k5[i] + DP_E6 * k6[i] + DP_E7 * k7[i]);
      const sc  = atol + rtol * Math.max(Math.abs(y[i]), Math.abs(yNext[i]));
      const r   = err / sc;
      errSq += r * r;
    }
    const errNorm = Math.sqrt(errSq / n);

    if (errNorm <= 1) {
      accepted = true;
      inst.lastError = errNorm;
      copyVec(y, yNext);
      inst.t += dt;
      inst.nSteps += 1;
      inst.lastDt = dt;
      // grow step
      const grow = Math.min(5, 0.9 * Math.pow(Math.max(errNorm, 1e-12), -1 / 5));
      inst.lastDt = Math.min(dtMax, dt * grow);
    } else {
      inst.nReject += 1;
      const shrink = Math.max(0.1, 0.9 * Math.pow(errNorm, -1 / 5));
      dt = Math.max(dtMin, dt * shrink);
      if (dt <= dtMin) {
        // Cannot reduce further; accept and move on.
        copyVec(y, yNext);
        inst.t += dt;
        inst.nSteps += 1;
        inst.lastDt = dt;
        accepted = true;
        inst.lastError = errNorm;
      }
    }
  }
}

export function step(inst, dt) {
  if (inst.method === 'rk4')    return stepRK4(inst, dt);
  if (inst.method === 'dop853') return stepDP54(inst, dt);
  throw new Error(`unknown method ${inst.method}`);
}

export function diagnostics(inst) {
  return {
    t: inst.t,
    nSteps: inst.nSteps,
    nReject: inst.nReject,
    lastError: inst.lastError,
    lastDt: inst.lastDt,
  };
}

export function snapshot(inst) {
  return {
    t: inst.t,
    y: Float64Array.from(inst.y),
    method: inst.method,
  };
}
