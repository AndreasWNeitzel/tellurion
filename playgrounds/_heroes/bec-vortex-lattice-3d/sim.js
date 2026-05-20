// Headless physics for the Bose-Einstein condensate vortex-lattice
// hero. A 2D harmonically-trapped condensate, rotated at angular
// frequency Omega, develops an Abrikosov triangular lattice of
// quantized vortices in the Thomas-Fermi density profile. The
// number density of vortices is set by Feynman's relation
//
//   n_v = m Omega / (pi hbar) = 2 Omega / (h/m)        [1/area]
//
// giving inter-vortex spacing
//
//   d_v = (2/sqrt(3))^{1/2} / sqrt(n_v)
//       = sqrt(2/(sqrt(3) n_v))                         [triangular lattice]
//
// The vortex core has size set by the healing length
//
//   xi = hbar / sqrt(2 m mu)
//
// where mu = (1/2) hbar omega_trap (15 N a_s / a_ho)^{2/5} is the
// Thomas-Fermi chemical potential of a 2D condensate of N atoms
// with s-wave scattering length a_s and harmonic-oscillator length
// a_ho = sqrt(hbar / (m omega_trap)).
//
// We work in dimensionless trap units: lengths in a_ho, frequencies
// in omega_trap. Then mu_tilde = (1/2) (15 N a_s / a_ho)^{2/5} and
// xi_tilde = 1 / sqrt(2 mu_tilde). The Thomas-Fermi radius is
// R_TF = sqrt(2 mu_tilde) a_ho. Above the centrifugal limit
// Omega >= omega_trap, the trap is unstable; we cap at Omega_max =
// 0.95 omega_trap.
//
// References:
//   Pitaevskii and Stringari, Bose-Einstein Condensation and
//   Superfluidity, OUP 2016, Chapter 11. `pitaevskii-stringari-bec`
//   Pethick and Smith, Bose-Einstein Condensation in Dilute Gases,
//   2nd ed. CUP 2008, Chapter 9. `pethick-smith-bec`
//   Cooper, Adv. Phys. 57 (2008) 539 (rotating-trap vortex lattices).

export const OMEGA_MAX = 0.95;     // rotation, in units of omega_trap
export const NA_DEFAULT = 1e5;     // N * a_s / a_ho (dimensionless interaction)
export const SCATTERING_MIN = 0.001;
export const SCATTERING_MAX = 0.05;

export function chemicalPotential(N_aS_ratio) {
  // mu_tilde = (1/2) (15 N a_s / a_ho)^{2/5}
  return 0.5 * Math.pow(15 * N_aS_ratio, 0.4);
}

export function thomasFermiRadius(N_aS_ratio) {
  // R_TF / a_ho = sqrt(2 mu_tilde) = sqrt(2 * 0.5 * (15 N a)^{2/5}) = (15 N a)^{1/5}
  return Math.pow(15 * N_aS_ratio, 0.2);
}

export function healingLength(N_aS_ratio) {
  return 1 / Math.sqrt(2 * chemicalPotential(N_aS_ratio));
}

// Feynman vortex number density (vortices per a_ho^2):
//   n_v = Omega / pi   (in units of m omega_trap / hbar = 1/a_ho^2)
export function vortexAreaDensity(omega) {
  return Math.max(0, omega) / Math.PI;
}

// Number of vortices inside the Thomas-Fermi disk.
export function vortexCount(omega, N_aS_ratio) {
  const R = thomasFermiRadius(N_aS_ratio);
  const A = Math.PI * R * R;
  return Math.max(0, Math.round(A * vortexAreaDensity(omega)));
}

// Inter-vortex spacing (triangular lattice).
export function vortexSpacing(omega) {
  const nv = vortexAreaDensity(omega);
  if (nv <= 0) return Infinity;
  return Math.sqrt(2 / (Math.sqrt(3) * nv));
}

// Place N vortices on an Abrikosov triangular lattice clipped to the
// Thomas-Fermi disk. Returns array of {x, y}.
export function vortexLattice(omega, N_aS_ratio) {
  const d = vortexSpacing(omega);
  if (!isFinite(d) || d <= 0) return [];
  const R = thomasFermiRadius(N_aS_ratio);
  const positions = [];
  const Ny = Math.ceil(2 * R / (d * Math.sqrt(3) / 2));
  for (let j = -Ny; j <= Ny; j++) {
    const y = j * d * Math.sqrt(3) / 2;
    const xOff = (j & 1) ? d / 2 : 0;
    const Nx = Math.ceil((R + 0.5 * d) / d);
    for (let i = -Nx; i <= Nx; i++) {
      const x = i * d + xOff;
      if (x * x + y * y < (R - 0.5 * d) * (R - 0.5 * d)) {
        positions.push({ x, y });
      }
    }
  }
  return positions;
}

// Local density: n(r) = n_TF(r) * Pi_v |psi_core|^2 where the core is
// modeled by tanh^2(|r-r_v|/xi).
export function density(x, y, omega, N_aS_ratio, lattice) {
  const R = thomasFermiRadius(N_aS_ratio);
  const r2 = x * x + y * y;
  if (r2 >= R * R) return 0;
  const n_TF = 1 - r2 / (R * R);                       // unit-normalized
  const xi = healingLength(N_aS_ratio);
  let core = 1;
  for (const v of lattice) {
    const dx = x - v.x, dy = y - v.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const t = Math.tanh(d / xi);
    core *= t * t;
  }
  return n_TF * core;
}

// Total phase argument from vortex windings. Each vortex contributes
// +2 pi winding (singly-quantized).
export function phase(x, y, lattice) {
  let phi = 0;
  for (const v of lattice) {
    phi += Math.atan2(y - v.y, x - v.x);
  }
  return phi;
}

// Total angular momentum L_z / (N hbar) ~ number of vortices /
// vortex_per_atom = N_v * <r_v^2> / R_TF^2 (approximate). For a full
// vortex lattice in solid-body rotation, <L_z/N> = m Omega <r^2>.
export function angularMomentumPerAtom(omega, N_aS_ratio) {
  const R = thomasFermiRadius(N_aS_ratio);
  // <r^2>_TF = (1/2) R_TF^2 for 2D inverted parabola.
  const r2 = 0.5 * R * R;
  return omega * r2;
}
