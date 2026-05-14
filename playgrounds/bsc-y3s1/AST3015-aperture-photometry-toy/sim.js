// Toy aperture photometry: place a synthetic star (Moffat PSF) on a CCD with
// uniform sky background; recover the flux by summing pixel counts inside an
// aperture and subtracting the background measured in an annulus.
// Reference: Howell, Handbook of CCD Astronomy (`howell-ccd`); Carroll-Ostlie Ch. 1.3
// (`carroll-ostlie`).
import { makeRng } from '../../../shared/js/render/rng.js';
export function moffat(r, sigma, beta = 3) {
  return Math.pow(1 + (r / sigma) ** 2, -beta);
}
export function generateImage(N, x0, y0, flux, fwhm, sky, gain = 1, readNoise = 1, seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  const sigma = fwhm / (2 * Math.sqrt(Math.pow(2, 1 / 3) - 1));
  const img = new Float32Array(N * N);
  let totalPSF = 0;
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
    const r = Math.hypot(x - x0, y - y0);
    totalPSF += moffat(r, sigma);
  }
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const r = Math.hypot(x - x0, y - y0);
      const expected = sky + flux * moffat(r, sigma) / totalPSF;
      // Poisson approximation via Gaussian for large mu.
      const u1 = rng() + 1e-9, u2 = rng();
      const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      img[y * N + x] = expected + gauss * Math.sqrt(expected + readNoise * readNoise);
    }
  }
  return img;
}
export function aperturePhot(img, N, x0, y0, r_in, r_out, r_sky_in, r_sky_out) {
  let starSum = 0, starN = 0, skySum = 0, skyN = 0;
  for (let y = 0; y < N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const r = Math.hypot(x - x0, y - y0);
      if (r < r_in) { starSum += img[y * N + x]; starN += 1; }
      else if (r >= r_sky_in && r < r_sky_out) { skySum += img[y * N + x]; skyN += 1; }
    }
  }
  const sky = skySum / skyN;
  return { flux: starSum - sky * starN, sky };
}
