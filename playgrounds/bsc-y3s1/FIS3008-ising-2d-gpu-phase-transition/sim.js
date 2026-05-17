// 2D Ising phase transition. Thin analysis layer over the verified
// shared lattice-MC engine (shared/js/engine/lattice-mc.js): it adds
// the thermodynamic estimators measured along a run, the magnetic
// susceptibility and specific heat from fluctuations, and a
// magnetization-vs-temperature sweep, plus the Onsager exact
// reference. The Metropolis sweep, energy and magnetization live in
// the shared engine and are gate-tested in tests/engines. Reference:
// Onsager, Phys. Rev. 65, 117 (1944) (`onsager1944`); Newman and
// Barkema, Monte Carlo Methods in Statistical Physics, Ch. 3
// (`newman-barkema`).

import {
  create, step, diagnostics, snapshot, restore, seed,
  onsagerTc, onsagerM, energyPerSpin, magPerSpin,
} from '../../../shared/js/engine/lattice-mc.js';

export { create, step, diagnostics, snapshot, restore, seed, onsagerTc, onsagerM, energyPerSpin, magPerSpin };

// Average thermodynamic estimators over `meas` sweeps after `warm`
// thermalization sweeps. chi = N (<M^2> - <|M|>^2)/T (per-spin
// fluctuation), C = N (<E^2> - <E>^2)/T^2. Deterministic for a fixed
// seed because the engine RNG is seeded at create().
export function accumulate(inst, { warm = 800, meas = 600 } = {}) {
  step(inst, warm);
  const N = inst.L * inst.L;
  let sAbs = 0, sM2 = 0, sE = 0, sE2 = 0;
  for (let k = 0; k < meas; k += 1) {
    step(inst, 1);
    const m = magPerSpin(inst), e = energyPerSpin(inst);
    sAbs += Math.abs(m); sM2 += m * m; sE += e; sE2 += e * e;
  }
  const absM = sAbs / meas, m2 = sM2 / meas;
  const eMean = sE / meas, e2 = sE2 / meas;
  const T = inst.T;
  return {
    absM,
    E: eMean,
    chi: (N * (m2 - absM * absM)) / T,
    C: (N * (e2 - eMean * eMean)) / (T * T),
    T,
  };
}

// <|M|>(T) for an array of temperatures, each from a fresh seeded
// lattice. Used for the measured-vs-Onsager overlay and invariants.
export function magnetizationCurve(temps, { L = 32, seed: sd = 0xC0FFEE, warm = 800, meas = 400 } = {}) {
  const Tc = onsagerTc(1);
  return temps.map((T) => {
    const inst = create({ L, T, seed: sd, init: T < Tc ? 'up' : 'random' });
    return accumulate(inst, { warm, meas }).absM;
  });
}
