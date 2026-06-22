// X-ray diffraction from a set of parallel crystal planes spaced d. Rays reflecting
// from successive planes at glancing angle theta acquire a path difference 2 d sin(theta);
// they interfere constructively when this equals a whole number of wavelengths, the
// Bragg condition n lambda = 2 d sin(theta). The reflected intensity from N planes is
// the N-beam interference factor, sharp at the Bragg angles. Lengths in angstroms,
// angles in radians. Reference: Ashcroft and Mermin, Solid State Physics, Ch. 6.

// Path difference 2 d sin(theta) between adjacent planes, in the same length units as d.
export function pathDifference(theta, d) { return 2 * d * Math.sin(theta); }

// Continuous "order" 2 d sin(theta) / lambda; an integer exactly at a Bragg peak.
export function orderValue(theta, d, lambda) { return pathDifference(theta, d) / lambda; }

// Glancing angle (radians) of the n-th Bragg peak, or null if n lambda > 2 d (no peak).
export function braggAngle(n, d, lambda) {
  const s = (n * lambda) / (2 * d);
  return s <= 1 ? Math.asin(s) : null;
}

// Highest observable order, floor(2 d / lambda).
export function maxOrder(d, lambda) { return Math.floor((2 * d) / lambda); }

// List of visible Bragg peaks {n, theta} for the current spacing and wavelength.
export function braggPeaks(d, lambda) {
  const peaks = [];
  for (let n = 1; n <= maxOrder(d, lambda); n += 1) { const t = braggAngle(n, d, lambda); if (t !== null) peaks.push({ n, theta: t }); }
  return peaks;
}

// Reflected intensity from N planes, normalized to 1 at the Bragg peaks: the N-beam
// interference factor (sin(N phi/2)/(N sin(phi/2)))^2 with phi = 2 pi (2 d sin theta)/lambda.
export function intensity(theta, d, lambda, N = 30) {
  const phi = (2 * Math.PI * pathDifference(theta, d)) / lambda;
  const s = Math.sin(phi / 2);
  if (Math.abs(s) < 1e-9) return 1;
  const r = Math.sin(N * phi / 2) / (N * s);
  return r * r;
}
