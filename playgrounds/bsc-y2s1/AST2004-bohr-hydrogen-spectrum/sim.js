// sim.js
// Hydrogen energy levels and emission spectrum from the Bohr model.
//
// E_n = -E_R / n^2 with E_R = 13.605693 eV (Rydberg energy).
// Emission wavelength for an n_high -> n_low transition:
//
//   1 / lambda = R_inf (1/n_low^2 - 1/n_high^2)
//
// with R_inf = 1.0973731568e7 / m (Rydberg constant).
//
// Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics
// 2e Ch. 5 (`carroll-ostlie`).

export const E_R = 13.605693;        // eV (infinite-mass Rydberg energy)
// Hydrogen Rydberg constant (proton mass correction folded in):
// R_H = R_inf * m_p / (m_e + m_p) = 1.09677583e7 / m.
// Using R_H gives observed Lyman alpha = 121.567 nm and Balmer alpha = 656.279 nm.
export const R_H_INV_NM = 1.09677583e-2; // 1/nm
export const R_INF_INV_NM = R_H_INV_NM;   // exported alias for back-compat

export const SERIES = [
  { name: 'Lyman',    nLow: 1, color: '#a78bfa' }, // UV
  { name: 'Balmer',   nLow: 2, color: '#5bc0eb' }, // visible
  { name: 'Paschen',  nLow: 3, color: '#f4a261' }, // near IR
  { name: 'Brackett', nLow: 4, color: '#ef476f' }, // mid IR
  { name: 'Pfund',    nLow: 5, color: '#06d6a0' }, // far IR
];

export function level(n) {
  return -E_R / (n * n);
}

export function wavelengthNm(nLow, nHigh) {
  const inv = R_INF_INV_NM * (1 / (nLow * nLow) - 1 / (nHigh * nHigh));
  return 1 / inv;
}

export function photonEnergyEv(nLow, nHigh) {
  return level(nHigh) - level(nLow); // negative if absorption
}

// Series limit: nHigh -> infinity.
export function seriesLimitNm(nLow) {
  return 1 / (R_INF_INV_NM / (nLow * nLow));
}

// Standard set of lines for visualization: each series up to nMax.
export function buildLines(nMax = 8) {
  const out = [];
  for (const s of SERIES) {
    for (let nh = s.nLow + 1; nh <= nMax; nh += 1) {
      out.push({
        series: s.name,
        color: s.color,
        nLow: s.nLow,
        nHigh: nh,
        lambdaNm: wavelengthNm(s.nLow, nh),
      });
    }
  }
  return out;
}
