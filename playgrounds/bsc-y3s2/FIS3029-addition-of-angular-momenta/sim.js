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
