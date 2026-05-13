// sim.js
// 2D Ising model on a triangular lattice with periodic boundary conditions.
// Each site holds a spin in {+1, -1}; energy E = -J sum_{<i,j>} s_i s_j with
// J = 1. The triangular lattice has 6 nearest neighbors per site.
//
// We use Metropolis single-spin flips: pick a random site, propose s -> -s,
// accept with min(1, exp(-beta dE)). Critical temperature for the 2D Ising
// on the triangular lattice is T_c = 4 / ln(3) ~ 3.6410 in units where J = 1.

import { makeRng } from '../../../shared/js/render/rng.js';

export const TC_ANALYTIC = 4 / Math.log(3);

// Triangular lattice neighbor offsets (axial coordinates on a hex grid
// embedded in a rectangular array). For an L x L array each row j has
// neighbors at columns i+/-1 in the same row, and depending on row parity
// the neighbors in row j+/-1 are at columns (i, i+1) for even j or
// (i-1, i) for odd j. Standard offset coordinate convention.
function neighborSum(spins, L, i, j) {
  const oddRow = (j & 1) === 1;
  // same row
  const iL = (i - 1 + L) % L;
  const iR = (i + 1) % L;
  // row above and below
  const jU = (j - 1 + L) % L;
  const jD = (j + 1) % L;
  let s = 0;
  s += spins[j * L + iL];
  s += spins[j * L + iR];
  if (oddRow) {
    s += spins[jU * L + iL];
    s += spins[jU * L + i];
    s += spins[jD * L + iL];
    s += spins[jD * L + i];
  } else {
    s += spins[jU * L + i];
    s += spins[jU * L + ((i + 1) % L)];
    s += spins[jD * L + i];
    s += spins[jD * L + ((i + 1) % L)];
  }
  return s;
}

export function createIsing({ L = 64, T = TC_ANALYTIC, seed = 0xC0FFEE, init = 'hot' } = {}) {
  const rng = makeRng(seed);
  const spins = new Int8Array(L * L);
  if (init === 'cold') {
    spins.fill(1);
  } else {
    for (let i = 0; i < spins.length; i += 1) spins[i] = rng() < 0.5 ? -1 : 1;
  }
  return { L, T, beta: 1 / T, spins, rng, accSteps: 0, totalAttempts: 0 };
}

// One Metropolis sweep = L*L attempted flips.
export function sweep(state, nSweeps = 1) {
  const { L, spins, rng } = state;
  const N = L * L;
  for (let s = 0; s < nSweeps; s += 1) {
    for (let k = 0; k < N; k += 1) {
      const r = Math.floor(rng() * N);
      const i = r % L, j = Math.floor(r / L);
      const sij = spins[j * L + i];
      const nb = neighborSum(spins, L, i, j);
      const dE = 2 * sij * nb;   // delta energy if we flip s_ij
      if (dE <= 0 || rng() < Math.exp(-state.beta * dE)) {
        spins[j * L + i] = -sij;
        state.accSteps += 1;
      }
      state.totalAttempts += 1;
    }
  }
}

// Magnetization per site m = (1/N) sum s_i.
export function magnetization(state) {
  let s = 0;
  for (let i = 0; i < state.spins.length; i += 1) s += state.spins[i];
  return s / state.spins.length;
}

// Energy per site e = -(J / N) sum_{<i,j>} s_i s_j, J = 1.
// Each bond counted once: triangular lattice has 3 bonds per site.
export function energyPerSite(state) {
  const { L, spins } = state;
  let bondSum = 0;
  for (let j = 0; j < L; j += 1) {
    const oddRow = (j & 1) === 1;
    for (let i = 0; i < L; i += 1) {
      const sij = spins[j * L + i];
      // right neighbor
      bondSum += sij * spins[j * L + ((i + 1) % L)];
      // down-right and down-left (depending on row parity)
      const jD = (j + 1) % L;
      if (oddRow) {
        bondSum += sij * spins[jD * L + ((i - 1 + L) % L)];
        bondSum += sij * spins[jD * L + i];
      } else {
        bondSum += sij * spins[jD * L + i];
        bondSum += sij * spins[jD * L + ((i + 1) % L)];
      }
    }
  }
  return -bondSum / (L * L);   // negative because E = -J sum
}

export function setTemperature(state, T) {
  state.T = T;
  state.beta = 1 / T;
}
