// sim.js
// Multi-slit Fraunhofer diffraction.
//
// For N identical slits of width a, separation d, observed at angle theta:
//
//   I(theta) = I_0 (sin(beta) / beta)^2 (sin(N alpha) / sin(alpha))^2
//
// where beta = (pi a sin theta) / lambda and alpha = (pi d sin theta) /
// lambda.
//
// Single slit (N = 1) gives the sinc^2 envelope; double slit (N = 2)
// gives sinc^2 * cos^2(alpha); N >> 1 gives sharp principal maxima.
//
// Reference: Hecht, Optics 5e Ch. 10.

export const LAMBDA = 0.5;     // micrometers (visible)
export const A_DEF = 1.0;       // slit width in same units
export const D_DEF = 5.0;       // slit separation

export function intensity(theta, N, a = A_DEF, d = D_DEF, lambda = LAMBDA) {
  const sin_t = Math.sin(theta);
  const beta  = Math.PI * a * sin_t / lambda;
  const alpha = Math.PI * d * sin_t / lambda;
  let envelope = 1;
  if (Math.abs(beta) > 1e-12) {
    const sb = Math.sin(beta) / beta;
    envelope = sb * sb;
  }
  let arrayFactor = N * N;
  if (Math.abs(Math.sin(alpha)) > 1e-12) {
    const sa = Math.sin(N * alpha) / Math.sin(alpha);
    arrayFactor = sa * sa;
  }
  return envelope * arrayFactor;
}

// Principal-maximum positions: alpha = m pi  =>  sin theta = m lambda / d.
export function principalMaxima(d = D_DEF, lambda = LAMBDA, mMax = 6) {
  const out = [];
  for (let m = -mMax; m <= mMax; m += 1) {
    const sinT = m * lambda / d;
    if (Math.abs(sinT) <= 1) out.push(Math.asin(sinT));
  }
  return out;
}

// Single-slit zero positions: beta = m pi, m != 0  =>  sin theta = m lambda / a.
export function envelopeZeros(a = A_DEF, lambda = LAMBDA, mMax = 4) {
  const out = [];
  for (let m = -mMax; m <= mMax; m += 1) {
    if (m === 0) continue;
    const sinT = m * lambda / a;
    if (Math.abs(sinT) <= 1) out.push(Math.asin(sinT));
  }
  return out;
}

// Huygens sub-source transverse positions: each of N slits of width a
// and pitch d is sampled by M coherent line sources across its width.
// The real-space superposition of these reproduces both the array
// factor (N, d) and the single-slit envelope (a) used above.
export function slitSources(N, a = A_DEF, d = D_DEF, M = 5) {
  const ys = [];
  const mid = (N - 1) / 2;
  for (let s = 0; s < N; s += 1) {
    const yc = (s - mid) * d;
    if (M <= 1) { ys.push(yc); continue; }
    for (let q = 0; q < M; q += 1) {
      ys.push(yc + (q / (M - 1) - 0.5) * a);
    }
  }
  return ys;
}

// Far-field intensity rebuilt from the discrete Huygens sub-sources,
// I(theta) = |sum exp(i k y_s sin theta)|^2 normalized to its peak.
// In the M -> large, continuous-aperture limit this equals intensity().
export function farFieldFromSources(theta, N, a = A_DEF, d = D_DEF, lambda = LAMBDA, M = 5) {
  const ys = slitSources(N, a, d, M);
  const k = 2 * Math.PI / lambda;
  let re = 0, im = 0;
  for (const y of ys) {
    const ph = k * y * Math.sin(theta);
    re += Math.cos(ph);
    im += Math.sin(ph);
  }
  return (re * re + im * im) / (ys.length * ys.length);
}
