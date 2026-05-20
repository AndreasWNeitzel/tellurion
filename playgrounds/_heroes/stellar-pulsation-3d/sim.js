// Headless physics for the stellar-pulsation-3d hero. A stellar
// non-radial oscillation has angular pattern equal to a real
// spherical harmonic Y_l^m(theta, phi). The surface displacement at
// any time is xi_r(R, t) * Y_l^m(theta, phi) * cos(omega t).
// References: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology,
// Ch. 3 (`aerts-asteroseism`); Cox, Theory of Stellar Pulsation, 1980.

// Associated Legendre polynomial P_l^m(x), 0 <= m <= l, using the
// standard three-term recurrence. Unnormalized (real-spherical-
// harmonic-style); we will normalize the displayed amplitude separately.
function legendreP(l, m, x) {
  if (m < 0 || m > l) return 0;
  // Start from P_m^m = (-1)^m (2m-1)!! (1 - x^2)^{m/2}.
  let pmm = 1;
  if (m > 0) {
    const somx2 = Math.sqrt(Math.max(0, 1 - x * x));
    let fact = 1;
    for (let i = 1; i <= m; i += 1) {
      pmm *= -fact * somx2;
      fact += 2;
    }
  }
  if (l === m) return pmm;
  // P_{m+1}^m = x (2m + 1) P_m^m.
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pmmp1;
  // Recurrence: (l - m) P_l^m = x (2l - 1) P_{l-1}^m - (l + m - 1) P_{l-2}^m.
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll += 1) {
    pll = (x * (2 * ll - 1) * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
    pmm = pmmp1;
    pmmp1 = pll;
  }
  return pll;
}

// Real spherical harmonic Y_l^m(theta, phi), m in [-l, l]. We use
// the cosine convention for positive m and sine for negative m, so
// the displayed amplitude is real-valued.
export function realSphericalHarmonic(l, m, theta, phi) {
  const cosTh = Math.cos(theta);
  const am = Math.abs(m);
  const P = legendreP(l, am, cosTh);
  if (m === 0) return P;
  if (m > 0) return P * Math.cos(m * phi);
  return P * Math.sin(am * phi);
}

// Surface displacement at time t with normalized amplitude 1. Returns
// the radial displacement relative to the unperturbed radius.
export function surfaceDisplacement(l, m, theta, phi, t, omega = 1, amp = 0.12) {
  const Y = realSphericalHarmonic(l, m, theta, phi);
  return amp * Y * Math.cos(omega * t);
}

// Generate (lat, lon) grid samples used by the renderer. Returns
// arrays of theta in [0, pi], phi in [0, 2pi], plus the displacement
// values pre-evaluated at a given (l, m, t).
export function sampleGrid(nLat, nLon, l, m, t, omega = 1, amp = 0.12) {
  const Y = new Float64Array(nLat * nLon);
  for (let i = 0; i < nLat; i += 1) {
    const theta = (i + 0.5) / nLat * Math.PI;
    for (let j = 0; j < nLon; j += 1) {
      const phi = (j / nLon) * 2 * Math.PI;
      Y[i * nLon + j] = surfaceDisplacement(l, m, theta, phi, t, omega, amp);
    }
  }
  return Y;
}

// Energy density proxy: <Y^2> over the sphere should equal 1/(2l+1)
// times the unit-normalized harmonic. Used for invariant testing.
export function meanSquared(nLat, nLon, l, m) {
  let sum = 0, weight = 0;
  for (let i = 0; i < nLat; i += 1) {
    const theta = (i + 0.5) / nLat * Math.PI;
    const sinT = Math.sin(theta);
    for (let j = 0; j < nLon; j += 1) {
      const phi = (j / nLon) * 2 * Math.PI;
      const y = realSphericalHarmonic(l, m, theta, phi);
      sum += y * y * sinT;
      weight += sinT;
    }
  }
  return sum / weight;
}
