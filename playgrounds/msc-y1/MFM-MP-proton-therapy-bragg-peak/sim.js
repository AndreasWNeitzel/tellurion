// Proton therapy depth dose: the Bragg-Kleeman range-energy rule, the
// pristine Bragg peak with Gaussian range straggling, the spread-out
// Bragg peak, and the photon depth dose for contrast (Wilson 1946;
// Bortfeld 1997). Depths in cm, energy in MeV. Deterministic, no RNG.

export const BK_ALPHA = 0.0022;                          // cm / MeV^p (water)
export const BK_P = 1.77;                                // Bragg-Kleeman exponent

// Continuous-slowing-down range R = alpha E0^p.
export const braggKleemanRange = (E0) => BK_ALPHA * Math.pow(E0, BK_P);
// Inverse: the energy needed to reach a given range.
export const energyForRange = (R) => Math.pow(R / BK_ALPHA, 1 / BK_P);
// Range straggling sigma (Bortfeld 1997, water).
export const stragglingSigma = (R) => 0.012 * Math.pow(R, 0.935);

// Pristine Bragg depth dose for a proton beam of energy E0, sampled at
// depths z (cm). Unstraggled D0 ~ (R - z)^{1/p - 1} for z < R; convolved
// with a Gaussian of width sigma(R); a mild fluence loss with depth.
export function protonDepthDose(E0, z, eSpread = 0) {
  const R = braggKleemanRange(E0);
  // total width: range straggling plus the beam energy spread folded
  // through dR/dE = p R / E0 (a 1-2 percent spread dominates the peak
  // width of a clinical beam and is what lets a SOBP flatten).
  const sigR = stragglingSigma(R);
  const sigE = eSpread > 0 ? BK_P * R / E0 * eSpread * E0 : 0; // = p R eSpread
  const sig = Math.hypot(sigR, sigE);
  const expo = 1 / BK_P - 1;                              // ~ -0.435
  const d0 = (zz) => {
    if (zz >= R) return 0;
    const fluence = 1 - 0.6 * zz / R;                      // primary attenuation
    return Math.max(0, fluence) * Math.pow(R - zz, expo);
  };
  const out = new Float64Array(z.length);
  const NK = 80;                                          // fine: resolve the (R-z) cusp
  for (let i = 0; i < z.length; i += 1) {
    const zi = z[i];
    let acc = 0, wsum = 0;
    for (let k = -NK; k <= NK; k += 1) {                   // Gaussian convolution
      const dz = (k / NK) * 5 * sig;
      const w = Math.exp(-0.5 * (dz / sig) ** 2);
      acc += w * d0(zi - dz);
      wsum += w;
    }
    out[i] = acc / wsum;
  }
  // normalise to unit peak
  let mx = 0; for (const v of out) mx = Math.max(mx, v);
  if (mx > 0) for (let i = 0; i < out.length; i += 1) out[i] /= mx;
  return { dose: out, R, sigma: sig };
}

// Photon (megavoltage X-ray) percentage depth dose: a build-up region
// to z_max then near-exponential attenuation; always positive (exit
// dose), in contrast to the proton beam.
export function xrayDepthDose(z, { zmax = 1.5, mu = 0.045, zb = 0.5 } = {}) {
  const out = new Float64Array(z.length);
  let mx = 0;
  for (let i = 0; i < z.length; i += 1) {
    const zz = z[i];
    const v = (1 - Math.exp(-zz / zb)) * Math.exp(-mu * Math.max(0, zz - zmax));
    out[i] = v; mx = Math.max(mx, v);
  }
  if (mx > 0) for (let i = 0; i < out.length; i += 1) out[i] /= mx;
  return out;
}

// Spread-out Bragg peak: a weighted sum of pristine peaks whose ranges
// span [Rmin, Rmax]. Weights are fitted (non-negative, deterministic
// coordinate descent) to flatten the dose over the target plateau.
export function sobp(E0max, nPeaks, plateauFrac, z, eSpread = 0.018) {
  const Rmax = braggKleemanRange(E0max), Rmin = Rmax * (1 - plateauFrac);
  const peaks = [], energies = [];
  for (let k = 0; k < nPeaks; k += 1) {
    const R = Rmin + (Rmax - Rmin) * k / (nPeaks - 1);
    const E = energyForRange(R);
    energies.push(E);
    peaks.push(protonDepthDose(E, z, eSpread).dose);
  }
  const w = new Float64Array(nPeaks).fill(1 / nPeaks);
  // flatten strictly between the shallowest and deepest peak depths,
  // excluding the proximal rise and the distal (broadened) edge
  const sigD = Math.hypot(stragglingSigma(Rmax), BK_P * Rmax * eSpread);
  const lo = Rmin + 0.5 * sigD, hi = Rmax - 1.5 * sigD;
  const inPlateau = z.map((zz) => zz >= lo && zz <= hi);
  const target = 1;
  for (let it = 0; it < 1500; it += 1) {
    for (let k = 0; k < nPeaks; k += 1) {
      let num = 0, den = 0;
      for (let i = 0; i < z.length; i += 1) {
        if (!inPlateau[i]) continue;
        let s = 0; for (let j = 0; j < nPeaks; j += 1) if (j !== k) s += w[j] * peaks[j][i];
        num += peaks[k][i] * (target - s);
        den += peaks[k][i] * peaks[k][i];
      }
      w[k] = den > 0 ? Math.max(0, num / den) : 0;
    }
    // light smoothing: clinical SOBP weights vary smoothly with depth
    if (it > 50 && it % 4 === 0) {
      const sm = Float64Array.from(w);
      for (let k = 1; k < nPeaks - 1; k += 1) sm[k] = 0.25 * w[k - 1] + 0.5 * w[k] + 0.25 * w[k + 1];
      w.set(sm);
    }
  }
  const dose = new Float64Array(z.length);
  for (let i = 0; i < z.length; i += 1) {
    let s = 0; for (let k = 0; k < nPeaks; k += 1) s += w[k] * peaks[k][i];
    dose[i] = s;
  }
  let mx = 0; for (const v of dose) mx = Math.max(mx, v);
  if (mx > 0) for (let i = 0; i < dose.length; i += 1) dose[i] /= mx;
  return { dose, weights: w, energies, peaks, Rmin, Rmax };
}

export function depthGrid(zmax, n) {
  const z = new Float64Array(n + 1);
  for (let i = 0; i <= n; i += 1) z[i] = zmax * i / n;
  return z;
}
// Depth of the maximum of a depth-dose curve.
export function peakDepth(dose, z) {
  let im = 0; for (let i = 1; i < dose.length; i += 1) if (dose[i] > dose[im]) im = i;
  return z[im];
}
// Distal depth where the dose falls back through frac of its peak.
export function distalDepth(dose, z, frac = 0.9) {
  let im = 0; for (let i = 1; i < dose.length; i += 1) if (dose[i] > dose[im]) im = i;
  const peak = dose[im];
  for (let i = im; i < dose.length; i += 1) if (dose[i] <= frac * peak) return z[i];
  return z[z.length - 1];
}
