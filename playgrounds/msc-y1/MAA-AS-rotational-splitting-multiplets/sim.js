// Rotational splitting in asteroseismology.
// For uniformly rotating star with rotation rate Ω, a mode of (l, m) frequency shifts by
//   delta omega = m (1 - C_n,l) Omega,
// where C_{n,l} is the Ledoux constant (~0 for p-modes, ~1/(l(l+1)) for g-modes).
// Reference: Aerts-Christensen-Dalsgaard-Kurtz Ch. 3.8 (`aerts-asteroseism`).
export function ledoux(l, isGMode) {
  if (isGMode) return 1 / (l * (l + 1));
  return 0;
}
export function splittedFreq(nu_0, m, Omega, l, isGMode) {
  return nu_0 + m * (1 - ledoux(l, isGMode)) * Omega;
}
