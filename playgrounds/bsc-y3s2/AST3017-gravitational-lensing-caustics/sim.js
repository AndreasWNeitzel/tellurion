// Point-mass gravitational lensing core (no DOM), shared by playground.js
// and invariants.test.mjs. Angles are in units of the Einstein radius
// theta_E, so a single unit-mass lens has theta_E = 1.
//
// Lens equation:   beta = theta - sum_i m_i (theta - z_i) / |theta - z_i|^2
// Jacobian:        A = d beta / d theta;  magnification mu = 1 / |det A|
// Critical curves: det A = 0;  their image under the lens map = caustics.
// Reference: Schneider, Ehlers and Falco, Gravitational Lenses (1992),
// Chapters 5 to 8; Narayan and Bartelmann, Lectures on Gravitational
// Lensing (1996).

// Build a lens configuration. Single: one unit mass at the origin.
// Binary: two masses of total 1 with mass ratio q, split by `sep`.
export function makeLenses(binary, sep = 0.8, q = 0.5) {
  if (!binary) return [{ x: 0, y: 0, m: 1.0 }];
  const m1 = 1 / (1 + q), m2 = q / (1 + q);
  return [
    { x: -sep * m2, y: 0, m: m1 },
    { x: sep * m1, y: 0, m: m2 },
  ];
}

// Scaled deflection at image-plane position theta.
export function alphaAt(lenses, theta) {
  let ax = 0, ay = 0;
  for (const L of lenses) {
    const dx = theta.x - L.x, dy = theta.y - L.y;
    const r2 = dx * dx + dy * dy + 1e-12;
    ax += L.m * dx / r2;
    ay += L.m * dy / r2;
  }
  return { x: ax, y: ay };
}

// Lens equation: map an image-plane point to the source plane.
export function mapToSource(lenses, theta) {
  const a = alphaAt(lenses, theta);
  return { x: theta.x - a.x, y: theta.y - a.y };
}

// det of the lens Jacobian A = I - d alpha / d theta (analytic for points).
export function jacobianDet(lenses, theta) {
  let a11 = 1, a12 = 0, a21 = 0, a22 = 1;
  for (const L of lenses) {
    const dx = theta.x - L.x, dy = theta.y - L.y;
    const r2 = dx * dx + dy * dy + 1e-12;
    const r4 = r2 * r2;
    a11 -= L.m * (r2 - 2 * dx * dx) / r4;
    a22 -= L.m * (r2 - 2 * dy * dy) / r4;
    const cross = -L.m * (-2 * dx * dy) / r4;
    a12 -= cross;
    a21 -= cross;
  }
  return a11 * a22 - a12 * a21;
}

// Magnification of a single image at theta: mu = 1 / |det A|.
export function magnification(lenses, theta) {
  return 1 / Math.abs(jacobianDet(lenses, theta));
}

// All images of a source at beta: grid seed + Newton refine, de-duplicated.
export function findImages(lenses, beta, gridN = 80, R = 2.5) {
  const found = [];
  for (let i = 0; i < gridN; i += 1) {
    for (let j = 0; j < gridN; j += 1) {
      let tx = -R + (2 * R) * (i + 0.5) / gridN;
      let ty = -R + (2 * R) * (j + 0.5) / gridN;
      let ok = true;
      for (let it = 0; it < 8; it += 1) {
        const bm = mapToSource(lenses, { x: tx, y: ty });
        const fx = bm.x - beta.x, fy = bm.y - beta.y;
        if (fx * fx + fy * fy < 1e-12) break;
        const eps = 1e-4;
        const bxp = mapToSource(lenses, { x: tx + eps, y: ty });
        const bxm = mapToSource(lenses, { x: tx - eps, y: ty });
        const byp = mapToSource(lenses, { x: tx, y: ty + eps });
        const bym = mapToSource(lenses, { x: tx, y: ty - eps });
        const j11 = (bxp.x - bxm.x) / (2 * eps);
        const j12 = (byp.x - bym.x) / (2 * eps);
        const j21 = (bxp.y - bxm.y) / (2 * eps);
        const j22 = (byp.y - bym.y) / (2 * eps);
        const det = j11 * j22 - j12 * j21;
        if (Math.abs(det) < 1e-9) { ok = false; break; }
        const dx = (j22 * fx - j12 * fy) / det;
        const dy = (-j21 * fx + j11 * fy) / det;
        tx -= dx; ty -= dy;
        if (Math.abs(dx) + Math.abs(dy) < 1e-9) break;
      }
      if (!ok) continue;
      let dup = false;
      for (const im of found) if (Math.hypot(im.x - tx, im.y - ty) < 0.08) { dup = true; break; }
      if (dup) continue;
      const bm = mapToSource(lenses, { x: tx, y: ty });
      if (Math.hypot(bm.x - beta.x, bm.y - beta.y) < 0.02) {
        found.push({ x: tx, y: ty });
        if (found.length >= 5) return found;
      }
    }
  }
  return found;
}

// Exact total magnification of a single point lens, source at impact
// parameter u (in theta_E): A(u) = (u^2 + 2) / (u sqrt(u^2 + 4)).
export function pointLensMagnification(u) {
  return (u * u + 2) / (u * Math.sqrt(u * u + 4));
}
