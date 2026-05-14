// Coulomb force from a set of point charges.
// F_i on a test charge q at r is sum over fixed charges j of:
//   k q q_j (r - r_j) / |r - r_j|^3
// where k = 1/(4 pi eps0) (set to 1 in normalized units).
// Reference: Marion-Thornton Ch. 6 (`marion-thornton`); Griffiths E&M Ch. 2 (`griffiths-em`).
export function forceAt(rx, ry, charges) {
  let fx = 0, fy = 0;
  for (const c of charges) {
    const dx = rx - c.x, dy = ry - c.y;
    const r2 = dx * dx + dy * dy + 1e-6;
    const inv_r3 = 1 / (r2 * Math.sqrt(r2));
    fx += c.q * dx * inv_r3;
    fy += c.q * dy * inv_r3;
  }
  return { fx, fy };
}
export function potentialAt(rx, ry, charges) {
  let v = 0;
  for (const c of charges) {
    const r = Math.sqrt((rx - c.x) ** 2 + (ry - c.y) ** 2 + 1e-6);
    v += c.q / r;
  }
  return v;
}
