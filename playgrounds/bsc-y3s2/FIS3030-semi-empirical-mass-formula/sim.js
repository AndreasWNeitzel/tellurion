// sim.js
// Bethe-Weizsacker semi-empirical mass formula for nuclear binding
// energy:
//
//   B(A, Z) = a_V A - a_S A^(2/3) - a_C Z(Z-1)/A^(1/3) - a_A (N-Z)^2/A + delta
//
// where N = A - Z and the pairing term delta is
//   +a_P/A^(1/2) for even-even,
//    0           for odd A,
//   -a_P/A^(1/2) for odd-odd.
//
// Standard 1995 Wapstra coefficients (MeV):
//   a_V = 15.8, a_S = 18.3, a_C = 0.714, a_A = 23.2, a_P = 12.0.
//
// Reference: Krane, Introductory Nuclear Physics Ch. 3 (`krane-nuclear`).

export const COEFFS = {
  aV: 15.8,
  aS: 18.3,
  aC: 0.714,
  aA: 23.2,
  aP: 12.0,
};

export function pairing(A, Z) {
  const N = A - Z;
  const evenA = (A % 2) === 0;
  const evenZ = (Z % 2) === 0;
  const evenN = (N % 2) === 0;
  if (!evenA) return 0;                  // odd A
  if (evenZ && evenN) return  COEFFS.aP / Math.sqrt(A);
  if (!evenZ && !evenN) return -COEFFS.aP / Math.sqrt(A);
  return 0;
}

export function bindingEnergyMeV(A, Z) {
  const N = A - Z;
  const volume    =  COEFFS.aV * A;
  const surface   = -COEFFS.aS * Math.pow(A, 2 / 3);
  const coulomb   = -COEFFS.aC * Z * (Z - 1) / Math.pow(A, 1 / 3);
  const asymmetry = -COEFFS.aA * (N - Z) * (N - Z) / A;
  const pair      =  pairing(A, Z);
  return volume + surface + coulomb + asymmetry + pair;
}

export function bindingPerNucleon(A, Z) {
  return bindingEnergyMeV(A, Z) / A;
}

// For a given A, find the most-bound (optimal) Z by minimum-mass
// argument: maximize B(A, Z). For the SEMF the optimum is
//   Z* = A (a_A + a_C / 4 A^(1/3)) / (2 a_A + a_C A^(2/3)/2)... but the
// cleanest form is from dB/dZ = 0:
//   Z* = A / (2 + 0.5 a_C A^(2/3) / a_A)
// approximately.
export function optimalZ(A) {
  const denom = 2 + 0.5 * COEFFS.aC * Math.pow(A, 2 / 3) / COEFFS.aA;
  return A / denom;
}

// Maximum binding energy per nucleon is roughly 8.79 MeV at A ~ 62 (Fe-62 / Ni-62).
export function bindingProfile() {
  const out = [];
  for (let A = 1; A <= 250; A += 1) {
    const Z = Math.round(optimalZ(A));
    const Bperonu = bindingPerNucleon(A, Z);
    out.push({ A, Z, BperA: Bperonu });
  }
  return out;
}
