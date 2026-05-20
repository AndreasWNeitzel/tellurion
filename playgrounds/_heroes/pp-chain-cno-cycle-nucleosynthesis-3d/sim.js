// Headless physics for the pp-chain vs CNO-cycle hero. At solar core
// temperatures (T ~ 1.5e7 K) the pp chain produces almost all the
// energy; above ~ 2e7 K the steeply temperature-dependent CNO cycle
// takes over. Both net reactions are 4 H -> He4 + 26.73 MeV.
//
// Bahcall and Ulmer ApJ 412 (1993) 749 give the empirical
// approximations
//   e_pp(T)  ~ T7^4
//   e_CNO(T) ~ T7^17   (steep!)
// where T7 = T / 10^7 K. The cross-over temperature where they are
// equal is ~ 1.8e7 K. The Sun, at T_core ~ 1.55e7 K, runs about 99%
// pp; an O-star at T_core ~ 3.5e7 K runs essentially 100% CNO.
//
// References: Bahcall, Neutrino Astrophysics, CUP 1989, Ch. 3
// (`bahcall-neutrino-astrophysics`); Kippenhahn, Weigert and Weiss,
// Stellar Structure and Evolution, 2nd ed., Springer 2012, Ch. 18
// (`kippenhahn-stellar-structure`).

// Temperature in code units of 10^7 K. Solar core ~ 1.55.
export function T7FromKelvin(TK) { return TK / 1e7; }

// pp-chain specific energy generation rate (arbitrary normalization).
export function epsilonPP(T7) {
  if (T7 <= 0) return 0;
  return Math.pow(T7, 4);
}

// CNO cycle specific energy generation rate.
export function epsilonCNO(T7) {
  if (T7 <= 0) return 0;
  return Math.pow(T7, 17);
}

// Cross-over temperature where pp = CNO. Set the normalizations so
// the Sun (T7 = 1.55) is at 99% pp.
// epsilonPP(1.55) * A_pp == 0.99 * (epsilonPP * A_pp + epsilonCNO * A_CNO)
// at T7 = 1.55 => A_CNO / A_pp = 0.01 * (1.55)^4 / (0.99 * (1.55)^17)
//                              = 0.01 / 0.99 / (1.55)^13.
const T7_SOLAR = 1.55;
export const A_PP = 1.0;
export const A_CNO = A_PP * (0.01 / 0.99) / Math.pow(T7_SOLAR, 13);

// Cross-over T where pp = CNO.
export const T7_CROSSOVER = Math.pow(A_PP / A_CNO, 1 / 13);

// Total energy rate.
export function epsilonTotal(T7) {
  return A_PP * epsilonPP(T7) + A_CNO * epsilonCNO(T7);
}

// Fraction of energy from CNO at temperature T7.
export function ppFraction(T7) {
  const e_pp = A_PP * epsilonPP(T7);
  const e_cno = A_CNO * epsilonCNO(T7);
  return e_pp / Math.max(1e-30, e_pp + e_cno);
}
export function cnoFraction(T7) { return 1 - ppFraction(T7); }

// Q-value: net energy released per net 4H -> He4 reaction (MeV).
export const Q_HELIUM = 26.73;

// Useful canonical stellar interiors:
//   Sun core: T7 = 1.55, n_pp / n_total ~ 0.985 (10% lost to neutrinos)
//   F-star core: T7 = 1.9
//   A-star core: T7 = 2.5
//   B/O core:  T7 > 3.0
export const PRESETS = {
  M_dwarf: 0.8,
  Sun: 1.55,
  F_star: 1.9,
  A_star: 2.5,
  O_star: 3.5,
};
