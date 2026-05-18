// Relativistic hydrogen: Schrodinger vs the exact Dirac-Coulomb
// (Sommerfeld) spectrum, fine structure, and Zitterbewegung
// (Dirac 1928; Bjorken and Drell, Relativistic Quantum Mechanics,
// 1964; Schrodinger 1930; Sakurai and Napolitano; Griffiths QM).
//
// Schrodinger:  E_n = - Ry Z^2 / n^2.
// Dirac (point Coulomb, no QED):
//   E_{n,j} = m c^2 [ 1 + ( Z alpha /
//             (n - k + sqrt(k^2 - (Z alpha)^2)) )^2 ]^{-1/2},
//   k = j + 1/2,  binding = E_{n,j} - m c^2.
// The fine structure enters at order (Z alpha)^4, i.e. proportional
// to alpha^4 and to Z^4. Zitterbewegung: the Dirac position
// expectation trembles at angular frequency 2 m c^2 / hbar with
// amplitude of order the reduced Compton wavelength. Deterministic.

export const ALPHA = 1 / 137.035999084;                // fine-structure constant
export const MC2_EV = 510998.95;                       // electron rest energy (eV)
export const RY_EV = 0.5 * MC2_EV * ALPHA * ALPHA;      // Rydberg = 1/2 m c^2 alpha^2 (eV)

// Nonrelativistic (Schrodinger) hydrogen-like binding energy (eV).
export function schrodingerLevel(n, Z) {
  return -RY_EV * (Z * Z) / (n * n);
}

// Exact Dirac-Coulomb binding energy (eV). j is a half-integer
// (0.5, 1.5, ...), n the principal quantum number, with the
// constraint j <= n - 1/2. alpha overridable for the limit tests.
export function diracLevel(n, j, Z, alpha = ALPHA) {
  const k = j + 0.5;
  const ZA = Z * alpha;
  const disc = k * k - ZA * ZA;
  if (disc <= 0) return NaN;                            // supercritical (Z alpha > k)
  const denom = n - k + Math.sqrt(disc);
  const W = MC2_EV / Math.sqrt(1 + (ZA / denom) ** 2);
  return W - MC2_EV;
}

// Allowed total angular momenta j for principal quantum number n.
export function allowedJ(n) {
  const out = [];
  for (let j2 = 1; j2 <= 2 * n - 1; j2 += 2) out.push(j2 / 2);  // 1/2, 3/2, ... n-1/2
  return out;
}

// Fine-structure splitting of the n multiplet: highest j minus
// lowest j (j = 1/2) Dirac binding energies (eV, positive).
export function fineStructureSplit(n, Z, alpha = ALPHA) {
  const jMax = n - 0.5;
  return diracLevel(n, jMax, Z, alpha) - diracLevel(n, 0.5, Z, alpha);
}

// Leading fine-structure expansion of the binding energy (eV):
// E ~ -Ry Z^2/n^2 [ 1 + (Z alpha)^2/n^2 ( n/(j+1/2) - 3/4 ) ].
export function fineStructureExpansion(n, j, Z) {
  const base = -RY_EV * (Z * Z) / (n * n);
  const corr = (Z * ALPHA) ** 2 / (n * n) * (n / (j + 0.5) - 0.75);
  return base * (1 + corr);
}

// Group (drift) velocity of a Dirac wave packet, in units of c, for
// momentum p in units of m c:  v_g = p c^2 / E = p / sqrt(1 + p^2).
export function groupVelocity(p) { return p / Math.sqrt(1 + p * p); }

// Zitterbewegung angular frequency in units of m c^2 / hbar:
// omega_ZB = 2 E / hbar -> 2 sqrt(1 + p^2) (= 2 at rest).
export function zbOmega(p) { return 2 * Math.sqrt(1 + p * p); }

// Dirac position expectation for a positive/negative-energy mixed
// packet, time t in units of hbar/(m c^2), x in reduced Compton
// wavelengths. Drift v_g t plus a trembling term of amplitude
// ~ 1/(2 gamma) at omega_ZB, damped as the packet components dephase.
export function zbPosition(t, p, mix = 0.5, damp = 0.0) {
  const g = Math.sqrt(1 + p * p);
  const vg = groupVelocity(p);
  const w = zbOmega(p);
  const amp = mix * (1 / g);                            // ~ Compton-wavelength scale
  const env = damp > 0 ? Math.exp(-damp * t) : 1;
  return {
    drift: vg * t,
    tremble: amp * env * Math.sin(w * t),
    x: vg * t + amp * env * Math.sin(w * t),
  };
}

// Sampled comparison of Schrodinger and Dirac levels for a set of
// (n, j) up to nMax.
export function levelTable(nMax, Z) {
  const rows = [];
  for (let n = 1; n <= nMax; n += 1) {
    for (const j of allowedJ(n)) {
      rows.push({ n, j, schr: schrodingerLevel(n, Z), dirac: diracLevel(n, j, Z) });
    }
  }
  return rows;
}
