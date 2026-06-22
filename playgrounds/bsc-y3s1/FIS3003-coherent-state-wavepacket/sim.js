// The Glauber coherent state of a harmonic oscillator: a minimum-uncertainty Gaussian
// that oscillates in the well like a classical particle without ever spreading.
// Natural units hbar = m = 1, oscillator frequency omega. The packet has the fixed
// ground-state width sigma_0 = sqrt(1/(2 omega)); its centre and mean momentum follow
// the classical orbit of amplitude x0:
//   <x>(t) = x0 cos(omega t),   <p>(t) = -omega x0 sin(omega t).
// Reference: Griffiths, Introduction to Quantum Mechanics, 3rd ed., Problem 3.35;
// Cohen-Tannoudji, Quantum Mechanics, Complement G_V.

export function sigma0(omega) { return Math.sqrt(1 / (2 * omega)); }
export function meanX(x0, omega, t) { return x0 * Math.cos(omega * t); }
export function meanP(x0, omega, t) { return -omega * x0 * Math.sin(omega * t); }

// Probability density |psi(x,t)|^2: a normalized Gaussian of fixed width sigma_0
// centred on <x>(t). With sigma_0^2 = 1/(2 omega) this is sqrt(omega/pi) e^{-omega u^2}.
export function density(x, x0, omega, t) {
  const u = x - meanX(x0, omega, t);
  return Math.sqrt(omega / Math.PI) * Math.exp(-omega * u * u);
}

// Real part of the wavefunction: the Gaussian envelope times a carrier whose local
// wavenumber is the mean momentum, so it wiggles fastest at the centre of the swing.
export function rePsi(x, x0, omega, t) {
  const xc = meanX(x0, omega, t), pc = meanP(x0, omega, t);
  const env = Math.pow(omega / Math.PI, 0.25) * Math.exp(-omega * (x - xc) * (x - xc) / 2);
  const theta = pc * x - 0.5 * pc * xc - 0.5 * omega * t;
  return env * Math.cos(theta);
}

export function potential(x, omega) { return 0.5 * omega * omega * x * x; }
// Classical oscillation energy (the mechanical part) and total energy including the
// zero-point omega/2. For amplitude x0, |alpha|^2 = (1/2) omega x0^2.
export function energyClassical(x0, omega) { return 0.5 * omega * omega * x0 * x0; }
export function energyTotal(x0, omega) { return energyClassical(x0, omega) + 0.5 * omega; }
export function alphaMag(x0, omega) { return x0 * Math.sqrt(omega / 2); }

// Variance of position by quadrature, used to check the packet never spreads.
export function positionVariance(x0, omega, t, lo = -14, hi = 14, n = 4000) {
  let m0 = 0, m1 = 0, m2 = 0;
  const h = (hi - lo) / n;
  for (let i = 0; i <= n; i += 1) {
    const x = lo + i * h, w = (i === 0 || i === n) ? 0.5 : 1;
    const p = density(x, x0, omega, t) * w;
    m0 += p; m1 += p * x; m2 += p * x * x;
  }
  const mean = m1 / m0;
  return m2 / m0 - mean * mean;
}
