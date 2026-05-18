// Compact-binary inspiral and a LIGO-type interferometer (quadrupole /
// leading post-Newtonian; Peters 1964; Maggiore, Gravitational Waves
// Vol. 1; Abbott et al. 2016). SI units.
//
// Chirp mass    Mc = (m1 m2)^{3/5} / (m1+m2)^{1/5}
// Frequency     df/dt = (96/5) pi^{8/3} (G Mc/c^3)^{5/3} f^{11/3}
//   closed form f(tau) = (1/pi)(5/256)^{3/8}(G Mc/c^3)^{-5/8}
//                        tau^{-3/8},  tau = t_coal - t
// Strain        h(t) = (4/D)(G Mc/c^2)^{5/3}(pi f/c)^{2/3} cos Phi(t)
// LIGO          differential strain dL/L = h ; arm x +h L/2, y -h L/2
// Deterministic (seeded LCG for the matched-filter noise).

export const G = 6.67430e-11;
export const C = 2.99792458e8;
export const MSUN = 1.98892e30;
export const MPC = 3.0856775815e22;

export function chirpMass(m1, m2) {
  return Math.pow(m1 * m2, 0.6) / Math.pow(m1 + m2, 0.2);
}

// GW frequency at time-to-coalescence tau (s), Mc in kg.
export function frequencyOfTau(tau, Mc) {
  const k = (G * Mc) / (C * C * C);
  return (1 / Math.PI) * Math.pow(5 / 256, 3 / 8) * Math.pow(k, -5 / 8) * Math.pow(Math.max(tau, 1e-6), -3 / 8);
}
// Chirp rate df/dt at frequency f.
export function chirpRate(f, Mc) {
  const k = (G * Mc) / (C * C * C);
  return (96 / 5) * Math.pow(Math.PI, 8 / 3) * Math.pow(k, 5 / 3) * Math.pow(f, 11 / 3);
}
// Recover the chirp mass from a measured (f, df/dt) pair (noiseless).
export function recoverChirpMass(f, dfdt) {
  const k = Math.pow((5 / 96) * Math.pow(Math.PI, -8 / 3) * dfdt * Math.pow(f, -11 / 3), 3 / 5);
  return k * (C * C * C) / G;            // k = G Mc / c^3
}

// Strain amplitude (optimal orientation) at luminosity distance D (m).
export function strainAmplitude(f, Mc, D) {
  return (4 / D) * Math.pow(G * Mc / (C * C), 5 / 3) * Math.pow(Math.PI * f / C, 2 / 3);
}

// Inspiral waveform sampled on [0, tEnd] with coalescence at tCoal.
// Returns arrays {t, f, h, amp}. Phase by trapezoidal integration of
// 2 pi f.
export function waveform(m1kg, m2kg, Dm, { tCoal = 0.25, fLow = 20, n = 2000 } = {}) {
  const Mc = chirpMass(m1kg, m2kg);
  const t = new Float64Array(n), f = new Float64Array(n), h = new Float64Array(n), amp = new Float64Array(n);
  const dt = tCoal / n;
  let phase = 0;
  for (let i = 0; i < n; i += 1) {
    const tt = i * dt;
    const tau = Math.max(tCoal - tt, 5e-4);          // stop just before the singular merger
    let ff = frequencyOfTau(tau, Mc);
    ff = Math.max(ff, fLow);
    const a = strainAmplitude(ff, Mc, Dm);
    if (i > 0) phase += Math.PI * (f[i - 1] + ff) * dt; // trapezoid of 2 pi f
    t[i] = tt; f[i] = ff; amp[i] = a; h[i] = a * Math.cos(phase);
  }
  return { t, f, h, amp, Mc, dt };
}

// Interferometer differential arm length: a + polarised wave optimally
// oriented stretches one arm and squeezes the other by h L / 2.
export function armResponse(h, L = 4000) {
  return { dLx: 0.5 * h * L, dLy: -0.5 * h * L, dLdiff: h * L };
}

// Deterministic pseudo-noise (seeded LCG, Gaussian via Box-Muller).
function lcg(seed) {
  let s = seed >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
}
function gaussianNoise(n, sigma, seed) {
  const r = lcg(seed), out = new Float64Array(n);
  for (let i = 0; i < n; i += 2) {
    const u1 = Math.max(1e-12, r()), u2 = r();
    const mag = sigma * Math.sqrt(-2 * Math.log(u1));
    out[i] = mag * Math.cos(2 * Math.PI * u2);
    if (i + 1 < n) out[i + 1] = mag * Math.sin(2 * Math.PI * u2);
  }
  return out;
}

// Matched filter: correlate noisy data with a template at lag samples.
// Returns the SNR series over lags and its peak.
export function matchedFilter(m1kg, m2kg, Dm, tmplMc, { noiseSigmaRel = 0.6, seed = 0xC0FFEE } = {}) {
  const sig = waveform(m1kg, m2kg, Dm);
  const peakAmp = Math.max(...sig.amp);
  const noise = gaussianNoise(sig.h.length, noiseSigmaRel * peakAmp, seed);
  const data = sig.h.map((v, i) => v + noise[i]);
  // template: unit-norm waveform with chirp mass tmplMc (same D, masses
  // scaled to give that Mc with equal mass for simplicity)
  const mEq = tmplMc / Math.pow(2, -0.2);             // equal-mass m with chirpMass = tmplMc
  const tmpl = waveform(mEq, mEq, Dm).h;
  let tn = 0; for (const v of tmpl) tn += v * v; tn = Math.sqrt(tn);
  const N = data.length, maxLag = Math.floor(N * 0.4);
  const snr = [];
  let best = -Infinity, bestLag = 0;
  for (let lag = -maxLag; lag <= maxLag; lag += 4) {
    let s = 0;
    for (let i = 0; i < N; i += 1) { const j = i + lag; if (j >= 0 && j < N) s += data[i] * tmpl[j]; }
    const v = s / (tn + 1e-30);
    snr.push({ lag, snr: v });
    if (v > best) { best = v; bestLag = lag; }
  }
  return { snr, peak: best, peakLag: bestLag };
}
