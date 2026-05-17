// Closed-form plasma-wave dispersion relations (cold and warm fluid
// theory). Each is exact algebra, so the cutoffs, resonances and
// limiting forms hold to round-off and the run is deterministic.
// Reference: Stix, Waves in Plasmas, AIP 1992 (`stix1992`); Swanson,
// Plasma Waves, 2nd ed. (`swanson2003`); Chen, Introduction to Plasma
// Physics and Controlled Fusion, 2nd ed. (`chen1984`).

// SI constants (for the plasma-frequency formula).
export const E_CHARGE = 1.602176634e-19;
export const EPS0 = 8.8541878128e-12;
export const M_E = 9.1093837015e-31;
export const C_LIGHT = 2.99792458e8;

// Electron plasma frequency omega_p = sqrt(n e^2 / eps0 m_e).
export function plasmaFrequency(n) {
  return Math.sqrt(n * E_CHARGE * E_CHARGE / (EPS0 * M_E));
}
export function upperHybrid(wp, wc) { return Math.sqrt(wp * wp + wc * wc); }
// X-mode right/left cutoffs: w_{R,L} = (+- wc + sqrt(wc^2 + 4 wp^2)) / 2.
export function xCutoffs(wp, wc) {
  const s = Math.sqrt(wc * wc + 4 * wp * wp);
  return { wL: (-wc + s) / 2, wR: (wc + s) / 2 };
}

// Bohm-Gross Langmuir branch: w^2 = wp^2 + 3 k^2 vth^2.
export function langmuir(k, wp, vth) { return Math.sqrt(wp * wp + 3 * k * k * vth * vth); }

// Ion-acoustic: w = k cs / sqrt(1 + (k lambdaD)^2).
export function ionAcoustic(k, cs, lambdaD) {
  return k * cs / Math.sqrt(1 + (k * lambdaD) ** 2);
}

// O-mode (ordinary EM): w^2 = wp^2 + c^2 k^2 (cutoff at w = wp, k = 0).
export function oMode(k, wp, c) { return Math.sqrt(wp * wp + c * c * k * k); }

// O-mode phase and group speed: v_ph v_gr = c^2 exactly.
export function oModeSpeeds(k, wp, c) {
  if (k === 0) return { vph: Infinity, vgr: 0 };
  const w = oMode(k, wp, c);
  return { vph: w / k, vgr: c * c * k / w };
}

// Alfven wave: w = k v_A (low-frequency MHD limit).
export function alfven(k, vA) { return k * vA; }
export function alfvenSpeed(B, rho) { return B / Math.sqrt(4 * Math.PI * 1e-7 * rho); }

// X-mode (extraordinary), cold plasma. The refractive index:
//   (c k / w)^2 = 1 - wp^2 (w^2 - wp^2) / [ w^2 (w^2 - w_UH^2) ].
// Returns (c k)^2 / w0^2-normalised k^2; negative => evanescent
// (the stop-band between a cutoff and the upper-hybrid resonance).
export function xModeK2(w, wp, wc, c) {
  const wUH2 = wp * wp + wc * wc;
  const n2 = 1 - (wp * wp * (w * w - wp * wp)) / (w * w * (w * w - wUH2));
  return (w * w / (c * c)) * n2;                     // = k^2 (sign carries propagation)
}
export function xModePropagates(w, wp, wc, c) { return xModeK2(w, wp, wc, c) > 0; }

// Dispersion sampler for plotting: returns {k, w} arrays for a mode.
export function sample(mode, p, n = 240) {
  const out = [];
  const { wp = 1, c = 20, vth = 0.05, cs = 0.02, lambdaD = 0.3, vA = 0.3, wc = 0.6 } = p;
  if (mode === 'xmode') {
    // X-mode is single-valued in w; sweep w, keep propagating branches.
    const wmax = 3 * Math.max(wp, wc) + 1;
    for (let i = 1; i <= n; i += 1) {
      const w = wmax * i / n;
      const k2 = xModeK2(w, wp, wc, c);
      if (k2 > 0) out.push({ k: Math.sqrt(k2), w });
    }
    return out;
  }
  const kmax = mode === 'omode' ? 0.6 : (mode === 'alfven' ? 8 : 30);
  for (let i = 0; i <= n; i += 1) {
    const k = kmax * i / n;
    let w;
    if (mode === 'langmuir') w = langmuir(k, wp, vth);
    else if (mode === 'ionacoustic') w = ionAcoustic(k, cs, lambdaD);
    else if (mode === 'omode') w = oMode(k, wp, c);
    else if (mode === 'alfven') w = alfven(k, vA);
    else w = oMode(k, wp, c);
    out.push({ k, w });
  }
  return out;
}
