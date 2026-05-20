// Headless model of rotational broadening of a stellar absorption
// line. A rotating star presents an approaching limb (blueshifted)
// and a receding limb (redshifted); summing the rest-frame Gaussian
// line profile weighted by the visible disk's intensity gives a
// rotationally broadened line whose shape encodes v sin i.
//
// Reference: Gray, Observation and Analysis of Stellar Photospheres,
// Ch. 17 (`gray2005`); Carroll-Ostlie, Modern Astrophysics, Ch. 9.

// Quadratic limb darkening, the same form the transit playground
// uses for consistency: I(mu)/I(0) = 1 - u1(1-mu) - u2(1-mu)^2,
// with mu = cos(angle from disc centre to surface normal).
export function limbDarkening(mu, u1 = 0.42, u2 = 0.25) {
  if (mu < 0) return 0;
  const m = 1 - mu;
  return Math.max(0, 1 - u1 * m - u2 * m * m);
}

// Intrinsic (non-rotating) Gaussian line profile at the rest
// wavelength lambda0, normalized to a depth of 1 at line center.
//   I(lambda) / I_continuum = 1 - depth * exp(-(lambda - lambda0)^2 /
//                                            (2 * sigma^2))
export function gaussianLine(lambda, lambda0 = 0, sigma = 0.012, depth = 0.7) {
  const z = (lambda - lambda0) / sigma;
  return 1 - depth * Math.exp(-0.5 * z * z);
}

// Build the rotationally broadened line profile by summing the
// rest-frame Gaussian shifted by Doppler v(x)/c across a uniform
// disk. x is the projected horizontal coordinate (sky x, with the
// star's rotation axis aligned with sky y). The visible disk has
// y in [-sqrt(1-x^2), +sqrt(1-x^2)]. v sin i is in units of c;
// 1e-4 corresponds to 30 km/s for a sharp line.
//
// Inputs:
//   wavelengths  Float64Array of lambda samples (relative to line center).
//   vsini        in dimensionless units of c.
// Returns the broadened-line intensity for each sample.
export function broadenedLine(wavelengths, vsini, opts = {}) {
  const { sigma = 0.012, depth = 0.7, u1 = 0.42, u2 = 0.25, nx = 64 } = opts;
  const N = wavelengths.length;
  const out = new Float64Array(N);
  let totalW = 0;
  // Iterate over visible disk in (x, y) and accumulate the limb-darkened
  // weight and Doppler-shifted line profile.
  for (let ix = 0; ix < nx; ix += 1) {
    const x = -1 + (ix + 0.5) * (2 / nx);
    const yMax = Math.sqrt(Math.max(0, 1 - x * x));
    const dy = (2 * yMax) / nx;
    if (yMax === 0) continue;
    // Doppler shift from rotation: v_LOS = vsini * x.
    const lambdaShift = vsini * x;
    for (let iy = 0; iy < nx; iy += 1) {
      const y = -yMax + (iy + 0.5) * dy;
      const mu = Math.sqrt(Math.max(0, 1 - x * x - y * y));
      const w = limbDarkening(mu, u1, u2);
      if (w <= 0) continue;
      totalW += w;
      for (let k = 0; k < N; k += 1) {
        // Local profile shifted by lambdaShift.
        const l = wavelengths[k] - lambdaShift;
        const profile = gaussianLine(l, 0, sigma, depth);
        out[k] += w * profile;
      }
    }
  }
  if (totalW > 0) for (let k = 0; k < N; k += 1) out[k] /= totalW;
  return out;
}

// Approximate vsini in m/s for a sun-like star at projected rotation
// speed vsini_norm in units of c. v = vsini_norm * 3e8 m/s. So 1e-4
// is 30 km/s.
export function vsiniMS(vsini_norm) { return vsini_norm * 2.998e8; }

// Half-width at half-depth of the broadened line in units of the
// underlying sigma (a rough metric of how broad it has become).
// Returns the wavelength where the profile reaches 1 - 0.5*depth.
export function halfWidthHalfDepth(wavelengths, profile, depth = 0.7) {
  const half = 1 - 0.5 * depth;
  let bestK = -1, bestDiff = Infinity;
  for (let k = 0; k < profile.length; k += 1) {
    if (wavelengths[k] < 0) continue;
    const d = Math.abs(profile[k] - half);
    if (d < bestDiff) { bestDiff = d; bestK = k; }
  }
  return bestK >= 0 ? wavelengths[bestK] : 0;
}
