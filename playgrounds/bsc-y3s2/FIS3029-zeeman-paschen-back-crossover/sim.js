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

// Exact Zeeman -> Paschen-Back crossover for the hydrogen 2p multiplet
// (L = 1, S = 1/2). H = xi (L.S) + mu_B B (L_z + 2 S_z). The spin-orbit
// constant xi is fixed by the zero-field fine-structure splitting:
// E(j=3/2) - E(j=1/2) = (3/2) xi = FS_2P_eV, so xi = (2/3) FS_2P_eV.
// H is block-diagonal in m_J = m_L + m_S: two 1x1 blocks (|m_J| = 3/2)
// and two 2x2 blocks (|m_J| = 1/2), each solved in closed form. This is
// the 2p Breit-Rabi diagram; it reduces to g_J m_J mu_B B at small B and
// to (m_L + 2 m_S) mu_B B at large B, with the avoided crossings between.
export function zeeman2pLevels(B) {
  const xi = (2 / 3) * FS_2P_eV;
  const z = BOHR_MAGNETON_eV_T * B;
  // 1x1 blocks: |m_L=+1,m_S=+1/2> and |m_L=-1,m_S=-1/2>.
  const e_p32 = 0.5 * xi + 2 * z;       // m_J = +3/2
  const e_m32 = 0.5 * xi - 2 * z;       // m_J = -3/2
  // 2x2 block, m_J = +1/2, basis {|1,-1/2>, |0,+1/2>}.
  //   H = [[-xi/2, xi/sqrt2], [xi/sqrt2, z]].
  const off = xi / Math.SQRT2;
  const solve2 = (p, r) => {
    const m = 0.5 * (p + r);
    const d = 0.5 * Math.sqrt((p - r) * (p - r) + 4 * off * off);
    return [m - d, m + d];
  };
  const [e_p12_lo, e_p12_hi] = solve2(-0.5 * xi, z);
  // 2x2 block, m_J = -1/2, basis {|0,-1/2>, |-1,+1/2>}.
  //   H = [[-z, xi/sqrt2], [xi/sqrt2, -xi/2]].
  const [e_m12_lo, e_m12_hi] = solve2(-z, -0.5 * xi);
  return [
    { mJ: 1.5, E: e_p32, branch: 'hi' },
    { mJ: 0.5, E: e_p12_hi, branch: 'hi' },
    { mJ: 0.5, E: e_p12_lo, branch: 'lo' },
    { mJ: -0.5, E: e_m12_hi, branch: 'hi' },
    { mJ: -0.5, E: e_m12_lo, branch: 'lo' },
    { mJ: -1.5, E: e_m32, branch: 'lo' },
  ];
}
