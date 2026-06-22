// Quantum wavepacket revivals in an infinite square well [0,1]. The stationary states
// are psi_n(x) = sqrt(2) sin(n pi x) with energies E_n = n^2 (units hbar = 1, E_1 = 1),
// so a packet psi(x,t) = sum_n c_n psi_n(x) e^{-i n^2 t} dephases, fractures into copies
// at rational fractions of the revival time, and reassembles exactly at T_rev = 2 pi.
// Tracing |psi(x,t)|^2 over x and t draws the self-similar "quantum carpet".
// Reference: Griffiths, Introduction to Quantum Mechanics, 3rd ed., Ch. 2.

export const T_REV = 2 * Math.PI;

export function eigenstate(n, x) { return Math.SQRT2 * Math.sin(n * Math.PI * x); }
export function energy(n) { return n * n; }

// Decompose an initial Gaussian packet exp(-(x-x0)^2/2sigma^2) e^{i k0 x} into the well
// eigenbasis. Returns the (normalized) complex coefficients and their moduli squared.
export function decompose(x0, k0, sigma, nMax, ng = 600) {
  const dx = 1 / ng;
  const re = new Float64Array(ng), im = new Float64Array(ng);
  let norm = 0;
  for (let j = 0; j < ng; j += 1) {
    const x = (j + 0.5) * dx, g = Math.exp(-((x - x0) ** 2) / (2 * sigma * sigma));
    re[j] = g * Math.cos(k0 * x); im[j] = g * Math.sin(k0 * x);
    norm += (re[j] * re[j] + im[j] * im[j]) * dx;
  }
  const s = 1 / Math.sqrt(norm);
  const cRe = new Float64Array(nMax + 1), cIm = new Float64Array(nMax + 1), p2 = new Float64Array(nMax + 1);
  for (let n = 1; n <= nMax; n += 1) {
    let ar = 0, ai = 0;
    for (let j = 0; j < ng; j += 1) { const ph = eigenstate(n, (j + 0.5) * dx) * dx; ar += ph * re[j] * s; ai += ph * im[j] * s; }
    cRe[n] = ar; cIm[n] = ai; p2[n] = ar * ar + ai * ai;
  }
  return { cRe, cIm, p2 };
}

// Probability density |psi(x,t)|^2 from the coefficients.
export function density(x, t, cRe, cIm, nMax) {
  let re = 0, im = 0;
  for (let n = 1; n <= nMax; n += 1) {
    const ph = -energy(n) * t, c = Math.cos(ph), s = Math.sin(ph), e = eigenstate(n, x);
    re += e * (cRe[n] * c - cIm[n] * s);
    im += e * (cRe[n] * s + cIm[n] * c);
  }
  return re * re + im * im;
}

// Survival probability |<psi(0)|psi(t)>|^2 = |sum_n |c_n|^2 e^{-i E_n t}|^2; peaks at revivals.
export function autocorrelation(t, p2, nMax) {
  let re = 0, im = 0;
  for (let n = 1; n <= nMax; n += 1) { const ph = -energy(n) * t; re += p2[n] * Math.cos(ph); im += p2[n] * Math.sin(ph); }
  return re * re + im * im;
}
