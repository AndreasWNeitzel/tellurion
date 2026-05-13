// sim.js
// Antiferromagnetic (AF) Ising on a triangular lattice. Each site has spin
// in {+1, -1}; energy E = +J sum_{<i,j>} s_i s_j (note the +sign: AF
// energetically prefers anti-aligned neighbors). On the triangular lattice
// every plaquette is a 3-cycle: you cannot anti-align all three pairs at
// once. The system is geometrically frustrated.
//
// Famous result: the 2D AF Ising on triangular lattice has NO phase
// transition at finite T; ground-state entropy is extensive (Wannier 1950).
//
// Reference: Wannier 1950, Phys. Rev. 79, 357; Newman and Barkema 1999,
// Section 5.4 (`newmanbarkema1999`).

import { makeRng } from '../../../shared/js/render/rng.js';

export const J_AF = 1.0;

function neighborSum(spins, L, i, j) {
  const oddRow = (j & 1) === 1;
  const iL = (i - 1 + L) % L;
  const iR = (i + 1) % L;
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

export function createAF({ L = 64, T = 0.5, seed = 0xC0FFEE, init = 'hot' } = {}) {
  const rng = makeRng(seed);
  const spins = new Int8Array(L * L);
  if (init === 'cold') {
    // Stripe pattern: rows alternate (still frustrated but locally low E)
    for (let j = 0; j < L; j += 1) {
      for (let i = 0; i < L; i += 1) {
        spins[j * L + i] = ((i + j) & 1) === 0 ? 1 : -1;
      }
    }
  } else {
    for (let i = 0; i < spins.length; i += 1) spins[i] = rng() < 0.5 ? -1 : 1;
  }
  return { L, T, beta: 1 / T, spins, rng, accSteps: 0, totalAttempts: 0 };
}

export function sweep(state, nSweeps = 1) {
  const { L, spins, rng } = state;
  const N = L * L;
  for (let s = 0; s < nSweeps; s += 1) {
    for (let k = 0; k < N; k += 1) {
      const r = Math.floor(rng() * N);
      const i = r % L, j = Math.floor(r / L);
      const sij = spins[j * L + i];
      const nb = neighborSum(spins, L, i, j);
      // AF: E = +J sum s_i s_j; flipping s_ij changes E by -2 J s_ij nb (sign flipped vs FM).
      const dE = -2 * J_AF * sij * nb;
      if (dE <= 0 || rng() < Math.exp(-state.beta * dE)) {
        spins[j * L + i] = -sij;
        state.accSteps += 1;
      }
      state.totalAttempts += 1;
    }
  }
}

export function magnetization(state) {
  let s = 0;
  for (let i = 0; i < state.spins.length; i += 1) s += state.spins[i];
  return s / state.spins.length;
}

export function energyPerSite(state) {
  // E_total = +J sum_{<i,j>} s_i s_j; on triangular lattice 3 bonds per site.
  const { L, spins } = state;
  let bondSum = 0;
  for (let j = 0; j < L; j += 1) {
    const oddRow = (j & 1) === 1;
    for (let i = 0; i < L; i += 1) {
      const sij = spins[j * L + i];
      bondSum += sij * spins[j * L + ((i + 1) % L)];
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
  return +J_AF * bondSum / (L * L);  // note + sign: AF convention
}

// Count frustrated triangular plaquettes: a triangle is frustrated if all
// three spins are equal. (Or 3 mismatch... in AF, "frustrated" means at
// least one pair must be aligned. Specifically: in a triangle of 3 spins
// with AF coupling, the energy minimum is +1 (one aligned pair, two
// anti-aligned). So count plaquettes with exactly 2 aligned pairs.)
//
// Simpler measure: the fraction of plaquettes that are NOT all-aligned
// in 3 (which is the worst case). Let's just count "ferromagnetic"
// plaquettes (all 3 same) since those are the worst.
export function frustratedFraction(state) {
  const { L, spins } = state;
  let same3 = 0, total = 0;
  for (let j = 0; j < L; j += 1) {
    const oddRow = (j & 1) === 1;
    const jD = (j + 1) % L;
    for (let i = 0; i < L; i += 1) {
      const a = spins[j * L + i];
      const b = spins[j * L + ((i + 1) % L)];
      const c = oddRow ? spins[jD * L + i] : spins[jD * L + i];
      // Triangle (a, b, c)
      if (a === b && b === c) same3 += 1;
      total += 1;
    }
  }
  return same3 / total;
}

export function setTemperature(state, T) {
  state.T = T;
  state.beta = 1 / T;
}
