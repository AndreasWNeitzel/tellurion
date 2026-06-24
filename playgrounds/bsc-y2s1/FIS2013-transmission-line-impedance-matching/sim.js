// sim.js
// Transmission line, complex load, reflection coefficient and matching.
//
// Voltage reflection coefficient at a load Z_L = R + jX on a line of
// characteristic impedance Z_0 (real):
//   Gamma_L = (Z_L - Z_0) / (Z_L + Z_0).
//
// Moving a distance d toward the source rotates the reflection coefficient
// clockwise on the Smith chart at constant magnitude:
//   Gamma(d) = Gamma_L exp(-2 j beta d).
// The impedance seen there is Z(d) = Z_0 (1 + Gamma(d)) / (1 - Gamma(d)).
//
// VSWR = (1 + |Gamma|) / (1 - |Gamma|); power delivered = 1 - |Gamma|^2.
//
// A quarter-wave transformer of impedance Z_t terminated in Z_L presents
// Z_in = Z_t^2 / Z_L; choosing Z_t = sqrt(Z_0 R_L) matches a real load.
//
// Reference: Pozar, Microwave Engineering 4e, Ch. 2; Jackson 3e Ch. 8.

// Minimal complex helpers ({re, im}).
export function cadd(a, b) { return { re: a.re + b.re, im: a.im + b.im }; }
export function csub(a, b) { return { re: a.re - b.re, im: a.im - b.im }; }
export function cmul(a, b) { return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re }; }
export function cdiv(a, b) {
  const d = b.re * b.re + b.im * b.im;
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
}
export function cabs(a) { return Math.hypot(a.re, a.im); }
export function carg(a) { return Math.atan2(a.im, a.re); }

// Complex reflection coefficient of load R + jX on a real Z_0 line.
export function reflectionComplex(R, X, Z0) {
  const num = { re: R - Z0, im: X };
  const den = { re: R + Z0, im: X };
  return cdiv(num, den);
}

// Gamma rotated a distance d (in wavelengths) toward the generator.
export function gammaAt(gL, dLambda) {
  const phi = -4 * Math.PI * dLambda; // -2 beta d, beta = 2 pi / lambda
  const rot = { re: Math.cos(phi), im: Math.sin(phi) };
  return cmul(gL, rot);
}

// Impedance from a reflection coefficient (normalised to Z_0 if Z0 omitted).
export function impedanceFromGamma(g, Z0 = 1) {
  const one = { re: 1, im: 0 };
  const z = cdiv(cadd(one, g), csub(one, g));
  return { re: z.re * Z0, im: z.im * Z0 };
}

export function vswrFromMag(gMag) {
  if (gMag >= 1 - 1e-15) return Infinity;
  return (1 + gMag) / (1 - gMag);
}

// Quarter-wave transformer Z_t = sqrt(Z_0 R_L) at the load: input reflection.
export function quarterWaveInput(R, X, Z0) {
  const Zt2 = Z0 * Math.max(1e-9, R);            // Z_t^2 = Z_0 R_L
  // Z_in = Z_t^2 / Z_L
  const Zin = cdiv({ re: Zt2, im: 0 }, { re: R, im: X });
  const g = cdiv(csub(Zin, { re: Z0, im: 0 }), cadd(Zin, { re: Z0, im: 0 }));
  return { Zt: Math.sqrt(Zt2), Zin, gamma: g };
}

// -------- legacy real-load exports (kept for invariants/getState) --------
export function reflection(ZL, Z0) { return (ZL - Z0) / (ZL + Z0); }
export function vswr(ZL, Z0) {
  const g = Math.abs(reflection(ZL, Z0));
  if (g >= 1 - 1e-15) return Infinity;
  return (1 + g) / (1 - g);
}
export function powerDelivered(ZL, Z0) { const g = reflection(ZL, Z0); return 1 - g * g; }
export function returnLossDb(ZL, Z0) {
  const g = Math.abs(reflection(ZL, Z0));
  if (g < 1e-15) return Infinity;
  return -20 * Math.log10(g);
}
export function isMatched(ZL, Z0, tol = 0.01) { return Math.abs(reflection(ZL, Z0)) < tol; }
