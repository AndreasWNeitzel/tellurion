// Pulsar dispersion-measure dedispersion: the pure, testable physics.
// A radio pulse crossing the ionized interstellar medium is delayed
// by the cold-plasma dispersion law, low frequencies arriving later;
// de-dispersion shifts every channel back for an assumed DM and sums.
// Reference: Lorimer and Kramer, Handbook of Pulsar Astronomy, Ch. 4.

export const K_DM = 2.41e-4;            // MHz^2 pc^-1 cm^3 s, the constant

// Arrival delay (ms) at frequency f relative to f_ref, for a given DM.
export function delayMs(DM, fMHz, fRefMHz) {
  return (DM / K_DM) * (1 / (fMHz * fMHz) - 1 / (fRefMHz * fRefMHz)) * 1e3;
}

// Dispersed dynamic spectrum: per channel a Gaussian in time centred
// at the dispersed arrival time. Row 0 = highest frequency.
export function dynamicSpectrum(DM, widthMs, NCH, NT, fLo, fHi, Twin) {
  const data = new Float64Array(NCH * NT);
  const dt = Twin / NT;
  // A channel has finite time resolution (~ the sample time dt); the
  // recorded profile is never narrower than that, so the kernel must
  // span at least ~a bin or the discrete sum cannot concentrate.
  const sigma = Math.max(widthMs / 2.355, 0.9 * dt);
  for (let i = 0; i < NCH; i += 1) {
    const f = fHi - (fHi - fLo) * i / (NCH - 1);
    const tArr = Twin * 0.25 + delayMs(DM, f, fHi);
    for (let j = 0; j < NT; j += 1) {
      const u = (j * dt - tArr) / sigma;
      data[i * NT + j] = Math.exp(-0.5 * u * u);
    }
  }
  return data;
}

// Incoherent de-dispersion: shift each channel by -delay(DMguess) and
// sum across channels. Returns the NT-length time series.
export function dedisperse(data, DMguess, NCH, NT, fLo, fHi, Twin) {
  const out = new Float64Array(NT);
  const dt = Twin / NT;
  for (let i = 0; i < NCH; i += 1) {
    const f = fHi - (fHi - fLo) * i / (NCH - 1);
    const shift = delayMs(DMguess, f, fHi) / dt;
    const k0 = Math.floor(shift);
    const frac = shift - k0;
    for (let j = 0; j < NT; j += 1) {
      const a = j + k0, b = a + 1;
      const va = (a >= 0 && a < NT) ? data[i * NT + a] : 0;
      const vb = (b >= 0 && b < NT) ? data[i * NT + b] : 0;
      out[j] += va * (1 - frac) + vb * frac;
    }
  }
  return out;
}

// Signal-to-noise of a de-dispersed series: peak above the baseline
// in units of the off-pulse scatter. Maximal at the correct DM.
export function snr(series) {
  const n = series.length;
  const sorted = Array.from(series).sort((p, q) => p - q);
  const median = sorted[n >> 1];
  let s = 0, c = 0;
  for (let i = 0; i < n; i += 1) {
    const v = series[i];
    if (v < median + (sorted[n - 1] - median) * 0.3) { s += (v - median) * (v - median); c += 1; }
  }
  const rms = Math.sqrt(s / Math.max(c, 1)) || 1e-9;
  let peak = -Infinity;
  for (let i = 0; i < n; i += 1) if (series[i] > peak) peak = series[i];
  return (peak - median) / rms;
}
