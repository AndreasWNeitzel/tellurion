// Michelson interferometer fringe counter.
// One arm has fixed length L1; the other has length L2 = L1 + d.
// The optical path difference is OPD = 2 d (round trip).
// Intensity at center: I(d) = I0 (1 + V cos(2 pi (2 d) / lambda)).
// Moving the mirror by lambda/2 produces one full fringe period.
// Reference: Hecht Optics 5e Ch. 9.4 (`hecht2017`); Pain Vibrations Ch. 12 (`pain-vibrations`).
export function intensity(d, lambda, I0 = 1, V = 1) {
  return I0 * (1 + V * Math.cos(4 * Math.PI * d / lambda));
}
// Fringes counted when crossing the half-period boundary between two displacement values.
export function fringesBetween(d1, d2, lambda) {
  return Math.abs(2 * (d2 - d1) / lambda);
}
// Visibility (contrast) for two beams with intensity I1, I2: V = 2 sqrt(I1 I2) / (I1 + I2).
export function visibility(I1, I2) {
  return 2 * Math.sqrt(I1 * I2) / (I1 + I2);
}
// 2D pattern (small wedge angle alpha gives straight fringes).
export function ringPattern(x, y, d, lambda, R = 0.05) {
  // For paraxial Michelson with extended source, ring pattern intensity:
  //   I(theta) = I0 (1 + cos((2 d / lambda) (1 - theta^2 / 2)) * 2 pi).
  const r2 = x * x + y * y;
  return 1 + Math.cos(4 * Math.PI * (d / lambda) * (1 - r2 * R));
}
