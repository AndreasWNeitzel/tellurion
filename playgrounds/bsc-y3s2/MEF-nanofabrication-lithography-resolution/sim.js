// Projection-lithography aerial-image model (1D, coherent). A reticle
// (mask) transmission t(x) is imaged through a lens of numerical
// aperture NA at wavelength lambda: the pupil passes only spatial
// frequencies |f| <= NA/lambda, so the aerial intensity is
//   I(x) = | IFFT[ pupil(f) . FFT(t)(f) ] |^2 .
// Resolution (Rayleigh): R = k1 lambda / NA. Closed-form cutoff and
// Rayleigh plus an exact DFT; deterministic. Reference: Goodman,
// Introduction to Fourier Optics (`goodman-fourier`); Born and Wolf,
// Principles of Optics (`born-wolf`); Mack, Fundamental Principles of
// Optical Lithography, Wiley 2007 (`mack2007`).

export const WAVELENGTHS = { iline: 365, krf: 248, arf: 193, euv: 13.5 }; // nm

// Coherent pupil cutoff spatial frequency (cycles per nm).
export function cutoffFreq(NA, lambdaNm) { return NA / lambdaNm; }

// Rayleigh half-pitch resolution (nm).
export function rayleigh(k1, lambdaNm, NA) { return k1 * lambdaNm / NA; }

function dft(re, im, sign) {
  const N = re.length;
  const Re = new Float64Array(N), Im = new Float64Array(N);
  for (let k = 0; k < N; k += 1) {
    let r = 0, i = 0;
    for (let n = 0; n < N; n += 1) {
      const ph = sign * 2 * Math.PI * k * n / N;
      const c = Math.cos(ph), s = Math.sin(ph);
      r += re[n] * c - im[n] * s;
      i += re[n] * s + im[n] * c;
    }
    Re[k] = r; Im[k] = i;
  }
  if (sign > 0) for (let n = 0; n < N; n += 1) { Re[n] /= N; Im[n] /= N; }
  return { Re, Im };
}

// Binary line/space reticle of given half-pitch (nm) over a window of
// `N` samples at `dx` nm/sample. Returns transmission in {0,1}.
export function reticleGrating(N, dx, halfPitchNm) {
  const t = new Float64Array(N);
  const period = 2 * halfPitchNm;
  for (let n = 0; n < N; n += 1) {
    const x = n * dx;
    t[n] = ((x % period) < halfPitchNm) ? 1 : 0;
  }
  return t;
}

// A multi-zone test reticle: several gratings of decreasing half-pitch.
export function reticleTestPattern(N, dx, pitches) {
  const t = new Float64Array(N);
  const zone = Math.floor(N / pitches.length);
  for (let z = 0; z < pitches.length; z += 1) {
    const hp = pitches[z], per = 2 * hp;
    for (let n = z * zone; n < Math.min(N, (z + 1) * zone); n += 1) {
      const x = (n - z * zone) * dx;
      t[n] = ((x % per) < hp) ? 1 : 0;
    }
  }
  return t;
}

// Coherent aerial intensity I(x) of a reticle through the pupil.
export function aerialImage(reticle, dx, lambdaNm, NA) {
  const N = reticle.length;
  const im0 = new Float64Array(N);
  const F = dft(reticle, im0, -1);
  const fc = cutoffFreq(NA, lambdaNm);                 // cycles / nm
  const df = 1 / (N * dx);                             // frequency bin (cycles / nm)
  for (let k = 0; k < N; k += 1) {
    const kk = (k <= N / 2) ? k : k - N;
    const f = Math.abs(kk) * df;
    if (f > fc) { F.Re[k] = 0; F.Im[k] = 0; }           // pupil low-pass
  }
  const inv = dft(F.Re, F.Im, +1);
  const I = new Float64Array(N);
  for (let n = 0; n < N; n += 1) I[n] = inv.Re[n] * inv.Re[n] + inv.Im[n] * inv.Im[n];
  return I;
}

// Michelson contrast (Imax - Imin)/(Imax + Imin) of an image over its
// central region (avoids window edges).
export function contrast(I) {
  const N = I.length;
  let lo = Infinity, hi = -Infinity;
  for (let n = Math.floor(N * 0.2); n < Math.floor(N * 0.8); n += 1) {
    if (I[n] < lo) lo = I[n];
    if (I[n] > hi) hi = I[n];
  }
  return hi + lo <= 1e-12 ? 0 : (hi - lo) / (hi + lo);
}

// Imaged contrast of a line/space grating of half-pitch hp (nm).
export function gratingContrast(halfPitchNm, lambdaNm, NA, { N = 512, dx = null } = {}) {
  const px = dx ?? (halfPitchNm / 16);                 // ~32 samples / period
  const t = reticleGrating(N, px, halfPitchNm);
  return contrast(aerialImage(t, px, lambdaNm, NA));
}
