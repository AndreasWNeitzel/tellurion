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
