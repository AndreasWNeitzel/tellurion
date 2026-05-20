// Headless physics for the gravitational-lensing-3d hero. The lens
// equation for a point-mass (or singular isothermal sphere, or
// Schwarzschild-like) gravitational lens maps each source-plane point
// back to image positions in the observer-plane via a deflection law.
// Reference: Schneider, Ehlers, Falco, Gravitational Lenses (Springer
// 1992), Ch. 5 (`sef1992`); Schneider, Kochanek, Wambsganss, Saas-Fee
// 33 (2006) (`skw2006`).

// Einstein radius (in image-plane units): theta_E. The point-mass
// deflection at image radius |theta| from the lens is
//   alpha(theta) = theta_E^2 / |theta|^2 * theta
// so the lens equation reads
//   beta = theta - alpha = theta * (1 - theta_E^2 / |theta|^2).
// We work in normalized angular units with theta_E = 1.

// Map an image-plane position (x, y) back to a source-plane position
// for a point-mass lens at the origin.
export function lensPointMass(x, y) {
  const r2 = x * x + y * y;
  if (r2 < 1e-8) return [0, 0];
  const fac = 1 - 1 / r2;
  return [fac * x, fac * y];
}

// Singular isothermal sphere: deflection is constant in magnitude
// (alpha = theta_E * theta / |theta|), so
//   beta = theta - theta_E * theta / |theta|.
export function lensSIS(x, y) {
  const r = Math.sqrt(x * x + y * y);
  if (r < 1e-6) return [0, 0];
  const fac = 1 - 1 / r;
  return [fac * x, fac * y];
}

// Solve the inverse lens equation: given source position (bx, by),
// find image positions in the image plane. For a point-mass lens
// this reduces to a quadratic in |theta|:
//   |theta|^2 - |beta| * |theta| - 1 = 0
// giving two images at angles aligned with the source vector.
export function solvePointMassImages(bx, by) {
  const r = Math.sqrt(bx * bx + by * by);
  // Two image radii: r_+ = (r + sqrt(r^2 + 4)) / 2,
  //                  r_- = (r - sqrt(r^2 + 4)) / 2 (negative -> image
  //                       on the opposite side of the lens).
  const disc = Math.sqrt(r * r + 4);
  const rp = 0.5 * (r + disc);
  const rm = 0.5 * (r - disc);
  // Unit vector along beta.
  let ux = 1, uy = 0;
  if (r > 1e-6) { ux = bx / r; uy = by / r; }
  return [
    { x: rp * ux, y: rp * uy, mag: imageMag(rp) },
    { x: rm * ux, y: rm * uy, mag: imageMag(rm) },
  ];
}

// Image magnification for a point-mass lens at image radius |theta|:
//   mu = |theta|^2 / (|theta|^2 - 1)  for |theta| > 1,
//   mu = |theta|^2 / (1 - |theta|^2)  for |theta| < 1 (sign-flipped).
function imageMag(theta) {
  const t2 = theta * theta;
  return t2 / Math.max(1e-4, Math.abs(t2 - 1));
}

// Source-plane background grid sample: returns the colored "source"
// at (bx, by) given a chosen pattern. For visualization a polka-dot
// stripe pattern shows distortion vividly.
export function sourcePattern(bx, by, kind = 'stripes') {
  if (kind === 'stripes') {
    const f = 0.4;
    const v = (Math.sin(bx / f) + Math.sin(by / f)) * 0.5;
    return v;          // in [-1, 1]
  }
  if (kind === 'checker') {
    const u = Math.floor(bx * 3) + Math.floor(by * 3);
    return (u % 2 === 0) ? 1 : -1;
  }
  // Bullseye
  const r = Math.sqrt(bx * bx + by * by);
  return Math.sin(r * 4);
}

// Magnification field rho(x, y) for the lens, evaluated as the
// Jacobian determinant of the inverse map.
export function magnificationField(lens, x, y) {
  // Numerical Jacobian via finite differences.
  const h = 1e-3;
  const [b00x, b00y] = lens(x, y);
  const [bx_p, by_p] = lens(x + h, y);
  const [bx_m, by_m] = lens(x, y + h);
  const J11 = (bx_p - b00x) / h;
  const J21 = (by_p - b00y) / h;
  const J12 = (bx_m - b00x) / h;
  const J22 = (by_m - b00y) / h;
  const det = J11 * J22 - J12 * J21;
  return 1 / Math.max(1e-6, Math.abs(det));
}
