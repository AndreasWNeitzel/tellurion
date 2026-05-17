// shared/js/engine/lattice-mc.js
// 2D Ising model on an L x L periodic square lattice, single-spin
// Metropolis updates in checkerboard (red-black) order. Hamiltonian
//   H = -J sum_<ij> s_i s_j - h sum_i s_i,   s_i = +-1.
// One "step" is one full lattice sweep. Deterministic at a supplied
// seed (mulberry32 via rng.js). Exact references for verification:
//   T_c = 2 J / ln(1 + sqrt 2)               (Onsager 1944)
//   m(T) = [1 - sinh(2J/T)^{-4}]^{1/8},  T < T_c   (Yang 1952)
// so the magnetization exponent is beta = 1/8. Headless: no DOM, no
// window, no performance.now. API mirrors the other engines:
// create / step / diagnostics / snapshot / restore / seed.
// Reference: Newman and Barkema, Monte Carlo Methods in Statistical
// Physics, Ch. 3; Onsager, Phys. Rev. 65, 117 (1944).

import { makeRng } from '../render/rng.js';

export function onsagerTc(J = 1) { return (2 * J) / Math.log(1 + Math.SQRT2); }

// Exact spontaneous magnetization (zero field, infinite lattice).
export function onsagerM(T, J = 1) {
  const Tc = onsagerTc(J);
  if (T >= Tc) return 0;
  const s = Math.sinh(2 * J / T);
  const v = 1 - Math.pow(s, -4);
  return v <= 0 ? 0 : Math.pow(v, 1 / 8);
}

function idx(L, x, y) { return y * L + x; }

export function create({ L = 64, T = 2.5, J = 1, h = 0, seed = 0xC0FFEE, init = 'random' } = {}) {
  const rng = makeRng(seed);
  const s = new Int8Array(L * L);
  if (init === 'up') s.fill(1);
  else if (init === 'down') s.fill(-1);
  else for (let i = 0; i < s.length; i += 1) s[i] = rng() < 0.5 ? -1 : 1;
  return { L, T, J, h, s, rng, seed, sweeps: 0 };
}

export function seed(inst, n) { inst.rng = makeRng(n); inst.seed = n; }

// One Metropolis sweep over the whole lattice in checkerboard order
// (all (x+y) even sites, then all odd), which is exact for the Ising
// nearest-neighbour interaction because a sublattice's spins couple
// only to the other sublattice. `nSweeps` defaults to 1.
export function step(inst, nSweeps = 1) {
  const { L, J, h, s, rng } = inst;
  const T = inst.T;
  const beta = T > 0 ? 1 / T : Infinity;
  for (let sw = 0; sw < nSweeps; sw += 1) {
    for (let color = 0; color < 2; color += 1) {
      for (let y = 0; y < L; y += 1) {
        const ym = (y - 1 + L) % L, yp = (y + 1) % L;
        for (let x = 0; x < L; x += 1) {
          if (((x + y) & 1) !== color) continue;
          const xm = (x - 1 + L) % L, xp = (x + 1) % L;
          const si = s[idx(L, x, y)];
          const nb = s[idx(L, xm, y)] + s[idx(L, xp, y)] + s[idx(L, x, ym)] + s[idx(L, x, yp)];
          const dE = 2 * si * (J * nb + h);
          if (dE <= 0 || (T > 0 && rng() < Math.exp(-beta * dE))) s[idx(L, x, y)] = -si;
        }
      }
    }
    inst.sweeps += 1;
  }
}

// Energy per spin: -J sum over right and down bonds (each counted
// once) - h sum s, divided by N. Bounded in [-2J-|h|, 2J+|h|].
export function energyPerSpin(inst) {
  const { L, J, h, s } = inst;
  let bond = 0, mag = 0;
  for (let y = 0; y < L; y += 1) {
    const yp = (y + 1) % L;
    for (let x = 0; x < L; x += 1) {
      const si = s[idx(L, x, y)];
      bond += si * s[idx(L, (x + 1) % L, y)];
      bond += si * s[idx(L, x, yp)];
      mag += si;
    }
  }
  return (-J * bond - h * mag) / (L * L);
}

export function magPerSpin(inst) {
  let m = 0;
  for (let i = 0; i < inst.s.length; i += 1) m += inst.s[i];
  return m / inst.s.length;
}

export function diagnostics(inst) {
  const m = magPerSpin(inst);
  return {
    M: m,
    absM: Math.abs(m),
    E: energyPerSpin(inst),
    T: inst.T,
    sweeps: inst.sweeps,
  };
}

export function snapshot(inst) {
  return { L: inst.L, T: inst.T, J: inst.J, h: inst.h, seed: inst.seed, sweeps: inst.sweeps, s: Array.from(inst.s) };
}

export function restore(inst, snap) {
  inst.L = snap.L; inst.T = snap.T; inst.J = snap.J; inst.h = snap.h;
  inst.seed = snap.seed; inst.sweeps = snap.sweeps;
  inst.s = Int8Array.from(snap.s);
  return inst;
}
