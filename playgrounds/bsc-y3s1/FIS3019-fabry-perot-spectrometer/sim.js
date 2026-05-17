// Fabry-Perot etalon as a spectrometer. Multiple-beam interference
// between two mirrors of reflectance R gives the Airy transmission
//   T(delta) = 1 / (1 + F sin^2(delta/2)),  F = 4R/(1-R)^2,
// with round-trip phase delta = (2 pi / lambda) 2 n d cos(theta).
// The instrument resolves a wavelength doublet when the reflectance
// finesse F* = pi sqrt(R)/(1-R) is large enough that the two Airy
// peaks of order m are separated by more than their width; the
// resolving power is R_p = m F* = (2 n d / lambda) F*. Sodium D
// lines: D2 = 588.995 nm, D1 = 589.592 nm. Headless, deterministic.
// Reference: Hecht, Optics (5th ed.), Ch. 9.6 (`hecht2017`); Born
// and Wolf, Principles of Optics (7th ed.), Sec. 7.6 (`born-wolf`).

export const NA_D2 = 588.995;   // nm
export const NA_D1 = 589.592;   // nm

export function coeffFinesse(R) { return (4 * R) / ((1 - R) * (1 - R)); }
export function reflFinesse(R) { return R <= 0 ? 0 : (Math.PI * Math.sqrt(R)) / (1 - R); }

// Airy transmittance at round-trip phase delta.
export function airyT(delta, R) {
  const F = coeffFinesse(R);
  const s = Math.sin(delta / 2);
  return 1 / (1 + F * s * s);
}

// Round-trip phase for spacing d (m), index n, angle theta, vacuum
// wavelength lambda (m).
export function phase(lambda_m, d_m, n = 1, theta = 0) {
  return (2 * Math.PI / lambda_m) * 2 * n * d_m * Math.cos(theta);
}

// Interference order at the spacing (delta = 2 pi m at a maximum).
export function orderM(lambda_m, d_m, n = 1, theta = 0) {
  return (2 * n * d_m * Math.cos(theta)) / lambda_m;
}

// Free spectral range in wavelength (nm) about lambda (nm).
export function fsrNm(lambda_nm, d_m, n = 1) {
  const lam = lambda_nm * 1e-9;
  return (lam * lam / (2 * n * d_m)) * 1e9;
}

export function resolvingPower(lambda_m, d_m, R, n = 1, theta = 0) {
  return orderM(lambda_m, d_m, n, theta) * reflFinesse(R);
}

// Two-line transmitted spectrum vs spacing: T1 + T2 for the doublet.
export function doubletT(d_m, R, lam1_nm = NA_D2, lam2_nm = NA_D1, n = 1) {
  const t1 = airyT(phase(lam1_nm * 1e-9, d_m, n), R);
  const t2 = airyT(phase(lam2_nm * 1e-9, d_m, n), R);
  return { t1, t2, sum: t1 + t2 };
}

// Rayleigh-style resolution test: the doublet of separation
// dLambda at wavelength lambda is resolved when R_p >= lambda/dLambda
// and the orders do not overlap (FSR > dLambda).
export function resolves(lambda_nm, dLambda_nm, d_m, R, n = 1) {
  const lam = lambda_nm * 1e-9;
  const Rp = resolvingPower(lam, d_m, R, n);
  const need = lambda_nm / dLambda_nm;
  const fsr = fsrNm(lambda_nm, d_m, n);
  return { Rp, need, fsr, resolved: Rp >= need && fsr > dLambda_nm };
}

// FWHM of an Airy peak in phase (exact): the half-maximum condition
// 1 + F sin^2(x) = 2 gives full width 4 asin(1/sqrt F).
export function fwhmPhase(R) {
  const F = coeffFinesse(R);
  return F <= 0 ? Infinity : 4 * Math.asin(1 / Math.sqrt(F));
}
