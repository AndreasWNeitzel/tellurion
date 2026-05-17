// Time-dependent Schroedinger equation in 1D, natural units hbar = m
// = 1: i dpsi/dt = [ -1/2 d^2/dx^2 + V(x) ] psi. Integrated by the
// Crank-Nicolson scheme (unconditionally stable and exactly unitary,
// so the norm is conserved), using the shared complex Thomas
// tridiagonal solver. Potentials: free, infinite well, harmonic
// oscillator, double well, periodic lattice, rectangular tunnelling
// barrier, delta spike. Headless and deterministic. Reference:
// Griffiths, Introduction to Quantum Mechanics (3rd ed.), Ch. 1-2;
// Press et al., Numerical Recipes (3rd ed.), Sec. 20.2 (CN).

import { tridiagonalSolveComplex } from '../../../shared/js/engine/cn-tridiag.js';

export function makeState(N, L) {
  const dx = L / (N - 1), x = new Float64Array(N);
  for (let i = 0; i < N; i += 1) x[i] = -L / 2 + i * dx;
  return { N, L, dx, x, re: new Float64Array(N), im: new Float64Array(N), V: new Float64Array(N), t: 0 };
}

export function setPotential(s, name, opts = {}) {
  const { omega = 1, V0 = 8, width = 1.5, latticeK = 6, latticeA = 12 } = opts;
  const { N, x, V } = s;
  for (let i = 0; i < N; i += 1) {
    const xi = x[i]; let v = 0;
    if (name === 'free') v = 0;
    else if (name === 'well') v = Math.abs(xi) > s.L * 0.3 ? 1e4 : 0;        // wide box
    else if (name === 'harmonic') v = 0.5 * omega * omega * xi * xi;
    else if (name === 'double') v = 0.0008 * (xi * xi - 64) ** 2;            // two minima at +/-8
    else if (name === 'lattice') v = latticeA * (1 - Math.cos(2 * Math.PI * xi / latticeK)) * (Math.abs(xi) < s.L * 0.42 ? 1 : 50);
    else if (name === 'barrier') v = Math.abs(xi) < width ? V0 : 0;
    else if (name === 'delta') v = Math.abs(xi) < s.dx * 1.5 ? V0 * 40 : 0;
    V[i] = v;
  }
}

// Gaussian wavepacket, normalised.
export function setGaussian(s, x0, k0, sigma) {
  const { N, x, re, im, dx } = s;
  for (let i = 0; i < N; i += 1) {
    const g = Math.exp(-((x[i] - x0) ** 2) / (4 * sigma * sigma));
    re[i] = g * Math.cos(k0 * x[i]);
    im[i] = g * Math.sin(k0 * x[i]);
  }
  let nrm = 0; for (let i = 0; i < N; i += 1) nrm += re[i] * re[i] + im[i] * im[i];
  nrm = Math.sqrt(nrm * dx);
  for (let i = 0; i < N; i += 1) { re[i] /= nrm; im[i] /= nrm; }
  s.t = 0;
}

// One Crank-Nicolson step. A = I + i dt/2 H, B = I - i dt/2 H,
// A psi^{n+1} = B psi^n. H = -1/2 D^2 + V (Dirichlet ends).
export function step(s, dt) {
  const { N, dx, re, im, V } = s;
  const kin = 1 / (dx * dx);                 // -1/2 * (-2/dx^2) diagonal kinetic
  const off = -0.5 / (dx * dx);              // -1/2 * (1/dx^2) off-diagonal
  const h = dt / 2;
  const aRe = new Float64Array(N), aIm = new Float64Array(N);
  const bRe = new Float64Array(N), bIm = new Float64Array(N);
  const cRe = new Float64Array(N), cIm = new Float64Array(N);
  const dRe = new Float64Array(N), dIm = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const diagH = kin + V[i];
    // A diagonal = 1 + i h diagH ; off = i h off
    bRe[i] = 1; bIm[i] = h * diagH;
    aRe[i] = 0; aIm[i] = h * off;
    cRe[i] = 0; cIm[i] = h * off;
    // B psi : (1 - i h diagH) psi_i - i h off (psi_{i-1}+psi_{i+1})
    const lRe = i > 0 ? re[i - 1] : 0, lIm = i > 0 ? im[i - 1] : 0;
    const rRe = i < N - 1 ? re[i + 1] : 0, rIm = i < N - 1 ? im[i + 1] : 0;
    // (1 - i h diagH)(re + i im) = re + h diagH im + i(im - h diagH re)
    const dgRe = re[i] + h * diagH * im[i];
    const dgIm = im[i] - h * diagH * re[i];
    // -i h off * (neighbour sum)
    const sRe = lRe + rRe, sIm = lIm + rIm;
    const nbRe = h * off * sIm;               // -i*(x+iy)*hoff = hoff*y - i hoff*x
    const nbIm = -h * off * sRe;
    dRe[i] = dgRe + nbRe;
    dIm[i] = dgIm + nbIm;
  }
  // Dirichlet: keep endpoints pinned (large V already enforces decay)
  tridiagonalSolveComplex(aRe, aIm, bRe, bIm, cRe, cIm, dRe, dIm, re, im, N);
  s.t += dt;
}

