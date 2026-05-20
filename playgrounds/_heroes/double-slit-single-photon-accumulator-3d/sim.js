// Headless physics for the double-slit single-photon accumulator hero.
// The detector-plane intensity from two narrow slits of width a,
// separation d, at distance D, illuminated by light of wavelength
// lambda, has the well-known Fraunhofer form
//
//   I(y) = I0 * sinc^2(pi a sin(theta) / lambda)
//                * cos^2(pi d sin(theta) / lambda),
//
// with theta = atan(y/D). The single-slit envelope sinc^2 modulates
// the two-slit interference cos^2 fringes. References: Hecht, Optics,
// 5th ed., Ch. 10 (`hecht-optics`); Feynman Lectures Vol. III, Ch. 1.

// Sinc^2(x) = (sin x / x)^2 with the limit 1 at x = 0.
function sinc2(x) {
  if (Math.abs(x) < 1e-9) return 1;
  const s = Math.sin(x) / x;
  return s * s;
}

// Intensity profile on the detector at position y (lateral). All
// distances in arbitrary units; only the dimensionless ratios
// d/lambda, a/lambda, y/D matter.
export function intensity(y, opts = {}) {
  const { a = 0.1, d = 0.5, lambda = 0.4, D = 10 } = opts;
  const sinTheta = y / Math.sqrt(y * y + D * D);
  const envelope = sinc2(Math.PI * a * sinTheta / lambda);
  const fringes = Math.cos(Math.PI * d * sinTheta / lambda);
  return envelope * fringes * fringes;
}

// Maximum intensity (at y = 0). For two slits cos^2(0) = 1 and the
// envelope sinc^2(0) = 1, so I(0) = 1.
export function intensityMax() { return 1; }

// Sample a photon hit position by rejection sampling against the
// normalized intensity profile. yRange = [-Y, +Y] is the screen extent.
// Returns y on the screen.
export function samplePhoton(rng, opts = {}) {
  const { yRange = 4, intensityCap = 1, ...rest } = opts;
  let attempts = 0;
  while (attempts < 200) {
    const y = (rng() - 0.5) * 2 * yRange;
    const u = rng() * intensityCap;
    if (u < intensity(y, rest)) return y;
    attempts += 1;
  }
  return 0;     // fallback (should never hit)
}

// Reference fringe spacing on the screen (large-D approximation).
// Delta y = lambda D / d.
export function fringeSpacing(d, lambda, D) {
  return lambda * D / d;
}

// Position of the m-th interference maximum.
export function fringeMaximum(m, d, lambda, D) {
  return m * fringeSpacing(d, lambda, D);
}
