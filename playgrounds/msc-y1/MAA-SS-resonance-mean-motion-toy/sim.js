// Mean-motion resonance: bodies in orbital period ratio p:q have commensurate n's.
// E.g., Jupiter's 2:1, 3:2 resonances populate the Kirkwood gaps.
// For circular orbits with semi-major axes a_1, a_2, Kepler's 3rd: P^2 ∝ a^3.
// Resonance: P_2 / P_1 = q / p means a_2 / a_1 = (q/p)^{2/3}.
// Reference: Murray-Dermott Solar System Dynamics Ch. 8 (`murray-dermott`).
export function resonanceSemiMajor(a1, p, q) {
  return a1 * Math.pow(q / p, 2 / 3);
}
export function periodRatio(a1, a2) {
  return Math.pow(a2 / a1, 1.5);
}
// Kirkwood gaps in AU (relative to Jupiter at 5.2 AU).
export const KIRKWOOD_RATIOS = [
  { ratio: '2:1', p: 2, q: 1 },
  { ratio: '3:1', p: 3, q: 1 },
  { ratio: '5:2', p: 5, q: 2 },
  { ratio: '7:3', p: 7, q: 3 },
];
