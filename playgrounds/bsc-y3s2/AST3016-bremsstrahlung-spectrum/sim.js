// Thermal bremsstrahlung physics: closed-form emissivity used for the
// theoretical curve overlay, AND a small particle-engine module that
// integrates an ensemble of electrons in a softened Coulomb potential
// of fixed ions. The animation panel renders that ensemble; the
// histogram of emitted-photon energies converges to the theoretical
// emissivity. Reference: Rybicki-Lightman, Radiative Processes in
// Astrophysics, Ch. 5 (`rybickilightman1979`); Maxwell-Boltzmann from
// Carroll-Ostlie, Modern Astrophysics, Ch. 12 (`carroll-ostlie`).

export const H = 6.62607015e-34, KB = 1.380649e-23;

// Free-free emissivity for an optically-thin thermal plasma. SI but
// with the conventional 6.8e-38 erg-cgs prefactor kept so the slider
// labels read like a textbook.
export function emissivity(nu, T, n_e, n_i, Z = 1, g_ff = 1.2) {
  const factor = 6.8e-38 * Math.pow(T, -0.5) * Z * Z * n_e * n_i * g_ff;
  const exp = Math.exp(-H * nu / (KB * T));
  return factor * exp;
}

// Photon-energy cutoff h nu_c = k_B T, the thermometer of the
// bremsstrahlung spectrum.
export function cutoffHz(T) { return KB * T / H; }

// Box-Muller standard normal.
export function gauss(rng) {
  const u1 = 1 - rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// Maxwell-Boltzmann speed: |v| = sqrt(vx^2 + vy^2) with vx, vy each
// gaussian with variance kT/m. We work in dimensionless code units
// (m=1, the temperature slider sets the variance). Returns vx, vy.
export function maxwellVelocity(sigma, rng) {
  return [sigma * gauss(rng), sigma * gauss(rng)];
}

// Exponential photon-energy draw (Bethe-Heitler thermal envelope:
// dN/dE ~ exp(-E/kT)). Returns a dimensionless E.
export function photonEnergyExp(kT, rng) {
  return -kT * Math.log(1 - rng());
}

// LCG, used to keep the ensemble deterministic when --deterministic
// is set by the gate.
export function makeRng(seed) {
  let s = (seed | 0) || 0xC0FFEE;
  return () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
  };
}

// One-step semi-implicit Euler under softened Coulomb attraction from
// a list of ions. Position-dependent acceleration:
//   a = -K * sum_i (r - r_i) / (|r - r_i|^2 + soft^2)^1.5
// where K = Z e^2 / m in code units. Returns the magnitude of the
// acceleration (used to detect periapsis events for radiation
// emission).
export function step(electron, ions, K, soft, dt) {
  let ax = 0, ay = 0;
  for (const ion of ions) {
    const dx = electron.x - ion.x;
    const dy = electron.y - ion.y;
    const r2 = dx * dx + dy * dy + soft * soft;
    const inv = K / (r2 * Math.sqrt(r2));
    ax -= inv * dx;
    ay -= inv * dy;
  }
  electron.vx += ax * dt;
  electron.vy += ay * dt;
  electron.x += electron.vx * dt;
  electron.y += electron.vy * dt;
  return Math.hypot(ax, ay);
}
