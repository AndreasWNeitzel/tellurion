// shared/js/engine/cn-tridiag.js
// Complex-valued tridiagonal Thomas algorithm for Crank-Nicolson type
// solvers. Solves A x = d where A is tridiagonal with sub-diagonal a,
// diagonal b, super-diagonal c, all complex. Length N.
//
// Inputs and outputs as separate real and imaginary arrays of length N.
// d is consumed; x is written into outputRe, outputIm.
//
// Standard Thomas algorithm. Stability for diagonally-dominant A
// (which the CN matrix is when dt > 0).

// Internal scratch (per call); local-only to avoid global state.
function cmul(a_re, a_im, b_re, b_im) {
  return [a_re * b_re - a_im * b_im, a_re * b_im + a_im * b_re];
}
function cdiv(a_re, a_im, b_re, b_im) {
  const den = b_re * b_re + b_im * b_im;
  return [(a_re * b_re + a_im * b_im) / den, (a_im * b_re - a_re * b_im) / den];
}

export function tridiagonalSolveComplex(aRe, aIm, bRe, bIm, cRe, cIm, dRe, dIm, xRe, xIm, N) {
  // Forward sweep: eliminate the sub-diagonal.
  const cpRe = new Float64Array(N), cpIm = new Float64Array(N);
  const dpRe = new Float64Array(N), dpIm = new Float64Array(N);
  // i = 0
  let [c0Re, c0Im] = cdiv(cRe[0], cIm[0], bRe[0], bIm[0]);
  cpRe[0] = c0Re; cpIm[0] = c0Im;
  let [d0Re, d0Im] = cdiv(dRe[0], dIm[0], bRe[0], bIm[0]);
  dpRe[0] = d0Re; dpIm[0] = d0Im;
  for (let i = 1; i < N; i += 1) {
    // denom = b_i - a_i * cp_{i-1}
    const [acRe, acIm] = cmul(aRe[i], aIm[i], cpRe[i - 1], cpIm[i - 1]);
    const denomRe = bRe[i] - acRe, denomIm = bIm[i] - acIm;
    // cp_i = c_i / denom
    const [cpiRe, cpiIm] = cdiv(cRe[i], cIm[i], denomRe, denomIm);
    cpRe[i] = cpiRe; cpIm[i] = cpiIm;
    // dp_i = (d_i - a_i * dp_{i-1}) / denom
    const [adRe, adIm] = cmul(aRe[i], aIm[i], dpRe[i - 1], dpIm[i - 1]);
    const numRe = dRe[i] - adRe, numIm = dIm[i] - adIm;
    const [dpiRe, dpiIm] = cdiv(numRe, numIm, denomRe, denomIm);
    dpRe[i] = dpiRe; dpIm[i] = dpiIm;
  }
  // Back substitution
  xRe[N - 1] = dpRe[N - 1]; xIm[N - 1] = dpIm[N - 1];
  for (let i = N - 2; i >= 0; i -= 1) {
    const [cxRe, cxIm] = cmul(cpRe[i], cpIm[i], xRe[i + 1], xIm[i + 1]);
    xRe[i] = dpRe[i] - cxRe;
    xIm[i] = dpIm[i] - cxIm;
  }
}
