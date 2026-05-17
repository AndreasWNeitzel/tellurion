// Hydrogen levels under external fields. Unperturbed E_n = -RY/n^2.
// Normal Zeeman: each level splits into 2l+1 sublevels at
//   dE = mu_B B m_l   (equally spaced, linear in B).
// Linear Stark (degenerate hydrogen): in parabolic quantum numbers
// (n1, n2, m) with n1 + n2 + |m| + 1 = n,
//   dE = (3/2) n (n1 - n2) e a0 F .
// For n = 1 only (n1, n2, m) = (0, 0, 0) exists, so the first-order
// Stark shift is exactly zero; the ground state shifts only
// quadratically, dE2 = -(1/2) alpha F^2 (alpha_1s = 4.5 a0^3 > 0, so
// it always lowers). Dipole selection rules: dl = +/-1, dm in
// {-1, 0, +1}. Headless and deterministic. Reference: Griffiths,
// Introduction to Quantum Mechanics (3rd ed.), Ch. 6.

export const RY = 13.605693;                       // Rydberg (eV)
export const MU_B = 5.7883818e-5;                  // Bohr magneton (eV/T)
// Linear-Stark coefficient: e a0 times a strong-field scale, so the
// slider F in [0, 6] gives n=2 splittings of order 10 meV (realistic
// for ~1e7 V/m laboratory fields).
export const STARK1 = 1.2e-3;                      // eV per F unit (~ e a0 F)
export const ALPHA_1S = 9.0 / 2;                   // 1s polarizability (atomic units, a0^3)
const STARK2 = 2.0e-4;                             // quadratic-Stark scale (eV per F^2 unit)

export function energyLevel(n) { return -RY / (n * n); }

// Parabolic states of shell n: all (n1, n2, m) with
// n1 + n2 + |m| = n - 1, n1, n2 >= 0.
export function parabolicStates(n) {
  const out = [];
  for (let m = -(n - 1); m <= n - 1; m += 1) {
    const mm = m === 0 ? 0 : m;                     // avoid -0
    for (let n1 = 0; n1 <= n - 1 - Math.abs(mm); n1 += 1) {
      const n2 = n - 1 - Math.abs(mm) - n1;
      out.push({ n1, n2, m: mm });
    }
  }
  return out;
}

// First-order linear Stark shift (eV) for a parabolic state.
export function starkLinear(n, n1, n2, F) {
  return 1.5 * n * (n1 - n2) * STARK1 * F;
}

// Ground-state (n = 1) Stark: no linear term, quadratic only and
// always negative (the 1s state is pulled down).
export function starkGroundQuadratic(F) { return (-0.5 * ALPHA_1S * STARK2 * F * F) || 0; }

// Normal Zeeman sublevels of an (n, l) level: 2l+1 shifts.
export function zeemanShift(ml, B) { return MU_B * B * ml; }

export function lValues(n) { const v = []; for (let l = 0; l < n; l += 1) v.push(l); return v; }

// Full sublevel set of shell n given fields (B in tesla, F in the
// scaled Stark unit). Stark uses parabolic states; pure Zeeman uses
// (l, m_l). With both fields on we report the Stark levels with an
// added Zeeman term on m (the dominant qualitative behaviour).
export function sublevels(n, B, F) {
  const out = [];
  const E0 = energyLevel(n);
  if (Math.abs(F) > 1e-12) {
    for (const s of parabolicStates(n)) {
      const dS = n === 1 ? starkGroundQuadratic(F) : starkLinear(n, s.n1, s.n2, F);
      out.push({ n1: s.n1, n2: s.n2, m: s.m, E: E0 + dS + zeemanShift(s.m, B) });
    }
  } else {
    for (const l of lValues(n)) for (let m = -l; m <= l; m += 1) {
      out.push({ l, m, E: E0 + zeemanShift(m, B) });
    }
  }
  return out;
}

export function dipoleAllowed(l1, m1, l2, m2) {
  return Math.abs(l1 - l2) === 1 && Math.abs(m1 - m2) <= 1;
}

// Normal Zeeman triplet of a spectral line: the unshifted line plus
// dm = +/-1 shifted by +/- mu_B B (in eV).
export function zeemanTriplet(E0, B) {
  const d = MU_B * B;
  return [E0 - d, E0, E0 + d];
}

// Synthetic spectrum: transition energies between shells nU -> nL
// with Zeeman splitting applied (normal-Zeeman triplet per line).
export function spectrumLines(nU, nL, B, F) {
  const base = energyLevel(nU) - energyLevel(nL);   // emission photon energy > 0
  const lines = [];
  // a representative Stark spread of the upper shell, if F on
  if (Math.abs(F) > 1e-12 && nU > 1) {
    for (const s of parabolicStates(nU)) {
      const dE = starkLinear(nU, s.n1, s.n2, F);
      for (const e of zeemanTriplet(base + dE, B)) lines.push(e);
    }
  } else {
    for (const e of zeemanTriplet(base, B)) lines.push(e);
  }
  return lines.sort((a, b) => a - b);
}
