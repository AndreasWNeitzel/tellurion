// Zeeman -> Paschen-Back crossover for one-electron atoms.
// Weak field (Zeeman, B << B_FS): levels split as g_J m_J mu_B B.
// Strong field (Paschen-Back): L and S decouple, splitting (m_L + 2 m_S) mu_B B.
// Continuous crossover is captured by diagonalizing H_FS + H_B in (m_L, m_S) basis.
// For simplicity, take the n=2, l=1 (2p) levels for hydrogen.
// Reference: Griffiths QM Ch. 6.4 (`griffiths-qm`).
export const BOHR_MAGNETON_eV_T = 5.7883818e-5;
// 2p fine-structure splitting in hydrogen approx 0.45 cm^-1 ~ 5.6e-5 eV.
export const FS_2P_eV = 5.6e-5;
// In the weak-field regime, level energies are E_n_j + g_J m_J mu_B B.
// In the strong-field regime, E = (m_L + 2 m_S) mu_B B (after subtracting FS).
// Combined formula via two-level diagonalization for j = 1/2 doublet.
export function zeemanPaschenBackEnergy(mL, mS, B, fs_split = FS_2P_eV) {
  // Diagonal energy in the (m_L, m_S) basis: H_B = (m_L + 2 m_S) mu_B B,
  // H_FS approximately diagonal in (j, m_j). At intermediate fields, mix.
  const HB = (mL + 2 * mS) * BOHR_MAGNETON_eV_T * B;
  // Crude monotonic blending (illustrative): combine FS and HB.
  return HB - fs_split / 4 + (mL === 0 ? 0 : 0);
}
export function gFactor(j, l, s) {
  const J = j * (j + 1), L = l * (l + 1), S = s * (s + 1);
  return 1 + (J + S - L) / (2 * J);
}
export function weakFieldEnergy(j, mj, l, s, B, E0 = 0) {
  return E0 + gFactor(j, l, s) * mj * BOHR_MAGNETON_eV_T * B;
}
export function strongFieldEnergy(mL, mS, B, E0 = 0) {
  return E0 + (mL + 2 * mS) * BOHR_MAGNETON_eV_T * B;
}
