// Gravitational lensing core (no DOM), shared by playground.js and
// invariants.test.mjs. Merges single-point microlensing (Paczynski
// light curve) with the general point/binary lens map, its Jacobian,
// critical curves and caustics. Angles in Einstein-radius units, so a
// single unit-mass lens has theta_E = 1.
//
//   A(u)   = (u^2 + 2) / (u sqrt(u^2 + 4))     point-lens magnification
//   u(t)   = sqrt(u_min^2 + ((t - t0)/t_E)^2)  Paczynski trajectory
//   beta   = theta - sum_i m_i (theta - z_i)/|theta - z_i|^2  lens map
//   det A  = 0  gives critical curves; their lens image gives caustics
// Reference: Paczynski, ApJ 304, 1 (1986); Gaudi, ARA&A 50, 411 (2012);
// Schneider, Ehlers & Falco, Gravitational Lenses (1992), Ch. 5 to 8.

// Single point lens (the classic microlensing event).
export function magnification(u) {
  const uu = Math.max(u, 1e-9);
  return (uu * uu + 2) / (uu * Math.sqrt(uu * uu + 4));
}
export function imagePositions(u) {
  const d = Math.sqrt(u * u + 4);
  return [0.5 * (u + d), 0.5 * (u - d)];
}
export function uOfT(uMin, tE, t, t0 = 0) {
  return Math.sqrt(uMin * uMin + ((t - t0) / tE) ** 2);
}
export function lightCurve(uMin, tE, tArr, t0 = 0) {
  return tArr.map((t) => magnification(uOfT(uMin, tE, t, t0)));
}
export function peakMagnification(uMin) {
  return magnification(uMin);
}

// General point/binary lens (caustics, multiple images).
export function makeLenses(binary, sep = 0.8, q = 0.5) {
  if (!binary) return [{ x: 0, y: 0, m: 1.0 }];
  const m1 = 1 / (1 + q), m2 = q / (1 + q);
  return [
    { x: -sep * m2, y: 0, m: m1 },
    { x: sep * m1, y: 0, m: m2 },
  ];
}
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
export function mapToSource(lenses, theta) {
  const a = alphaAt(lenses, theta);
  return { x: theta.x - a.x, y: theta.y - a.y };
}
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
export function imageMag(lenses, theta) {
  return 1 / Math.abs(jacobianDet(lenses, theta));
}
// All images of a source at beta: coarse grid seed + Newton refine.
export function findImages(lenses, beta, gridN = 80, R = 2.6) {
  const found = [];
  for (let i = 0; i < gridN; i += 1) {
    for (let j = 0; j < gridN; j += 1) {
      let tx = -R + (2 * R) * (i + 0.5) / gridN;
      let ty = -R + (2 * R) * (j + 0.5) / gridN;
      let ok = true;
      for (let it = 0; it < 10; it += 1) {
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
export function pointLensMagnification(u) {
  return (u * u + 2) / (u * Math.sqrt(u * u + 4));
}
