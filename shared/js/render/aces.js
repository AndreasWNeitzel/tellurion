// ACES filmic tonemap (Hill 2017 approximation).
const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
export function acesFilmic(rgb) {
  return rgb.map(x => Math.max(0, Math.min(1, (x * (a * x + b)) / (x * (c * x + d) + e))));
}
