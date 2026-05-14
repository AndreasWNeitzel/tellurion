// Toy BBN: a few empirical fits for primordial light-element abundances vs eta = n_b / n_gamma.
// Y_p (mass fraction of 4He): ~ 0.247 + 0.012 ln(eta_10 / 5) (Steigman 2007 fit).
// D / H: ~ 2.6e-5 (eta_10 / 6)^{-1.6}.
// 7Li / H: ~ 5e-10 (eta_10 / 6)^{2}.
// Reference: Liddle Cosmology Ch. 11 (`liddle-cosmology`); Kolb-Turner Ch. 4 (`kolb-turner`).
export function Yp(eta10) { return 0.247 + 0.012 * Math.log(eta10 / 5); }
export function DH(eta10) { return 2.6e-5 * Math.pow(eta10 / 6, -1.6); }
export function Li7H(eta10) { return 5e-10 * Math.pow(eta10 / 6, 2); }
// Planck 2018 baryon density: Omega_b h^2 = 0.02236, gives eta_10 ~ 6.1.
export const ETA_PLANCK = 6.1;
// Observed values approx (with rough error bars):
export const OBS_Yp = 0.245;
export const OBS_DH = 2.527e-5;
export const OBS_Li7H = 1.6e-10;
