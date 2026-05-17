// Closed-form quantum confinement in a nanostructure. A particle is
// confined by an infinite square well in d_c dimensions (well: 1
// confined; wire: 2; dot: 3; bulk: 0) and free in the rest. The
// confined levels are E_n = hbar^2 pi^2 n^2 / (2 m L^2) and the
// density of states takes the dimensionality-characteristic form:
// E^{1/2} (3D bulk), step (2D well), E^{-1/2} (1D wire), delta (0D
// dot). Exact algebra, deterministic. Reference: Griffiths,
// Introduction to Quantum Mechanics (`griffiths-qm`); Davies, The
// Physics of Low-Dimensional Semiconductors (`davies1998`); Ashcroft
// and Mermin, Solid State Physics (`ashcroft-mermin`).

// hbar = 1; energies in the same units as pi^2/(2 m L^2).
export function energyLevel(n, L, m = 1) {
  return (Math.PI * Math.PI * n * n) / (2 * m * L * L);
}

// Ground-state confinement energy (the "gap"): E_1 ~ 1 / L^2.
export function confinementGap(L, m = 1) { return energyLevel(1, L, m); }

// Confined sub-level energies up to Emax (sum of per-axis levels for
// d_c confined axes of a cubic box of side L).
export function levels(dim, L, m = 1, Emax = 40) {
  const dc = { bulk: 0, well: 1, wire: 2, dot: 3 }[dim];
  const e1 = energyLevel(1, L, m);
  const nMax = Math.max(1, Math.floor(Math.sqrt(Emax / e1)));
  const out = [];
  if (dc === 0) return out;
  const rec = (axis, acc, idx) => {
    if (axis === dc) { if (acc <= Emax) out.push({ E: acc, n: idx.slice() }); return; }
    for (let n = 1; n <= nMax; n += 1) {
      const e = energyLevel(n, L, m);
      if (acc + e > Emax) break;
      idx.push(n); rec(axis + 1, acc + e, idx); idx.pop();
    }
  };
  rec(0, 0, []);
  out.sort((a, b) => a.E - b.E);
  return out;
}

// Density of states g(E). Free dimensions contribute the continuum
// shape; confined ones contribute discrete sub-band onsets.
//  bulk : g ~ sqrt(E)
//  well : g ~ step sum_n Theta(E - E_n)            (constant per subband)
//  wire : g ~ sum_n (E - E_n)^{-1/2}               (van Hove spikes)
//  dot  : g ~ sum delta(E - E_lmn)  (here: narrow Lorentzians)
export function dos(dim, E, L, m = 1) {
  if (E <= 0) return 0;
  const pref = Math.pow(2 * m, 1.5);
  if (dim === 'bulk') return (pref / (2 * Math.PI * Math.PI)) * Math.sqrt(E);
  const subs = levels(dim, L, m, E + 1e-9).map(s => s.E);
  if (dim === 'well') {                              // 2D continuum per subband
    let g = 0;
    for (const Es of subs) if (E >= Es) g += m / Math.PI;
    return g;
  }
  if (dim === 'wire') {                              // 1D continuum per subband
    let g = 0;
    for (const Es of subs) if (E > Es) g += Math.sqrt(m / 2) / Math.PI / Math.sqrt(E - Es);
    return g;
  }
  // dot: broadened delta peaks
  let g = 0;
  const w = 0.05;
  for (const Es of subs) g += (1 / Math.PI) * (w / ((E - Es) ** 2 + w * w));
  return g;
}

// Optical-absorption onset: the lowest allowed confined energy (the
// effective gap). For the dot it is the discrete ground level; for
// well/wire/bulk it is the lowest sub-band edge (0 for bulk).
export function absorptionOnset(dim, L, m = 1) {
  if (dim === 'bulk') return 0;
  const s = levels(dim, L, m, 200);
  return s.length ? s[0].E : confinementGap(L, m);
}
