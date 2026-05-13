// sim.js
// 1D time-dependent Schrodinger equation with Crank-Nicolson time stepping.
// Norm-preserving, second-order accurate in dt and dx.
//
//   i hbar d psi / dt = -(hbar^2 / 2 m) psi'' + V(x) psi.
//
// Code units: hbar = m = 1. The CN scheme:
//   (I + i dt H / 2) psi^{n+1} = (I - i dt H / 2) psi^n
// solved by Thomas tridiagonal on a real-imaginary block.
//
// We send a Gaussian wavepacket from x_0 with momentum k_0 toward a
// rectangular barrier of height V_0 and width a centered at x = 0. Live
// observables: integral |psi|^2 = 1 conserved per step, reflection and
// transmission probabilities computed at the snapshot.
//
// Reference: Newman 2013, Computational Physics Ch. 9 Ex. 9.8.

import { tridiagonalSolveComplex } from '../../../shared/js/engine/cn-tridiag.js';

export const N_GRID = 800;
export const X_MIN = -40;
export const X_MAX = +40;
export const DX = (X_MAX - X_MIN) / (N_GRID - 1);

export function initWavepacket({ x0 = -15, k0 = 2.0, sigma = 1.5 } = {}) {
  const psiRe = new Float64Array(N_GRID);
  const psiIm = new Float64Array(N_GRID);
  let norm = 0;
  for (let i = 0; i < N_GRID; i += 1) {
    const x = X_MIN + i * DX;
    const env = Math.exp(-0.25 * (x - x0) * (x - x0) / (sigma * sigma));
    psiRe[i] = env * Math.cos(k0 * x);
    psiIm[i] = env * Math.sin(k0 * x);
    norm += psiRe[i] * psiRe[i] + psiIm[i] * psiIm[i];
  }
  norm = Math.sqrt(norm * DX);
  for (let i = 0; i < N_GRID; i += 1) { psiRe[i] /= norm; psiIm[i] /= norm; }
  return { psiRe, psiIm };
}

export function makePotential({ V0 = 4.0, barrierA = 2.0, kind = 'barrier' } = {}) {
  const V = new Float64Array(N_GRID);
  for (let i = 0; i < N_GRID; i += 1) {
    const x = X_MIN + i * DX;
    if (kind === 'barrier') {
      V[i] = Math.abs(x) < barrierA / 2 ? V0 : 0;
    } else if (kind === 'step') {
      V[i] = x > 0 ? V0 : 0;
    } else if (kind === 'well') {
      V[i] = Math.abs(x) < barrierA / 2 ? -V0 : 0;
    } else {
      V[i] = 0;
    }
  }
  return V;
}

export function createTDSE({ x0, k0, sigma, V0, barrierA, kind, dt = 0.05 } = {}) {
  const wave = initWavepacket({ x0, k0, sigma });
  const V = makePotential({ V0, barrierA, kind });
  return {
    psiRe: wave.psiRe,
    psiIm: wave.psiIm,
    V,
    dt,
    t: 0,
    nSteps: 0,
    V0, barrierA, kind,
  };
}

// Crank-Nicolson step. H = -1/(2 dx^2) (psi_{i+1} - 2 psi_i + psi_{i-1}) + V_i psi_i.
// We solve the tridiagonal complex system A psi^{n+1} = B psi^n where
//   A_{i,i}     = 1 + i dt/2 (1/dx^2 + V_i)
//   A_{i,i+/-1} = -i dt/4 / dx^2
//   B similarly with opposite signs on the imaginary parts.
//
// Hard wall (psi = 0) boundary at i = 0 and i = N-1.

const _aRe = new Float64Array(N_GRID), _aIm = new Float64Array(N_GRID);
const _bRe = new Float64Array(N_GRID), _bIm = new Float64Array(N_GRID);
const _cRe = new Float64Array(N_GRID), _cIm = new Float64Array(N_GRID);
const _dRe = new Float64Array(N_GRID), _dIm = new Float64Array(N_GRID);

