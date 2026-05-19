// Addition of angular momenta j1 + j2 -> J ranging from |j1 - j2| to j1 + j2.
// Number of states: (2j1+1)(2j2+1) = sum_{J} (2J+1).
// Clebsch-Gordan amplitudes for the m = m1 + m2 selection rule.
// Reference: Sakurai Modern QM Ch. 3 (`sakurai-qm`); Griffiths QM Ch. 4 (`griffiths-qm`).
export function allowedJ(j1, j2) {
  const minJ = Math.abs(j1 - j2), maxJ = j1 + j2;
  const list = [];
  for (let J = minJ; J <= maxJ + 1e-9; J += 1) list.push(J);
  return list;
}
export function multiplicity(j1, j2) {
  return Math.round((2 * j1 + 1) * (2 * j2 + 1));
}
export function totalMultiplicityFromJ(j1, j2) {
  return allowedJ(j1, j2).reduce((s, J) => s + (2 * J + 1), 0);
}

// Squared length of an angular-momentum vector in the semiclassical
// vector model: |j|^2 = j(j+1) (the Casimir eigenvalue, units hbar^2).
export function casimir(j) { return j * (j + 1); }

// Semiclassical angle between j1 and j2 when they couple to total J.
// From |J|^2 = |j1|^2 + |j2|^2 + 2 j1.j2 with j1.j2 = |j1||j2| cos:
//   cos theta_12 = [J(J+1) - j1(j1+1) - j2(j2+1)] / (2 sqrt(j1(j1+1) j2(j2+1))).
// Stretched (J = j1 + j2) gives +1 (parallel); the minimum
// (J = |j1 - j2|) gives -1 (antiparallel). Sakurai, Modern QM Ch. 3.
export function cosTheta12(j1, j2, J) {
  const denom = 2 * Math.sqrt(casimir(j1) * casimir(j2));
  if (denom === 0) return 0;
  const c = (casimir(J) - casimir(j1) - casimir(j2)) / denom;
  return Math.max(-1, Math.min(1, c));
}
