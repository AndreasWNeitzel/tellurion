// Radioactive decay and the semi-empirical mass formula. Binding
// energy (MeV) from Bethe-Weizsaecker:
//   B = aV A - aS A^2/3 - aC Z(Z-1)/A^1/3 - aA (A-2Z)^2/A + delta.
// Decay modes shift (Z, N): alpha (-2,-2)+He4; beta- (+1,-1)+e-nu;
// beta+ (-1,+1)+e+nu; gamma (0,0)+photon. Q values follow from the
// binding energies and the neutron/hydrogen mass difference. Alpha
// half-lives follow the Geiger-Nuttall law log10 t = a Zd/sqrt(Q) - b.
// Headless and deterministic. Reference: Krane, Introductory Nuclear
// Physics, Ch. 3 (mass formula), Ch. 6-8 (alpha/beta/gamma).

const aV = 15.75, aS = 17.8, aC = 0.711, aA = 23.7, aP = 11.18;
const B_ALPHA = 28.295;                 // He-4 binding energy (MeV)
const DM_NH = 0.782;                    // (m_n - m_H) c^2 (MeV), for beta-

export function semf(A, Z) {
  if (A <= 0 || Z < 0 || Z > A) return 0;
  const N = A - Z;
  let B = aV * A - aS * Math.pow(A, 2 / 3) - aC * Z * (Z - 1) / Math.cbrt(A) - aA * (A - 2 * Z) ** 2 / A;
  const evenZ = Z % 2 === 0, evenN = N % 2 === 0;
  if (evenZ && evenN) B += aP / Math.sqrt(A);
  else if (!evenZ && !evenN) B -= aP / Math.sqrt(A);
  return B;
}

export function bindingPerA(A, Z) { return semf(A, Z) / A; }

export const MODES = ['alpha', 'beta-minus', 'beta-plus', 'gamma'];

export function decay(mode, Z, N) {
  if (mode === 'alpha') return { Z: Z - 2, N: N - 2, emit: { name: 'alpha', Z: 2, A: 4 } };
  if (mode === 'beta-minus') return { Z: Z + 1, N: N - 1, emit: { name: 'electron', Z: -1, A: 0 } };
  if (mode === 'beta-plus') return { Z: Z - 1, N: N + 1, emit: { name: 'positron', Z: 1, A: 0 } };
  return { Z, N, emit: { name: 'photon', Z: 0, A: 0 } };           // gamma
}

// Q values (MeV) from the binding energies.
export function qAlpha(Z, N) {
  const A = Z + N;
  return semf(A - 4, Z - 2) + B_ALPHA - semf(A, Z);
}
export function qBetaMinus(Z, N) {
  const A = Z + N;
  return semf(A, Z + 1) - semf(A, Z) + DM_NH;
}
export function qBetaPlus(Z, N) {
  const A = Z + N;
  return semf(A, Z - 1) - semf(A, Z) - DM_NH - 1.022;            // - 2 m_e c^2 - (m_n-m_H)
}

export function qValue(mode, Z, N) {
  if (mode === 'alpha') return qAlpha(Z, N);
  if (mode === 'beta-minus') return qBetaMinus(Z, N);
  if (mode === 'beta-plus') return qBetaPlus(Z, N);
  return 0;                                                       // gamma: state energy, not modelled here
}

// Geiger-Nuttall: log10(t_1/2 / s) = a * Z_d / sqrt(Q_MeV) - b, with
// the textbook constants (a ~ 1.61, b ~ 28.9 for Z_d the daughter Z).
export function log10HalfLifeAlpha(Z, N) {
  const Q = qAlpha(Z, N);
  if (Q <= 0) return Infinity;
  return 1.61 * (Z - 2) / Math.sqrt(Q) - 28.9;
}

// The canonical U-238 -> Pb-206 chain as an ordered mode list
// (8 alpha, 6 beta-minus). Returns the visited (Z, N) nodes.
export function uraniumChain() {
  const seq = ['alpha', 'beta-minus', 'beta-minus', 'alpha', 'alpha', 'alpha', 'alpha', 'alpha',
    'beta-minus', 'beta-minus', 'alpha', 'beta-minus', 'beta-minus', 'alpha'];
  let Z = 92, N = 146;                                            // U-238
  const path = [{ Z, N, mode: 'start' }];
  for (const m of seq) { const d = decay(m, Z, N); Z = d.Z; N = d.N; path.push({ Z, N, mode: m }); }
  return path;
}

// The thorium series Th-232 -> Pb-208 (6 alpha, 4 beta-minus).
export function thoriumChain() {
  const seq = ['alpha', 'beta-minus', 'beta-minus', 'alpha', 'alpha', 'alpha',
    'beta-minus', 'alpha', 'beta-minus', 'alpha'];
  let Z = 90, N = 142;                                            // Th-232
  const path = [{ Z, N, mode: 'start' }];
  for (const m of seq) { const d = decay(m, Z, N); Z = d.Z; N = d.N; path.push({ Z, N, mode: m }); }
  return path;
}

export function chainOf(name) { return name === 'thorium' ? thoriumChain() : uraniumChain(); }

export const ELEMENT = {
  81: 'Tl', 82: 'Pb', 83: 'Bi', 84: 'Po', 85: 'At', 86: 'Rn', 87: 'Fr',
  88: 'Ra', 89: 'Ac', 90: 'Th', 91: 'Pa', 92: 'U',
};
