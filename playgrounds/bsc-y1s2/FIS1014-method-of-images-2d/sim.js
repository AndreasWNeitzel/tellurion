// Method of images for several grounded conductor geometries. Each geometry
// returns a list of point charges (the real one, marked real:true, plus its
// images). The superposed field of that list matches the real problem in the
// field region and forces the potential to zero on the conductor, which is the
// whole trick. Reference: Griffiths, Introduction to Electrodynamics, 4th ed.,
// Sec. 3.2 (`griffiths-em`).

export const R_SPHERE = 1.0;

// Wedge family: the field region is the sector 0 < phi < beta with beta = pi/n.
//   n = 1  -> grounded plane (region y > 0), one image.
//   n = 2  -> right-angle corner (two perpendicular planes), three images.
//   n = 3  -> 60-degree wedge ("pizza slice"), five images.
// Images: for k = 0..n-1 place +q at angle 2k*beta + phi and -q at 2k*beta -
// phi, all at the real charge's radius r. The k = 0, +q charge is the real one.
// The alternating signs make V = 0 on both walls phi = 0 and phi = beta.
export function wedgeCharges(n, r, phi, q) {
  const beta = Math.PI / n;
  const cs = [];
  for (let k = 0; k < n; k += 1) {
    const ap = 2 * k * beta + phi, am = 2 * k * beta - phi;
    cs.push({ x: r * Math.cos(ap), y: r * Math.sin(ap), q, real: k === 0 });
    cs.push({ x: r * Math.cos(am), y: r * Math.sin(am), q: -q });
  }
  return cs;
}

// Grounded sphere of radius R centred at the origin, real charge q at (a,b)
// with d = |(a,b)| > R. The single image q' = -(R/d) q sits at (R^2/d^2)(a,b),
// inside the sphere, and makes V = 0 on the surface (Griffiths 3.2).
export function sphereCharges(R, a, b, q) {
  const d = Math.hypot(a, b) || 1e-9;
  const f = (R * R) / (d * d);
  return [
    { x: a, y: b, q, real: true },
    { x: f * a, y: f * b, q: -(R / d) * q, image: true },
  ];
}

export function fieldAt(cs, x, y) {
  let ex = 0, ey = 0;
  for (const c of cs) {
    const dx = x - c.x, dy = y - c.y;
    const r = Math.hypot(dx, dy) + 1e-6, r3 = r * r * r;
    ex += c.q * dx / r3; ey += c.q * dy / r3;
  }
  return { ex, ey };
}

export function potentialAt(cs, x, y) {
  let v = 0;
  for (const c of cs) v += c.q / (Math.hypot(x - c.x, y - c.y) + 1e-9);
  return v;
}

// Sum of the image charges only (the net induced charge the conductor must
// carry): -q for the plane, -(R/d)q for the sphere, -q for the corner/wedge.
export function imageChargeSum(cs) {
  let s = 0;
  for (const c of cs) if (!c.real) s += c.q;
  return s;
}
