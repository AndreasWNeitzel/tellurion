// sim.js
// q-state Potts model on a 2D square lattice with periodic boundaries.
//
// Energy: E = -J sum_{<i,j>} delta(s_i, s_j) with J = 1 and s in {0, ..., q-1}.
// The transition from disorder to long-range order is:
//   q = 2: second-order, T_c = 2 / ln(1 + sqrt(2)) ~ 2.269 (this is the Ising
//          model with the conventional 1/2 factor absorbed).
//   q = 3, 4: second-order, T_c = 1 / ln(1 + sqrt(q)).
//   q >= 5: first-order, T_c = 1 / ln(1 + sqrt(q)). Latent heat at T_c.
//
// We use single-spin Metropolis: propose s -> uniform random in {0, ..., q-1}
// (Glauber-style proposal), accept with min(1, exp(-beta dE)). Slower than
// Wolff cluster moves near T_c but easy to reason about and to compare
// against scaling.
//
// Reference: Wu 1982, "The Potts model" Rev. Mod. Phys. 54.

import { makeRng } from '../../../shared/js/render/rng.js';

export function critTemperature(q) {
  return 1 / Math.log(1 + Math.sqrt(q));
}

export const Q_MIN = 2;
export const Q_MAX = 10;

export function createPotts({
  L = 64, q = 3, T = critTemperature(3), seed = 0xC0FFEE, init = 'hot',
} = {}) {
  const rng = makeRng(seed);
  const spins = new Int8Array(L * L);
  if (init === 'cold') {
    spins.fill(0);
  } else {
    for (let i = 0; i < spins.length; i += 1) spins[i] = Math.floor(rng() * q);
  }
  return { L, q, T, beta: 1 / T, spins, rng, accSteps: 0, totalAttempts: 0 };
}

function neighborMatches(spins, L, i, j, s) {
  const iL = (i - 1 + L) % L, iR = (i + 1) % L;
  const jU = (j - 1 + L) % L, jD = (j + 1) % L;
  let n = 0;
  if (spins[j * L + iL] === s) n += 1;
  if (spins[j * L + iR] === s) n += 1;
  if (spins[jU * L + i] === s) n += 1;
  if (spins[jD * L + i] === s) n += 1;
  return n;
}

// One sweep = L*L attempted updates.
export function sweep(state, nSweeps = 1) {
  const { L, q, spins, rng } = state;
  const N = L * L;
  for (let s = 0; s < nSweeps; s += 1) {
    for (let k = 0; k < N; k += 1) {
      const r = Math.floor(rng() * N);
      const i = r % L, j = Math.floor(r / L);
      const sOld = spins[j * L + i];
      let sNew = Math.floor(rng() * q);
      if (sNew === sOld) sNew = (sNew + 1) % q;
      const matchOld = neighborMatches(spins, L, i, j, sOld);
      const matchNew = neighborMatches(spins, L, i, j, sNew);
      const dE = -(matchNew - matchOld);
      if (dE <= 0 || rng() < Math.exp(-state.beta * dE)) {
        spins[j * L + i] = sNew;
        state.accSteps += 1;
      }
      state.totalAttempts += 1;
    }
  }
}

// Order parameter for Potts: M = (q max_s n_s - N) / ((q - 1) N) in [0, 1].
// n_s is the count of spins in state s.
export function orderParameter(state) {
  const { L, q, spins } = state;
  const counts = new Int32Array(q);
  for (let i = 0; i < spins.length; i += 1) counts[spins[i]] += 1;
  let nMax = 0;
  for (let s = 0; s < q; s += 1) if (counts[s] > nMax) nMax = counts[s];
  const N = L * L;
  return (q * nMax - N) / ((q - 1) * N);
}

// Energy per site.
export function energyPerSite(state) {
  const { L, spins } = state;
  let bondMatches = 0;
  for (let j = 0; j < L; j += 1) {
    const jD = (j + 1) % L;
    for (let i = 0; i < L; i += 1) {
      const sij = spins[j * L + i];
      const iR = (i + 1) % L;
      if (spins[j * L + iR] === sij) bondMatches += 1;
      if (spins[jD * L + i] === sij) bondMatches += 1;
    }
  }
  return -bondMatches / (L * L);
}

export function setTemperature(state, T) {
  state.T = T;
  state.beta = 1 / T;
}

export function setQ(state, q, seed = 0xC0FFEE) {
  state.q = q;
  state.rng = makeRng(seed);
  state.accSteps = 0; state.totalAttempts = 0;
  for (let i = 0; i < state.spins.length; i += 1) state.spins[i] = Math.floor(state.rng() * q);
}
