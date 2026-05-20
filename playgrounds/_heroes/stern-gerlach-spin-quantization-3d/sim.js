// Headless physics for the Stern-Gerlach hero. A neutral atom of
// magnetic moment mu_z = -g mu_B m_J in an inhomogeneous field
// B_z(z) experiences a force F_z = mu_z * dB_z/dz that deflects it
// by Delta z = (F_z / (2 m)) (L / v)^2 along the gradient region of
// length L, plus a free-flight extension across the gap L_gap. A
// classical magnetic moment with continuous orientation would
// produce a continuous smear on the screen; the quantum-mechanical
// answer is that m_J takes 2J+1 discrete values, giving 2J+1
// discrete spots.
//
// Reference: Sakurai and Napolitano, Modern Quantum Mechanics, 2nd
// ed. CUP 2017, Section 1.1. Citation: `sakurai-napolitano`.
// Original experiment: Gerlach and Stern, Z. Phys. 9 (1922) 349.

export const J_OPTIONS = [
  { label: 'spin-1/2 (electron, silver atom)', J: 0.5 },
  { label: 'spin-1 (deuteron)', J: 1.0 },
  { label: 'spin-3/2 (lithium-7)', J: 1.5 },
  { label: 'spin-2 (deuteron orbital)', J: 2.0 },
];

// m_J values from -J to +J in steps of 1.
export function mJValues(J) {
  const out = [];
  const n = Math.round(2 * J + 1);
  for (let k = 0; k < n; k++) out.push(-J + k);
  return out;
}

// Deflection on the screen as a fraction of the apparatus height.
// Inputs in dimensionless units: gradient ~ |dB/dz| times atomic g
// factor, in atomic units L is the magnet length, L_gap is the gap
// from magnet exit to screen, v is the atom speed.
//
//   z_screen = (mu_z dBdz / m v^2) [L^2/2 + L L_gap]
//
// In dimensionless code units we use deflection = m_J * dBdz_norm.
export function deflection(m_J, dBdz_norm) {
  return m_J * dBdz_norm;
}

// Classical (continuous orientation) probability distribution of
// deflection: uniform in [- J, +J] (cos theta uniform on the sphere).
export function classicalDensity(z, dBdz_norm, J) {
  const zmax = J * dBdz_norm;
  if (Math.abs(z) > zmax) return 0;
  return 1 / (2 * zmax);
}

// Quantum density: sum of delta peaks at z = m_J * dBdz, all of
// equal weight. We approximate with a narrow Gaussian of width
// sigma (representing beam-collimation finite width).
export function quantumDensity(z, dBdz_norm, J, sigma = 0.06) {
  const ms = mJValues(J);
  let sum = 0;
  for (const m of ms) {
    const z0 = m * dBdz_norm;
    sum += Math.exp(-0.5 * ((z - z0) / sigma) ** 2) / (sigma * Math.sqrt(2 * Math.PI));
  }
  return sum / ms.length;  // normalize so integral is 1
}

// Magnetic field along z near the apparatus midline:
//   B_z(z) = B_0 + (dB/dz) * z, B_x = -(dB/dz) * x for divergence-free.
export function bField(x, y, z, B0, dBdz) {
  return { Bx: -dBdz * x, By: 0, Bz: B0 + dBdz * z };
}

// Sequential measurement: after filtering by S_z = +hbar/2, rotate
// the analyser by angle theta about y, the probability that
// the next S_z measurement returns +hbar/2 is cos^2(theta/2).
// For arbitrary J it is |<J,m'|R_y(theta)|J,m>|^2 = (d^J_{m'm}(theta))^2.
// We expose only the spin-1/2 case for the playground's secondary
// "rotation" mode.
export function sequentialProbabilityUp(thetaRad) {
  return Math.cos(thetaRad / 2) ** 2;
}
export function sequentialProbabilityDown(thetaRad) {
  return Math.sin(thetaRad / 2) ** 2;
}

// Deterministic Mulberry32 RNG.
export function makeRng(seed = 0xC0FFEE) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