export function stepCN(state) {
  const { psiRe, psiIm, V, dt } = state;
  const r = dt / (4 * DX * DX);   // factor in off-diagonal
  // Build tridiagonal A and rhs d (complex).
  for (let i = 0; i < N_GRID; i += 1) {
    // diagonal: 1 + i dt/2 (1/dx^2 + V_i)  -> (1 - dt/2 V_i, dt/2 (1/dx^2 + V_i))... wait,
    // we work with complex i so let me state more carefully.
    // A_{ii} = 1 + i (dt/2)(2 r * 2 dx^2 / dt + V_i)... easier to write differently:
    //   H psi at i = -(1/(2 dx^2)) (psi_{i+1} - 2 psi_i + psi_{i-1}) + V_i psi_i
    //              = (2 r * 2) (...)  hmm.
    // Let p = dt / (2 dx^2), q_i = dt V_i / 2. Then
    //   A psi_{i+1}:  i (-p/2) psi_{i+1}  + (1 + i (p + q_i)) psi_i + i (-p/2) psi_{i-1} = rhs
    // RHS: (1 - i (p + q_i)) psi^n_i - i (-p/2) (psi^n_{i+1} + psi^n_{i-1})
    //    = (1 - i (p + q_i)) psi^n_i + i (p/2) (psi^n_{i+1} + psi^n_{i-1})
    const p = dt / (2 * DX * DX);
    const q = 0.5 * dt * V[i];
    // off-diagonal a (lower) and c (upper); both -i p/2.
    _aRe[i] = 0; _aIm[i] = -p / 2;
    _cRe[i] = 0; _cIm[i] = -p / 2;
    // diagonal b: 1 + i (p + q)
    _bRe[i] = 1; _bIm[i] = p + q;
    // RHS d = (1 - i (p + q)) psi_i + i (p/2) (psi_{i-1} + psi_{i+1})
    const psiL_re = i > 0 ? psiRe[i - 1] : 0;
    const psiL_im = i > 0 ? psiIm[i - 1] : 0;
    const psiR_re = i < N_GRID - 1 ? psiRe[i + 1] : 0;
    const psiR_im = i < N_GRID - 1 ? psiIm[i + 1] : 0;
    // 1 - i(p+q) times psi
    // real part: 1*psiRe - (-(p+q)) * psiIm = psiRe + (p+q) psiIm. Wait:
    // (a + bi)(c + di) = (ac - bd) + (ad + bc)i. Here a = 1, b = -(p+q), c = psiRe, d = psiIm.
    // real: 1*psiRe - (-(p+q))*psiIm = psiRe + (p+q) psiIm
    // imag: 1*psiIm + (-(p+q))*psiRe = psiIm - (p+q) psiRe
    const t1Re = psiRe[i] + (p + q) * psiIm[i];
    const t1Im = psiIm[i] - (p + q) * psiRe[i];
    // i (p/2) (psiL + psiR): (0 + (p/2)i)(re + im i) = -(p/2) im + (p/2) re i
    const sumRe = psiL_re + psiR_re;
    const sumIm = psiL_im + psiR_im;
    const t2Re = -(p / 2) * sumIm;
    const t2Im = (p / 2) * sumRe;
    _dRe[i] = t1Re + t2Re;
    _dIm[i] = t1Im + t2Im;
  }
  // Hard-wall boundaries: psi_0 = psi_{N-1} = 0 enforced by clamping.
  // The tridiagonal solver expects standard Thomas form; we'll fix endpoints.
  _aRe[0] = 0; _aIm[0] = 0;
  _cRe[N_GRID - 1] = 0; _cIm[N_GRID - 1] = 0;
  tridiagonalSolveComplex(_aRe, _aIm, _bRe, _bIm, _cRe, _cIm, _dRe, _dIm, psiRe, psiIm, N_GRID);
  // Enforce hard wall
  psiRe[0] = 0; psiIm[0] = 0;
  psiRe[N_GRID - 1] = 0; psiIm[N_GRID - 1] = 0;
  state.t += dt;
  state.nSteps += 1;
}

export function probabilityDensity(state) {
  const p = new Float64Array(N_GRID);
  for (let i = 0; i < N_GRID; i += 1) p[i] = state.psiRe[i] ** 2 + state.psiIm[i] ** 2;
  return p;
}

export function totalNorm(state) {
  let s = 0;
  for (let i = 0; i < N_GRID; i += 1) s += state.psiRe[i] ** 2 + state.psiIm[i] ** 2;
  return s * DX;
}

// Reflection and transmission: fraction of |psi|^2 to the left and right of
// the barrier centerline (x = 0).
export function reflectionTransmission(state) {
  let r = 0, t = 0;
  const center = Math.floor((0 - X_MIN) / DX);
  for (let i = 0; i < center; i += 1) r += state.psiRe[i] ** 2 + state.psiIm[i] ** 2;
  for (let i = center; i < N_GRID; i += 1) t += state.psiRe[i] ** 2 + state.psiIm[i] ** 2;
  return { R: r * DX, T: t * DX };
}
