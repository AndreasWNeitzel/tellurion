// Rectangular metallic waveguide (a x b cross-section, vacuum-filled).
// TE_mn and TM_mn modes have cutoff frequency
//   f_c = (c/2) sqrt( (m/a)^2 + (n/b)^2 ).
// Above cutoff the propagation constant
//   beta = (2 pi / c) sqrt( f^2 - f_c^2 )
// is real (a travelling wave, guide wavelength 2 pi / beta); below
// cutoff beta is imaginary and the field is evanescent (decay
// alpha = |beta|). TE needs (m, n) not both zero; TM needs m >= 1 and
// n >= 1. For a > b the dominant mode is TE10. Headless and
// deterministic. Reference: Jackson, Classical Electrodynamics
// (3rd ed.), Ch. 8.

export const C = 2.99792458e8;

// Cutoff frequency (Hz) for mode (m, n) in a guide of width a, height
// b (metres).
export function cutoffFreq(m, n, a, b) {
  return (C / 2) * Math.sqrt((m / a) ** 2 + (n / b) ** 2);
}

export function modeExists(type, m, n) {
  if (type === 'TE') return !(m === 0 && n === 0);
  return m >= 1 && n >= 1;                       // TM
}

// Propagation: returns { propagating, beta, alpha, lambdaG } where
// beta is the real propagation constant (rad/m) when propagating and
// alpha the evanescent decay constant (1/m) when below cutoff.
export function propagation(f, m, n, a, b) {
  const fc = cutoffFreq(m, n, a, b);
  const k0 = 2 * Math.PI * f / C;
  const kc = 2 * Math.PI * fc / C;
  if (f > fc) {
    const beta = Math.sqrt(k0 * k0 - kc * kc);
    return { propagating: true, fc, beta, alpha: 0, lambdaG: 2 * Math.PI / beta };
  }
  const alpha = Math.sqrt(kc * kc - k0 * k0);
  return { propagating: false, fc, beta: 0, alpha, lambdaG: Infinity };
}

// Dominant-mode helper: the lowest cutoff over a small mode set.
export function dominantMode(a, b, type = 'TE') {
  let best = null;
  for (let m = 0; m <= 3; m += 1) for (let n = 0; n <= 3; n += 1) {
    if (!modeExists(type, m, n)) continue;
    const fc = cutoffFreq(m, n, a, b);
    if (!best || fc < best.fc - 1e-3) best = { m, n, fc };
  }
  return best;
}

// Transverse field amplitude of the chosen mode at (x, y) in [0,a]x
// [0,b]. For TE the dominant transverse E component, for TM the E_z
// envelope; both vanish on the conducting walls as required.
export function fieldAt(type, m, n, x, y, a, b) {
  const cx = Math.cos(m * Math.PI * x / a), sx = Math.sin(m * Math.PI * x / a);
  const cy = Math.cos(n * Math.PI * y / b), sy = Math.sin(n * Math.PI * y / b);
  if (type === 'TM') return sx * sy;            // E_z ~ sin sin (zero on all walls)
  // TE: transverse E ~ partial of H_z; the dominant pattern is the
  // mixed sin/cos that vanishes on the appropriate walls
  if (m === 0) return cx * sy;
  if (n === 0) return sx * cy;
  return sx * cy + cx * sy;
}

// Sorted list of the lowest cutoff modes (for the spectrum bar).
export function modeSpectrum(a, b, maxIdx = 3) {
  const out = [];
  for (const type of ['TE', 'TM']) {
    for (let m = 0; m <= maxIdx; m += 1) for (let n = 0; n <= maxIdx; n += 1) {
      if (!modeExists(type, m, n)) continue;
      out.push({ type, m, n, fc: cutoffFreq(m, n, a, b) });
    }
  }
  return out.sort((p, q) => p.fc - q.fc);
}
