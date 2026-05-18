// Ionization-chamber dosimetry: photons Compton-scatter in the cavity,
// the recoil electrons ionize the gas, the ion pairs drift to the
// electrodes under the collecting voltage, and the collected charge
// gives the dose through D = (Q/m)(W/e), converted to medium dose by
// the Bragg-Gray relation. Boag recombination sets the saturation
// curve. ICRU Report 90; Boag 1950; Attix 1986. Deterministic.
import { makeRng } from '../../../shared/js/render/rng.js';

export const W_AIR = 33.97;                              // eV per ion pair (ICRU 90)
export const W_OVER_E = 33.97;                           // J / C (W_air / e)
export const QE = 1.602176634e-19;                       // C
const MEC2 = 510.999;                                    // keV

// Dose to the cavity gas from the collected charge (Gy):
//   D_gas = (Q / m) (W / e),  Q in C, m in kg.
export const doseGas = (Q, m) => (Q / m) * W_OVER_E;
// Bragg-Gray: medium dose = gas dose times the stopping-power ratio.
export const braggGray = (Dgas, sRatio) => Dgas * sRatio;

// Ionization is energy-conserving: n_pairs * W = E_deposited.
export const nIonPairs = (EdepEV) => EdepEV / W_AIR;
export const chargeFromEnergy = (EdepEV) => nIonPairs(EdepEV) * QE;

// Boag collection efficiency for continuous radiation:
//   f = 1 / (1 + xi^2 / 6),  xi = K d^2 sqrt(doseRate) / V,
// so f -> 1 (saturation) as the collecting voltage V rises.
const BOAG_K = 24;                                       // bundled chamber/gas constant
export function boagXi(V, doseRate, d) {
  return BOAG_K * d * d * Math.sqrt(Math.max(0, doseRate)) / Math.max(1e-6, V);
}
export function collectionEfficiency(V, doseRate = 1, d = 1) {
  const xi = boagXi(V, doseRate, d);
  return 1 / (1 + xi * xi / 6);
}

// Compton recoil-electron energy (keV) from one event by Kahn sampling
// of the Klein-Nishina distribution; T = E - E'.
export function comptonRecoil(EkeV, rng) {
  const a = EkeV / MEC2;
  for (let i = 0; i < 1000; i += 1) {
    const r1 = rng(), r2 = rng(), r3 = rng();
    if (r1 <= (1 + 2 * a) / (9 + 2 * a)) {
      const eps = 1 + 2 * a * r2;
      const t = (2 / a) * (1 - 1 / eps);
      if (r3 <= 1 - eps * (1 - t) / (1 + eps * eps)) return EkeV - EkeV / eps;
    } else {
      const eps = (1 + 2 * a) / (1 + 2 * a * r2);
      const ct = 1 - (1 / a) * (eps - 1);
      if (r3 <= 0.5 * (ct * ct + 1 / eps)) return EkeV - EkeV / eps;
    }
  }
  return EkeV * 0.5;
}

// Run an ionization-chamber exposure. nPhot photons of energy E0 (keV)
// Compton-interact in a cavity of mass m (kg) at collecting voltage V;
// the recoil electrons make ion pairs (E/W), a fraction f are collected
// (Boag), and the dose is reported for the gas and the medium.
export function runChamber({
  E0 = 100, nPhot = 4000, V = 300, m = 1.3e-6, sRatio = 1.13,
  doseRate = 1, d = 1, seed = 0xC0FFEE, recordPairs = 0,
} = {}) {
  const rng = makeRng(seed);
  let Edep = 0;
  const pairs = [];
  for (let p = 0; p < nPhot; p += 1) {
    const T = Math.max(0, comptonRecoil(E0, rng));        // keV deposited in the gas
    Edep += T * 1000;                                     // to eV
    if (pairs.length < recordPairs) {
      const np = Math.max(1, Math.round(T * 1000 / W_AIR / 50));
      for (let k = 0; k < np && pairs.length < recordPairs; k += 1) {
        pairs.push({ x: rng(), y: rng(), sign: rng() < 0.5 ? 1 : -1 });
      }
    }
  }
  const f = collectionEfficiency(V, doseRate, d);
  const Qcreated = chargeFromEnergy(Edep);
  const Qcollected = Qcreated * f;
  const Dg = doseGas(Qcollected, m);
  const Dmed = braggGray(Dg, sRatio);
  return {
    Edep, nPairs: nIonPairs(Edep), Qcreated, Qcollected, f,
    Dgas: Dg, Dmed, V, E0, m, sRatio, pairs, recombinationLoss: 1 - f,
  };
}

// Saturation curve: collected/created charge ratio versus voltage.
export function saturationCurve(vMin, vMax, n, doseRate = 1, d = 1) {
  const Vs = new Float64Array(n + 1), fs = new Float64Array(n + 1);
  for (let i = 0; i <= n; i += 1) {
    const V = vMin * Math.pow(vMax / vMin, i / n);
    Vs[i] = V; fs[i] = collectionEfficiency(V, doseRate, d);
  }
  return { V: Vs, f: fs };
}
