// sim.js
// Fraunhofer diffraction by a circular aperture of radius a, observed in
// the focal plane of an ideal lens of focal length f. The far-field
// amplitude is the Fourier transform of the aperture function, which for a
// uniformly illuminated disc gives the Airy pattern (Hecht 2017, Section
// 10.2.5):
//
//   I(theta) / I_0 = (2 J_1(x) / x)^2,   x = (2 pi a / lambda) sin(theta).
//
// The first zero at x = 3.8317 sets the angular radius of the Airy disc:
//   theta_1 = 1.22 lambda / D, D = 2 a.
//
// For a focal plane at distance f the corresponding radial position is
//   r_1 = 1.22 lambda f / D = 1.22 lambda F#, F# = f / D.
//
// We compute J_1 by series for |x| <= 8 and by asymptotic expansion for
// larger x. The relative error is < 1e-10 across the relevant range.

const J1_SERIES_NMAX = 20;
const J1_SERIES_THRESH = 8;

// J_1(x) Bessel function. Numerical Recipes 6.5; Abramowitz and Stegun 9.4.4.
export function besselJ1(x) {
  const ax = Math.abs(x);
  if (ax < J1_SERIES_THRESH) {
    // Power series: J_1(x) = (x/2) sum_{k=0}^inf (-1)^k (x/2)^(2k) / (k! (k+1)!)
    const z2 = (x / 2) * (x / 2);
    let term = 1, s = 1;
    for (let k = 1; k <= J1_SERIES_NMAX; k += 1) {
      term *= -z2 / (k * (k + 1));
      s += term;
      if (Math.abs(term) < 1e-16 * Math.abs(s)) break;
    }
    return (x / 2) * s;
  }
  // Asymptotic form for large x.
  const z = 8 / ax;
  const z2 = z * z;
  const p = 1 + z2 * (0.183105e-2 + z2 * (-0.3516396496e-4 + z2 * (0.2457520174e-5 + z2 * (-0.240337019e-6))));
  const q = z * (0.04687499995 + z2 * (-0.2002690873e-3 + z2 * (0.8449199096e-5 + z2 * (-0.88228987e-6 + z2 * (0.105787412e-6)))));
  const phase = ax - 3 * Math.PI / 4;
  const ans = Math.sqrt(0.6366197723675814 / ax) * (p * Math.cos(phase) - q * Math.sin(phase));
  return x < 0 ? -ans : ans;
}

// Airy intensity I(x) / I_0 = (2 J_1(x) / x)^2.
export function airyIntensity(x) {
  if (Math.abs(x) < 1e-9) return 1;
  const t = 2 * besselJ1(x) / x;
  return t * t;
}

// Build a 2D Airy intensity field on an N x N grid covering [-xMax, xMax]^2
// in the scaled aperture-angle coordinate x = (2 pi a / lambda) sin(theta).
export function airy2DField({ N = 256, xMax = 16 } = {}) {
  const field = new Float32Array(N * N);
  for (let j = 0; j < N; j += 1) {
    const v = -xMax + (2 * xMax) * (j / (N - 1));
    for (let i = 0; i < N; i += 1) {
      const u = -xMax + (2 * xMax) * (i / (N - 1));
      const r = Math.hypot(u, v);
      field[j * N + i] = airyIntensity(r);
    }
  }
  return field;
}

export function airy1DProfile({ N = 400, xMax = 16 } = {}) {
  const xs = new Float64Array(N);
  const Is = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    xs[i] = -xMax + (2 * xMax) * (i / (N - 1));
    Is[i] = airyIntensity(xs[i]);
  }
  return { xs, Is };
}

// First few zeros of J_1; useful for marking rings on the plot.
// Roots from Abramowitz and Stegun 9.5 Table; or solving J_1(x) = 0.
export const J1_ZEROS = [3.83170597, 7.01558667, 10.17346814, 13.32369194, 16.47063005];

// Resolving power lambda / D in angular units; angular radius of Airy disc.
export const AIRY_FIRST_ZERO = J1_ZEROS[0];

// Compute the angular radius of the Airy disc's first dark ring.
// theta_1 = 1.22 lambda / D (radians, assuming small angles).
// Within the numerical grid normalized by x = (2 pi a / lambda) sin(theta),
// the first zero appears at x_1 = 3.8317, so theta_1 (in radians) = arcsin(3.8317 lambda / (2 pi a)).
// For display, we often just use the small-angle approximation theta_1 ~ 1.22 lambda / D.
export function rayleighResolution({ lambda = 500e-9, D = 1e-3 } = {}) {
  return 1.22 * lambda / D;
}

// Degrade the Airy pattern by atmospheric/aberration wavefront error sigma (in waves).
// Strehl ratio S ~ exp(-(2 pi sigma)^2). The PSF becomes a blend:
//   I_degraded(x) = S * I_core(x) + (1 - S) * I_halo(x),
// where I_core is the Airy intensity and I_halo is a broad Gaussian halo.
// Here, I_halo is a simple broad Gaussian with FWHM ~ 2x the first Airy zero.
export function airyIntensityWithStrehl({ x = 0, sigmaWaves = 0 } = {}) {
  if (sigmaWaves <= 0) return airyIntensity(x);
  const strehl = Math.exp(-Math.pow(2 * Math.PI * sigmaWaves, 2));
  const core = airyIntensity(x);
  // Halo: broad Gaussian with sigma_halo ~ Airy first zero / 1.5.
  // Place the 1/e^2 width at ~ 2x first zero.
  const sigmaHalo = AIRY_FIRST_ZERO / 1.2;
  const halo = Math.exp(-0.5 * Math.pow(x / sigmaHalo, 2));
  return strehl * core + (1 - strehl) * halo;
}

// Build a 2D field including wavefront degradation.
export function airy2DFieldWithStrehl({ N = 256, xMax = 16, sigmaWaves = 0 } = {}) {
  const field = new Float32Array(N * N);
  for (let j = 0; j < N; j += 1) {
    const v = -xMax + (2 * xMax) * (j / (N - 1));
    for (let i = 0; i < N; i += 1) {
      const u = -xMax + (2 * xMax) * (i / (N - 1));
      const r = Math.hypot(u, v);
      field[j * N + i] = airyIntensityWithStrehl({ x: r, sigmaWaves });
    }
  }
  return field;
}

// 1D profile with wavefront degradation.
export function airy1DProfileWithStrehl({ N = 400, xMax = 16, sigmaWaves = 0 } = {}) {
  const xs = new Float64Array(N);
  const Is = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    xs[i] = -xMax + (2 * xMax) * (i / (N - 1));
    Is[i] = airyIntensityWithStrehl({ x: xs[i], sigmaWaves });
  }
  return { xs, Is };
}

// Strehl ratio for a given wavefront RMS error in waves.
export function strehRatio({ sigmaWaves = 0 } = {}) {
  return Math.exp(-Math.pow(2 * Math.PI * sigmaWaves, 2));
}
