// Hydrogen fine structure. Bohr levels: E_n = -R_y / n^2 (R_y = 13.6 eV).
// FS correction: delta E_FS = (-alpha^2 R_y / n^4) (n / (j + 1/2) - 3/4).
// j = l +/- 1/2.
// Reference: Griffiths QM Ch. 6 (`griffiths-qm`); Sakurai QM Ch. 5 (`sakurai-qm`).
export const RYDBERG_eV = 13.605693;
export const ALPHA = 7.2973525e-3;
export function bohrEnergy(n) { return -RYDBERG_eV / (n * n); }
export function fineStructureDelta(n, j) {
  const a2 = ALPHA * ALPHA;
  return -RYDBERG_eV / (n * n) * a2 / (n * n) * (n / (j + 0.5) - 0.75);
}
export function fsLevel(n, j) {
  return bohrEnergy(n) + fineStructureDelta(n, j);
}
