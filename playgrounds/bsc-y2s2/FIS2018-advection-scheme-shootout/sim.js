// sim.js
// 1D linear advection u_t + c u_x = 0 on a periodic domain. Four schemes:
//   1. FTCS  (Forward-Time Centered-Space): unconditionally unstable.
//   2. Upwind (first-order): TVD, dissipative.
//   3. Lax-Wendroff (LW, second-order): oscillates at shocks.
//   4. MacCormack (predictor-corrector second-order): like LW but a different
//      truncation error; behaves similarly on smooth advection.
//
// Reference: LeVeque 1992, Numerical Methods for Conservation Laws Ch. 9.
//
// We advect a square pulse with periodic BCs. Each scheme runs in its own
// state array so the user can compare side-by-side.

export const NX = 200;
export const X_MIN = 0;
export const X_MAX = 1;
export const DX = (X_MAX - X_MIN) / NX;

export function initSquare() {
  const u = new Float64Array(NX);
  for (let i = 0; i < NX; i += 1) {
    const x = X_MIN + (i + 0.5) * DX;
    u[i] = (x >= 0.30 && x <= 0.45) ? 1 : 0;
  }
  return u;
}

export function initGaussian({ x0 = 0.30, sigma = 0.05 } = {}) {
  const u = new Float64Array(NX);
  for (let i = 0; i < NX; i += 1) {
    const x = X_MIN + (i + 0.5) * DX;
    u[i] = Math.exp(-0.5 * ((x - x0) / sigma) ** 2);
  }
  return u;
}

export function exactSolution(u0, c, t) {
  // Periodic translation by c*t
  const out = new Float64Array(NX);
  const shift = c * t;
  for (let i = 0; i < NX; i += 1) {
    const xt = (X_MIN + (i + 0.5) * DX) - shift;
    // Wrap into [X_MIN, X_MAX)
    const wrap = (xt - X_MIN) % (X_MAX - X_MIN);
    const xMod = wrap >= 0 ? wrap + X_MIN : wrap + (X_MAX - X_MIN) + X_MIN;
    const j = Math.floor((xMod - X_MIN) / DX);
    out[i] = u0[Math.max(0, Math.min(NX - 1, j))];
  }
  return out;
}

function periodic(i) {
  if (i < 0) return i + NX;
  if (i >= NX) return i - NX;
  return i;
}

// FTCS: u^{n+1}_i = u^n_i - C/2 (u^n_{i+1} - u^n_{i-1}), C = c dt / dx.
export function stepFTCS(u, c, dt) {
  const C = c * dt / DX;
  const uNew = new Float64Array(NX);
  for (let i = 0; i < NX; i += 1) {
    uNew[i] = u[i] - 0.5 * C * (u[periodic(i + 1)] - u[periodic(i - 1)]);
  }
  u.set(uNew);
}

// Upwind: u^{n+1}_i = u^n_i - C (u^n_i - u^n_{i-1}) for c > 0.
export function stepUpwind(u, c, dt) {
  const C = c * dt / DX;
  const uNew = new Float64Array(NX);
  if (c >= 0) {
    for (let i = 0; i < NX; i += 1) {
      uNew[i] = u[i] - C * (u[i] - u[periodic(i - 1)]);
    }
  } else {
    for (let i = 0; i < NX; i += 1) {
      uNew[i] = u[i] - C * (u[periodic(i + 1)] - u[i]);
    }
  }
  u.set(uNew);
}

// Lax-Wendroff: u^{n+1}_i = u^n_i - C/2 (u^n_{i+1} - u^n_{i-1}) + C^2/2 (u^n_{i+1} - 2 u^n_i + u^n_{i-1}).
export function stepLaxWendroff(u, c, dt) {
  const C = c * dt / DX;
  const C2 = C * C;
  const uNew = new Float64Array(NX);
  for (let i = 0; i < NX; i += 1) {
    const uL = u[periodic(i - 1)], uR = u[periodic(i + 1)];
    uNew[i] = u[i] - 0.5 * C * (uR - uL) + 0.5 * C2 * (uR - 2 * u[i] + uL);
  }
  u.set(uNew);
}

// MacCormack: predictor + corrector.
// Predictor: u*_i = u_i - C (u_{i+1} - u_i)
// Corrector: u^{n+1}_i = 0.5 (u_i + u*_i) - 0.5 C (u*_i - u*_{i-1})
export function stepMacCormack(u, c, dt) {
  const C = c * dt / DX;
  const uStar = new Float64Array(NX);
  for (let i = 0; i < NX; i += 1) uStar[i] = u[i] - C * (u[periodic(i + 1)] - u[i]);
  const uNew = new Float64Array(NX);
  for (let i = 0; i < NX; i += 1) {
    uNew[i] = 0.5 * (u[i] + uStar[i]) - 0.5 * C * (uStar[i] - uStar[periodic(i - 1)]);
  }
  u.set(uNew);
}

export const SCHEMES = {
  ftcs:        { name: 'FTCS (unstable)',    step: stepFTCS },
  upwind:      { name: 'Upwind (1st order)', step: stepUpwind },
  laxwendroff: { name: 'Lax-Wendroff',       step: stepLaxWendroff },
  maccormack:  { name: 'MacCormack',         step: stepMacCormack },
};

// Total variation of u: sum_i |u_{i+1} - u_i|, used to check TVD property.
export function totalVariation(u) {
  let s = 0;
  for (let i = 0; i < NX; i += 1) s += Math.abs(u[periodic(i + 1)] - u[i]);
  return s;
}

export function l2Error(u, uExact) {
  let s = 0;
  for (let i = 0; i < NX; i += 1) s += (u[i] - uExact[i]) ** 2;
  return Math.sqrt(s * DX);
}
