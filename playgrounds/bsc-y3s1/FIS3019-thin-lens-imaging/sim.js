// Thin-lens imaging by the Gaussian lens equation and the three principal rays.
//
// Sign convention: the object sits at x = -d_o with d_o > 0, the thin lens lies at
// x = 0, and the focal points are at x = -f and x = +f, with f > 0 for a converging
// lens and f < 0 for a diverging one. The image forms at x = d_i obeying
//   1/d_o + 1/d_i = 1/f      (Gaussian lens equation),
// and the transverse magnification is M = -d_i/d_o = h_i/h_o. A positive d_i is a
// real image on the far side of the lens; a negative d_i is a virtual image on the
// object side. Reference: Hecht, Optics, 5th ed., Ch. 5, Eq. 5.17.

// Image distance from the lens equation. Returns +/-Infinity at d_o = f (image at
// infinity): the limit is +Infinity approached from d_o > f and -Infinity from below.
export function imageDistance(dObj, f) {
  const denom = dObj - f;
  if (Math.abs(denom) < 1e-12) return denom >= 0 ? Infinity : -Infinity;
  return (f * dObj) / denom;
}

// Transverse magnification M = -d_i/d_o. Negative M is inverted, |M| > 1 enlarged.
export function magnification(dObj, f) {
  const di = imageDistance(dObj, f);
  if (!isFinite(di)) return di > 0 ? -Infinity : Infinity;
  return -di / dObj;
}

// Image height h_i = M h_o.
export function imageHeight(dObj, f, hObj) {
  return magnification(dObj, f) * hObj;
}

// A real image has d_i > 0 (far side, converging rays); otherwise it is virtual.
export function isReal(dObj, f) {
  const di = imageDistance(dObj, f);
  return isFinite(di) && di > 0;
}

// Residual of the lens equation, 0 when satisfied; used as an invariant check.
export function lensResidual(dObj, f) {
  const di = imageDistance(dObj, f);
  if (!isFinite(di)) return 0;
  return 1 / dObj + 1 / di - 1 / f;
}

// Height at which the chief ray's two companions cross the lens plane, used by the
// renderer to place the principal-ray lens points: the parallel ray crosses at h_o,
// the chief ray at 0, the focal ray at the image height h_i.
export function lensCrossings(dObj, f, hObj) {
  return { parallel: hObj, chief: 0, focal: imageHeight(dObj, f, hObj) };
}