export function norm(s) {
  let n = 0; for (let i = 0; i < s.N; i += 1) n += s.re[i] * s.re[i] + s.im[i] * s.im[i];
  return n * s.dx;
}
export function probDensity(s, i) { return s.re[i] * s.re[i] + s.im[i] * s.im[i]; }

export function expectationX(s) {
  let m = 0; for (let i = 0; i < s.N; i += 1) m += s.x[i] * (s.re[i] ** 2 + s.im[i] ** 2);
  return m * s.dx / norm(s);
}

// <p> = integral psi* (-i d/dx) psi dx (central difference).
export function expectationP(s) {
  const { N, dx, re, im } = s; let p = 0;
  for (let i = 1; i < N - 1; i += 1) {
    const dRe = (re[i + 1] - re[i - 1]) / (2 * dx), dIm = (im[i + 1] - im[i - 1]) / (2 * dx);
    // psi* (-i) dpsi = (re - i im)(-i)(dRe + i dIm) = re*dIm - im*dRe + i(...)
    p += re[i] * dIm - im[i] * dRe;
  }
  return p * dx / norm(s);
}

export function energy(s) {
  const { N, dx, re, im, V } = s; let E = 0;
  for (let i = 1; i < N - 1; i += 1) {
    const lapRe = (re[i + 1] - 2 * re[i] + re[i - 1]) / (dx * dx);
    const lapIm = (im[i + 1] - 2 * im[i] + im[i - 1]) / (dx * dx);
    // psi* H psi, H = -1/2 lap + V ; take real part
    const hRe = -0.5 * lapRe + V[i] * re[i];
    const hIm = -0.5 * lapIm + V[i] * im[i];
    E += re[i] * hRe + im[i] * hIm;
  }
  return E * dx / norm(s);
}

// Probability to the right of x = xc (transmission past a barrier).
export function probRightOf(s, xc) {
  let p = 0; for (let i = 0; i < s.N; i += 1) if (s.x[i] > xc) p += s.re[i] ** 2 + s.im[i] ** 2;
  return p * s.dx;
}
export function probLeftOf(s, xc) {
  let p = 0; for (let i = 0; i < s.N; i += 1) if (s.x[i] < xc) p += s.re[i] ** 2 + s.im[i] ** 2;
  return p * s.dx;
}

// Analytic rectangular-barrier transmission for energy E < V0.
export function barrierT(E, V0, a) {
  if (E <= 0) return 0;
  if (E >= V0) { const k2 = Math.sqrt(2 * (E - V0)) || 1e-9; const k1 = Math.sqrt(2 * E); const s = ((k1 * k1 - k2 * k2) / (2 * k1 * k2)) * Math.sin(k2 * a); return 1 / (1 + s * s); }
  const k = Math.sqrt(2 * E), kappa = Math.sqrt(2 * (V0 - E));
  const sh = Math.sinh(kappa * a);
  return 1 / (1 + (k * k + kappa * kappa) ** 2 / (4 * k * k * kappa * kappa) * sh * sh);
}
