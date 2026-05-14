// Asymptotic g-mode period spacing in evolved stars (red giants).
// In the asymptotic regime: Pi_l = Pi_0 / sqrt(l(l+1)), where
//   Pi_0 = 2 pi^2 / integral N dr / r (over the g-mode cavity).
// Observed Pi_1 distinguishes RGB (~ 60-100 s, helium core not burning)
// from RC (~ 200-300 s, helium burning).
// Reference: Aerts-Christensen-Dalsgaard-Kurtz Asteroseismology Ch. 3.4
// (`aerts-asteroseism`).
export function Pi_l(Pi_0, l) {
  return Pi_0 / Math.sqrt(l * (l + 1));
}
// Theoretical Pi_0 for an evolved star scales with stellar mass and core structure.
// Empirical fits: RGB Pi_1 ~ 60-100 s, RC Pi_1 ~ 200-300 s.
export function evolutionStage(Pi_1) {
  if (Pi_1 < 110) return 'RGB';
  if (Pi_1 > 180) return 'RC';
  return 'transition';
}
