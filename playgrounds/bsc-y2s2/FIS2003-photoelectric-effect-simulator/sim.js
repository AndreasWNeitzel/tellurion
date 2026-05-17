// The photoelectric effect, Einstein 1905. A photon of frequency nu
// carries energy E = h nu; striking a metal of work function phi it
// ejects an electron with maximum kinetic energy
//   K_max = h nu - phi   (only if h nu > phi).
// Below the threshold nu0 = phi / h no electrons are emitted at any
// intensity. The stopping voltage is V_stop = K_max / e, linear in nu
// with universal slope h/e; intensity sets the saturation current but
// not K_max. Working in eV and PHz keeps the numbers near unity.
// Headless and deterministic. Reference: Eisberg and Resnick, Quantum
// Physics of Atoms (2nd ed.), Sec. 2.2-2.3.

export const H_EV = 4.135667696e-15;          // Planck constant (eV s)
export const H_OVER_E = 4.135667696e-15;      // h/e (V s) = h in eV s, numerically

// metal work functions (eV)
export const METALS = { cesium: 2.14, sodium: 2.28, zinc: 4.30, copper: 4.65, platinum: 5.65 };

// photon energy (eV) for a frequency given in PHz (1e15 Hz)
export function photonEnergy(nuPHz) { return H_EV * (nuPHz * 1e15); }

export function thresholdFreqPHz(phi) { return phi / H_EV / 1e15; }   // nu0 (PHz)

// Maximum photoelectron kinetic energy (eV); <= 0 means no emission.
export function kMax(nuPHz, phi) { return photonEnergy(nuPHz) - phi; }

export function emits(nuPHz, phi) { return kMax(nuPHz, phi) > 0; }

// Stopping voltage (V): numerically equal to K_max in eV.
export function stoppingVoltage(nuPHz, phi) { return Math.max(0, kMax(nuPHz, phi)); }

// Photocurrent vs applied voltage V (retarding for V < 0). Zero when
// no emission. For V >= -V_stop electrons reach the anode and the
// current rises to the saturation value (proportional to intensity);
// below -V_stop it is exactly zero (independent of intensity).
export function photocurrent(V, nuPHz, phi, intensity) {
  if (!emits(nuPHz, phi)) return 0;
  const Vs = stoppingVoltage(nuPHz, phi);
  if (V <= -Vs) return 0;
  const Isat = intensity;
  // smooth approach to saturation above the cutoff
  const x = (V + Vs);
  return Isat * (1 - Math.exp(-x / (0.35 + 0.15 * Vs)));
}

// Einstein line sampled over a frequency range: V_stop(nu).
export function einsteinLine(phi, nu0PHz, nu1PHz, n = 64) {
  const pts = [];
  for (let i = 0; i <= n; i += 1) {
    const nu = nu0PHz + (nu1PHz - nu0PHz) * (i / n);
    pts.push([nu, stoppingVoltage(nu, phi)]);
  }
  return pts;
}

// Fit slope and intercept of V_stop vs nu (Hz) over the emitting
// range, returning {slope, nu0}; slope should equal h/e.
export function fitEinstein(phi, nuLoPHz, nuHiPHz) {
  const xs = [], ys = [];
  for (let i = 0; i <= 40; i += 1) {
    const nuP = nuLoPHz + (nuHiPHz - nuLoPHz) * (i / 40);
    if (!emits(nuP, phi)) continue;
    xs.push(nuP * 1e15); ys.push(stoppingVoltage(nuP, phi));
  }
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i += 1) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
  const slope = sxy / sxx, intercept = my - slope * mx;
  return { slope, nu0: -intercept / slope };
}
