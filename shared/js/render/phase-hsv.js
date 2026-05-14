// Complex phase to RGB via HSV: H = arg / (2 pi), S = 1, V = sqrt(|z|).
function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    case 5: return [v, p, q];
  }
}
export function complexPhaseToRGB(re, im) {
  const h = ((Math.atan2(im, re) / (2 * Math.PI)) + 1) % 1;
  const v = Math.min(1, Math.sqrt(Math.hypot(re, im)));
  return hsvToRgb(h, 1, v);
}
