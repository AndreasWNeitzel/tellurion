// p- and g-mode cavities in a stellar model.
// p-mode cavity (Lamb frequency): omega > S_l = sqrt(l(l+1)) c_s / r. Mode propagates in
// the outer envelope where c_s decreases outward.
// g-mode cavity (buoyancy frequency): omega < N(r). Mode propagates in the inner radiative
// zone where N is high.
// Toy stellar model: N(r) peaked in inner core, S_l(r) declining outward.
// Reference: Aerts-Christensen-Dalsgaard-Kurtz Ch. 3 (`aerts-asteroseism`).
export function N(r) {
  // Buoyancy frequency: peaks in core radiative zone.
  return 4 * Math.exp(-Math.pow((r - 0.2) / 0.15, 2));
}
export function S_l(r, l) {
  // Lamb frequency: high in core, drops in envelope.
  return l * (l + 1) > 0 ? Math.sqrt(l * (l + 1)) * 1.2 / (r + 0.05) : 0;
}
export function cavities(omega, l) {
  // Returns list of [r_start, r_end] segments for propagating-mode cavity.
  const N_r = 200; const pCavities = [], gCavities = [];
  let inP = false, sP = 0, inG = false, sG = 0;
  for (let i = 0; i <= N_r; i += 1) {
    const r = i / N_r;
    const Nv = N(r), Sv = S_l(r, l);
    const isP = omega > Math.max(Nv, Sv);
    const isG = omega < Math.min(Nv, Sv);
    if (isP && !inP) { sP = r; inP = true; }
    if (!isP && inP) { pCavities.push([sP, r]); inP = false; }
    if (isG && !inG) { sG = r; inG = true; }
    if (!isG && inG) { gCavities.push([sG, r]); inG = false; }
  }
  if (inP) pCavities.push([sP, 1]);
  if (inG) gCavities.push([sG, 1]);
  return { pCavities, gCavities };
}
