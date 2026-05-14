// sim.js
// Fabry-Perot etalon. Two parallel partial mirrors of intensity
// reflectance R at spacing L (with refractive index n between them).
// Round-trip phase phi = 4 pi n L cos(theta) / lambda. The transmitted
// intensity (Airy distribution) is
//
//   T(phi) = 1 / (1 + F sin^2(phi / 2)),
//   F = 4 R / (1 - R)^2.
//
// Finesse (sharpness of the peaks):
//   F_* = pi * sqrt(F) / 2 = pi * sqrt(R) / (1 - R).
//
// Free spectral range (in wavelength): lambda_FSR = lambda^2 / (2 n L).
// Free spectral range (in frequency):  nu_FSR     = c  / (2 n L).
//
// Reference: Hecht, Optics 5e Ch. 9 (`hecht2017`).

export function coefficientFinesse(R) {
  return 4 * R / Math.pow(1 - R, 2);
}

export function finesse(R) {
  return Math.PI * Math.sqrt(R) / (1 - R);
}

// Airy transmission T(phi).
export function transmission(phi, R) {
  const F = coefficientFinesse(R);
  const s = Math.sin(phi / 2);
  return 1 / (1 + F * s * s);
}

// FSR in wavelength (nm) given lambda (nm), n, L (m).
export function fsrWavelengthNm(lambdaNm, n, L_m) {
  // FSR in wavelength: dlambda = lambda^2 / (2 n L). lambdaNm^2 / (2 n L * 1e9) in nm.
  return (lambdaNm * lambdaNm) / (2 * n * L_m * 1e9);
}

// FSR in frequency (Hz).
export function fsrFreqHz(n, L_m) {
  const c = 299792458;
  return c / (2 * n * L_m);
}

// FWHM (full width at half maximum) of the transmission peak in phi.
// At T = 1/2: F sin^2(phi/2) = 1 -> phi = 2 arcsin(1/sqrt(F)).
// FWHM_phi = 4 arcsin(1/sqrt(F)) ~ 4/sqrt(F) for large F.
export function fwhmPhi(R) {
  const F = coefficientFinesse(R);
  return 4 * Math.asin(1 / Math.sqrt(F));
}
