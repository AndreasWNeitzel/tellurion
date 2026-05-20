// Headless physics for the dark-matter halo + galactic rotation curve
// hero. Three mass components contribute to the enclosed mass M(<r) and
// hence the circular speed v_c(r) = sqrt(G M(<r) / r):
//
//   - bulge: a Hernquist profile rho_b = M_b a_b / (2 pi r (r + a_b)^3),
//     enclosed mass M_b r^2 / (r + a_b)^2;
//   - disk: an exponential disk, but for the rotation curve we
//     approximate the enclosed mass as an exponential cylinder:
//     M_d * [1 - (1 + r/h_d) exp(-r/h_d)];
//   - dark halo: the NFW profile rho_DM = rho_0 / (x (1 + x)^2) with
//     x = r/r_s; enclosed mass M_DM * [ln(1+x) - x/(1+x)] / mu(c),
//     where c = R_vir / r_s and mu(c) = ln(1+c) - c/(1+c).
//
// References: Navarro, Frenk, White, ApJ 462 (1996) 563 (`navarro-frenk-white-1996`);
// Binney and Tremaine, Galactic Dynamics, 2nd ed., Princeton 2008,
// Ch. 2 (`binney-tremaine-2008`). The flat-rotation-curve evidence
// for dark matter is Rubin and Ford, ApJ 159 (1970) 379.

export const G = 1.0;     // gravitational constant in code units

// Hernquist (bulge) enclosed mass.
export function massBulge(r, M_b, a_b) {
  return M_b * r * r / Math.pow(r + a_b, 2);
}

// Exponential-disk enclosed mass (1D approximation).
export function massDisk(r, M_d, h_d) {
  const x = r / h_d;
  return M_d * (1 - (1 + x) * Math.exp(-x));
}

// NFW dark halo enclosed mass.
export function massDM(r, M_DM, r_s, c) {
  const mu_c = Math.log(1 + c) - c / (1 + c);
  const x = r / r_s;
  const mu_x = Math.log(1 + x) - x / (1 + x);
  return M_DM * mu_x / mu_c;
}

// Total enclosed mass.
export function massTotal(r, p) {
  return massBulge(r, p.M_b, p.a_b) + massDisk(r, p.M_d, p.h_d)
    + (p.includeDM ? massDM(r, p.M_DM, p.r_s, p.c) : 0);
}

// Circular speed v_c(r) = sqrt(G M(<r) / r). Returns 0 at r=0.
export function vCirc(r, p) {
  if (r < 1e-6) return 0;
  return Math.sqrt(G * massTotal(r, p) / r);
}

// Splits: visible-only vs visible+DM (for the overlay comparison).
export function vCircVisible(r, p) {
  if (r < 1e-6) return 0;
  const M = massBulge(r, p.M_b, p.a_b) + massDisk(r, p.M_d, p.h_d);
  return Math.sqrt(G * M / r);
}

// Asymptotic Keplerian decline v ~ 1/sqrt(r) once outside the disk.
export function vKeplerian(r, M_total) {
  return Math.sqrt(G * M_total / r);
}

// Default Milky Way-like parameters in code units.
export const MW_PARAMS = {
  M_b: 1.0, a_b: 0.7,           // bulge
  M_d: 5.0, h_d: 3.0,           // disk
  M_DM: 80.0, r_s: 20.0, c: 12, // dark matter halo (NFW)
  includeDM: true,
};
