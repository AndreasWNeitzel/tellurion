// sim.js
// Classical 2D XY model on a square lattice. Each site has a continuous
// angle theta in [0, 2 pi). Energy:
//   E = -J sum_{<i,j>} cos(theta_i - theta_j),  J = 1.
//
// The model has a Berezinskii-Kosterlitz-Thouless (BKT) transition at
//   T_BKT ~ 0.893 J / k_B   (Hasenbusch 2005, Phys. Rev. B 71, 094507).
// Below T_BKT the system has algebraic (power-law) order with bound vortex
// pairs; above T_BKT free vortex unbinding destroys order.
//
// We use single-spin Metropolis with uniform-random proposed delta-theta in
// [-pi, +pi]. Vortex detection by plaquette winding number.
//
// Reference: Kosterlitz and Thouless 1973, J. Phys. C 6, 1181; Newman and
// Barkema 1999, Section 5.5.

import { makeRng } from '../../shared/js/render/rng.js';

export const T_BKT = 0.893;
const TWO_PI = 2 * Math.PI;

export function createXY({ L = 64, T = 0.7, seed = 0xC0FFEE, init = 'hot' } = {}) {
  const rng = makeRng(seed);
  const theta = new Float64Array(L * L);
  if (init === 'cold') {
    // all aligned at theta = 0
  } else {
    for (let i = 0; i < theta.length; i += 1) theta[i] = rng() * TWO_PI;
  }
  return { L, T, beta: 1 / T, theta, rng, accSteps: 0, totalAttempts: 0 };
}

function neighborEnergy(theta, L, i, j) {
  const k = j * L + i;
  const iL = (i - 1 + L) % L;
  const iR = (i + 1) % L;
  const jU = (j - 1 + L) % L;
  const jD = (j + 1) % L;
  return -(Math.cos(theta[k] - theta[j * L + iL]) +
           Math.cos(theta[k] - theta[j * L + iR]) +
           Math.cos(theta[k] - theta[jU * L + i]) +
           Math.cos(theta[k] - theta[jD * L + i]));
}

export function sweep(state, nSweeps = 1) {
  const { L, theta, rng } = state;
  const N = L * L;
  for (let s = 0; s < nSweeps; s += 1) {
    for (let k = 0; k < N; k += 1) {
      const r = Math.floor(rng() * N);
      const i = r % L, j = Math.floor(r / L);
      const oldTheta = theta[j * L + i];
      const eOld = neighborEnergy(theta, L, i, j);
      const newTheta = (oldTheta + (rng() - 0.5) * TWO_PI + TWO_PI) % TWO_PI;
      theta[j * L + i] = newTheta;
      const eNew = neighborEnergy(theta, L, i, j);
      const dE = eNew - eOld;
      if (dE <= 0 || rng() < Math.exp(-state.beta * dE)) {
        state.accSteps += 1;
      } else {
        theta[j * L + i] = oldTheta;
      }
      state.totalAttempts += 1;
    }
  }
}

export function magnetization(state) {
  let mx = 0, my = 0;
  for (let i = 0; i < state.theta.length; i += 1) {
    mx += Math.cos(state.theta[i]);
    my += Math.sin(state.theta[i]);
  }
  const N = state.theta.length;
  return Math.hypot(mx, my) / N;
}

export function energyPerSite(state) {
  const { L, theta } = state;
  let sumBond = 0;
  for (let j = 0; j < L; j += 1) {
    for (let i = 0; i < L; i += 1) {
      const k = j * L + i;
      const iR = (i + 1) % L;
      const jD = (j + 1) % L;
      sumBond += Math.cos(theta[k] - theta[j * L + iR]);
      sumBond += Math.cos(theta[k] - theta[jD * L + i]);
    }
  }
  return -sumBond / (L * L);
}

// Mod 2 pi into (-pi, pi]
function wrap(x) {
  let y = x % TWO_PI;
  if (y > Math.PI) y -= TWO_PI;
  if (y <= -Math.PI) y += TWO_PI;
  return y;
}

// Vortex winding around each plaquette (sum of wrap(theta_{i+1} - theta_i) around the 4 corners).
// Result is +/- 2 pi for a vortex/antivortex, 0 otherwise.
export function vortexMap(state) {
  const { L, theta } = state;
  const v = new Int8Array(L * L);    // -1, 0, +1 per plaquette anchored at (i, j)
  let nPlus = 0, nMinus = 0;
  for (let j = 0; j < L; j += 1) {
    const jD = (j + 1) % L;
    for (let i = 0; i < L; i += 1) {
      const iR = (i + 1) % L;
      const t1 = theta[j * L + i];
      const t2 = theta[j * L + iR];
      const t3 = theta[jD * L + iR];
      const t4 = theta[jD * L + i];
      const sum = wrap(t2 - t1) + wrap(t3 - t2) + wrap(t4 - t3) + wrap(t1 - t4);
      let charge = 0;
      if (sum > 5.5) charge = 1;     // +2 pi
      else if (sum < -5.5) charge = -1;
      v[j * L + i] = charge;
      if (charge === 1) nPlus += 1;
      if (charge === -1) nMinus += 1;
    }
  }
  return { v, nPlus, nMinus };
}

export function setTemperature(state, T) {
  state.T = T;
  state.beta = 1 / T;
}
