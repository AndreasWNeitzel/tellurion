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

// ---------------------------------------------------------------------
// CAUSTICS. A point-mass lens plus an external shear gamma (the
// Chang-Refsdal lens) has a non-trivial caustic structure: the
// degenerate point caustic of the isolated point lens unfolds into a
// four-cusped astroid. The shear models the tidal field of nearby
// matter, exactly the configuration that produces quad lenses like
// the Einstein Cross. Reference: Chang & Refsdal 1979; Schneider,
// Ehlers, Falco 1992, Ch. 8 (`sef1992`).
//
// Lens equation with shear along the x-axis (theta_E = 1):
//   beta_x = x (1 - gamma) - x / r^2
//   beta_y = y (1 + gamma) - y / r^2
export function lensShear(x, y, gamma) {
  const r2 = x * x + y * y;
  if (r2 < 1e-8) return [0, 0];
  return [x * (1 - gamma) - x / r2, y * (1 + gamma) - y / r2];
}

// Jacobian determinant det A = det(d beta / d theta) of the sheared
// point lens. The critical curve is the locus det A = 0.
export function detAShear(x, y, gamma) {
  const r2 = x * x + y * y;
  if (r2 < 1e-8) return 1;
  const r4 = r2 * r2;
  const axx = (1 - gamma) - 1 / r2 + 2 * x * x / r4;
  const ayy = (1 + gamma) - 1 / r2 + 2 * y * y / r4;
  const axy = 2 * x * y / r4;
  return axx * ayy - axy * axy;
}

// Critical curves (image plane) and caustics (source plane) of the
// sheared point lens. For each polar angle we scan outward in radius
// and record every det A sign change; the crossing point is on a
// critical curve, and its image under lensShear is on a caustic.
// Returns { critical: [[x,y],...], caustic: [[bx,by],...] } as point
// clouds ordered by angle (so they can be drawn as polylines).
export function criticalCaustic(gamma, nAng = 360) {
  const critical = [];
  const caustic = [];
  const rMin = 0.05, rMax = 4.0, nR = 800;
  for (let a = 0; a < nAng; a += 1) {
    const phi = 2 * Math.PI * a / nAng;
    const cphi = Math.cos(phi), sphi = Math.sin(phi);
    let prev = detAShear(rMin * cphi, rMin * sphi, gamma);
    for (let i = 1; i <= nR; i += 1) {
      const r = rMin + (rMax - rMin) * i / nR;
      const x = r * cphi, y = r * sphi;
      const d = detAShear(x, y, gamma);
      if (prev * d < 0) {
        // Linear-interpolate the zero crossing in r.
        const rPrev = rMin + (rMax - rMin) * (i - 1) / nR;
        const f = prev / (prev - d);
        const rc = rPrev + f * (r - rPrev);
        const xc = rc * cphi, yc = rc * sphi;
        critical.push([xc, yc]);
        caustic.push(lensShear(xc, yc, gamma));
      }
      prev = d;
    }
  }
  return { critical, caustic };
}

// Solve the inverse lens equation for the sheared point lens: given a
// source position (bx, by), find every image position. The map has no
// closed-form inverse (it is a quartic), so we Newton-iterate from a
// grid of seeds and deduplicate. The image count jumps by 2 across a
// caustic: 2 images outside the astroid, 4 inside.
export function solveShearImages(bx, by, gamma) {
  const out = [];
  for (let gx = -6; gx <= 6; gx += 1) {
    for (let gy = -6; gy <= 6; gy += 1) {
      let x = gx * 0.5, y = gy * 0.5;
      if (x * x + y * y < 1e-3) continue;
      let ok = false;
      for (let it = 0; it < 24; it += 1) {
        const r2 = x * x + y * y;
        if (r2 < 1e-8) break;
        const r4 = r2 * r2;
        const fx = x * (1 - gamma) - x / r2 - bx;
        const fy = y * (1 + gamma) - y / r2 - by;
        if (fx * fx + fy * fy < 1e-12) { ok = true; break; }
        // Jacobian = lens matrix A.
        const axx = (1 - gamma) - 1 / r2 + 2 * x * x / r4;
        const ayy = (1 + gamma) - 1 / r2 + 2 * y * y / r4;
        const axy = 2 * x * y / r4;
        const det = axx * ayy - axy * axy;
        if (Math.abs(det) < 1e-9) break;
        x -= (ayy * fx - axy * fy) / det;
        y -= (-axy * fx + axx * fy) / det;
        if (!Number.isFinite(x) || !Number.isFinite(y) || x * x + y * y > 100) break;
      }
      if (!ok) continue;
      // Deduplicate against images already found.
      let dup = false;
      for (const p of out) {
        if (Math.hypot(p.x - x, p.y - y) < 0.03) { dup = true; break; }
      }
      if (!dup) out.push({ x, y, mu: 1 / Math.max(1e-6, Math.abs(detAShear(x, y, gamma))) });
    }
  }
  return out;
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
