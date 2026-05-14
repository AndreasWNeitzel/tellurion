// sim.js
// Michelson interferometer. Two arms differ in path by L = 2 d (where
// d is the mirror displacement). The intensity at the detector is
//
//   I(L) = I_0 (1 + V cos(2 pi L / lambda)),
//
// where the visibility V is the degree of coherence at delay L. For a
// source with coherence length L_c (Gaussian temporal envelope):
//
//   V(L) = exp(-(L / L_c)^2).
//
// Fringe period in L is lambda; fringe count over a full traverse is
// 2 d / lambda.
//
// Reference: Hecht, Optics 5e Ch. 9 (`hecht2017`).

export function visibilityGaussian(L, Lc) {
  if (Lc <= 0) return 0;
  return Math.exp(-(L / Lc) * (L / Lc));
}

export function intensity(L, lambdaNm, Lc_nm) {
  const V = visibilityGaussian(L, Lc_nm);
  return 0.5 * (1 + V * Math.cos(2 * Math.PI * L / lambdaNm));
}

// Number of fringes per unit displacement; mirror moves by d gives 2 d fringes per lambda.
export function fringesPerMicron(lambdaNm) {
  return 2000 / lambdaNm; // 1 um = 1000 nm; 2 d / lambda for d = 1 um
}

// Coherence-length conversion: Gaussian linewidth dnu_FWHM <-> Lc.
// Lc = c / (pi dnu_FWHM) * 2 sqrt(ln 2) ~ 0.66 c / dnu. We just expose
// the inverse: dnu (Hz) from Lc (nm).
export function bandwidthFromCoherence(Lc_nm) {
  const c = 299792458;
  const Lc_m = Lc_nm * 1e-9;
  // dnu = c / (pi Lc) * 2 sqrt(ln 2) ~ 0.4413 c / Lc.
  return 0.4413 * c / Lc_m;
}
