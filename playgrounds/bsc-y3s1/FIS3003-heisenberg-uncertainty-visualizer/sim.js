// Heisenberg uncertainty in conjugate spaces (hbar = 1). A normalised
// position wavefunction psi(x) and its Fourier transform phi(k) carry
// standard deviations sigma_x and sigma_p; quantum mechanics forces
// sigma_x sigma_p >= 1/2, with equality only for a Gaussian. Squeezing
// psi narrows it in x and necessarily broadens phi in p. The momentum
// representation is the discrete Fourier transform of psi. Headless
// and deterministic. Reference: Griffiths, Introduction to Quantum
// Mechanics (3rd ed.), Sec. 1.6 and 3.5.

export function makeGrid(N, L) {
  const dx = L / N, x = new Float64Array(N);
  for (let i = 0; i < N; i += 1) x[i] = -L / 2 + (i + 0.5) * dx;
  // matched k-grid: dk = 2 pi / L, centred
  const dk = 2 * Math.PI / L, k = new Float64Array(N);
  for (let i = 0; i < N; i += 1) k[i] = (i - N / 2) * dk;
  return { N, L, dx, dk, x, k, re: new Float64Array(N), im: new Float64Array(N) };
}

// Build psi(x) of a chosen shape, then normalise so integral|psi|^2=1.
export function setShape(g, shape, sigma, x0 = 0, k0 = 0) {
  const { N, x, re, im, dx } = g;
  for (let i = 0; i < N; i += 1) {
    const xi = x[i] - x0; let a = 0;
    if (shape === 'gaussian') a = Math.exp(-(xi * xi) / (4 * sigma * sigma));
    else if (shape === 'box') a = Math.abs(xi) < sigma * Math.sqrt(3) ? 1 : 0;          // var = sigma^2
    else if (shape === 'triangle') { const w = sigma * Math.sqrt(6); a = Math.max(0, 1 - Math.abs(xi) / w); }
    else if (shape === 'double') a = Math.exp(-((Math.abs(xi) - 2.2 * sigma) ** 2) / (2 * (0.6 * sigma) ** 2));
    re[i] = a * Math.cos(k0 * x[i]);
    im[i] = a * Math.sin(k0 * x[i]);
  }
  let nrm = 0; for (let i = 0; i < N; i += 1) nrm += re[i] * re[i] + im[i] * im[i];
  nrm = Math.sqrt(nrm * dx);
  for (let i = 0; i < N; i += 1) { re[i] /= nrm; im[i] /= nrm; }
}

// Discrete Fourier transform to the momentum representation, returned
// as a normalised |phi(k)|^2 density on the centred k-grid.
export function momentumDensity(g) {
  const { N, x, k, re, im, dx, dk } = g;
  const pr = new Float64Array(N);
  for (let m = 0; m < N; m += 1) {
    let ar = 0, ai = 0;
    for (let i = 0; i < N; i += 1) {
      const ph = -k[m] * x[i];
      const c = Math.cos(ph), s = Math.sin(ph);
      ar += re[i] * c - im[i] * s;
      ai += re[i] * s + im[i] * c;
    }
    pr[m] = ar * ar + ai * ai;
  }
  // normalise: integral |phi|^2 dk = 1
  let nrm = 0; for (let m = 0; m < N; m += 1) nrm += pr[m];
  nrm *= dk;
  for (let m = 0; m < N; m += 1) pr[m] /= nrm;
  return pr;
}

function meanVar(weight, coord, d) {
  let w = 0, mu = 0, m2 = 0;
  for (let i = 0; i < weight.length; i += 1) { w += weight[i]; mu += coord[i] * weight[i]; }
  mu /= w;
  for (let i = 0; i < weight.length; i += 1) m2 += (coord[i] - mu) ** 2 * weight[i];
  return { mean: mu, varc: m2 / w, w: w * d };
}

export function sigmaX(g) {
  const dens = new Float64Array(g.N);
  for (let i = 0; i < g.N; i += 1) dens[i] = g.re[i] * g.re[i] + g.im[i] * g.im[i];
  const mv = meanVar(dens, g.x, g.dx);
  return { sigma: Math.sqrt(mv.varc), mean: mv.mean };
}

export function sigmaP(g, pdens) {
  const pd = pdens || momentumDensity(g);
  const mv = meanVar(pd, g.k, g.dk);
  return { sigma: Math.sqrt(mv.varc), mean: mv.mean };
}

export function uncertaintyProduct(g, pdens) {
  return sigmaX(g).sigma * sigmaP(g, pdens).sigma;
}

export const HBAR_OVER_2 = 0.5;                 // hbar = 1
