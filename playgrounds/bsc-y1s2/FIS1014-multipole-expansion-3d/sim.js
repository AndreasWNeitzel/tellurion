// Multipole expansion of the electrostatic potential. Headless and
// deterministic. A distribution is a set of point charges; the exact
// potential is the direct Coulomb sum, and the Cartesian multipole
// expansion about the origin is
//   V(r) = K [ Q/r + (p . r_hat)/r^2
//              + (1/2) sum_ij Q_ij r_hat_i r_hat_j / r^3 + ... ]
// with monopole Q = sum q, dipole p = sum q r, traceless quadrupole
// Q_ij = sum q (3 x_i x_j - r^2 delta_ij). The truncation error
// collapses far from the source and is large near it.
// Reference: Griffiths, Introduction to Electrodynamics (4th ed.),
// Sec. 3.4; Jackson, Classical Electrodynamics, Sec. 4.1.

export const K = 1;

export function exactPotential(charges, P) {
  let v = 0;
  for (const c of charges) {
    const dx = P[0] - c.r[0], dy = P[1] - c.r[1], dz = P[2] - c.r[2];
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d < 1e-6) continue;
    v += K * c.q / d;
  }
  return v;
}

export function monopole(charges) { let Q = 0; for (const c of charges) Q += c.q; return Q; }
export function dipole(charges) {
  const p = [0, 0, 0];
  for (const c of charges) { p[0] += c.q * c.r[0]; p[1] += c.q * c.r[1]; p[2] += c.q * c.r[2]; }
  return p;
}
export function quadrupole(charges) {
  const Qm = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const c of charges) {
    const r2 = c.r[0] * c.r[0] + c.r[1] * c.r[1] + c.r[2] * c.r[2];
    for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) {
      Qm[i][j] += c.q * (3 * c.r[i] * c.r[j] - (i === j ? r2 : 0));
    }
  }
  return Qm;
}

// order: 0 monopole, 1 +dipole, 2 +quadrupole.
export function multipolePotential(charges, order, P) {
  const r = Math.sqrt(P[0] * P[0] + P[1] * P[1] + P[2] * P[2]);
  if (r < 1e-6) return 0;
  const rh = [P[0] / r, P[1] / r, P[2] / r];
  let v = K * monopole(charges) / r;
  if (order >= 1) {
    const p = dipole(charges);
    v += K * (p[0] * rh[0] + p[1] * rh[1] + p[2] * rh[2]) / (r * r);
  }
  if (order >= 2) {
    const Qm = quadrupole(charges);
    let s = 0;
    for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) s += Qm[i][j] * rh[i] * rh[j];
    v += K * 0.5 * s / (r * r * r);
  }
  return v;
}

// Distribution builders (small clusters near the origin).
export function buildDist(name, scale = 0.3) {
  // Off-centre single charge: the expansion is about the origin, so a
  // displaced charge genuinely needs higher multipoles to converge.
  if (name === 'monopole') return [{ q: 1, r: [scale, 0.3 * scale, 0] }];
  if (name === 'offset') return [{ q: 1, r: [scale, 0, 0] }, { q: 0.4, r: [-scale, scale, 0] }];
  if (name === 'dipole') return [{ q: 1, r: [scale, 0, 0] }, { q: -1, r: [-scale, 0, 0] }];
  if (name === 'quadrupole') return [
    { q: 1, r: [scale, scale, 0] }, { q: 1, r: [-scale, -scale, 0] },
    { q: -1, r: [scale, -scale, 0] }, { q: -1, r: [-scale, scale, 0] },
  ];
  if (name === 'octupole') return [
    { q: 1, r: [scale, scale, scale] }, { q: -1, r: [-scale, scale, scale] },
    { q: -1, r: [scale, -scale, scale] }, { q: 1, r: [-scale, -scale, scale] },
    { q: -1, r: [scale, scale, -scale] }, { q: 1, r: [-scale, scale, -scale] },
    { q: 1, r: [scale, -scale, -scale] }, { q: -1, r: [-scale, -scale, -scale] },
  ];
  return [{ q: 1, r: [0, 0, 0] }];
}
