// PDE zoo on a shared 1D grid of N points on [0, L]: the wave, heat,
// Laplace/Poisson, Schrodinger and Burgers (1D Navier-Stokes analogue)
// equations, each with its analytic reference where one exists and an
// error against the numeric solution (LeVeque 2007, Finite Difference
// Methods). The implicit schemes reuse the shared complex tridiagonal
// solver; deterministic, no RNG.
import { tridiagonalSolveComplex } from '../../../shared/js/engine/cn-tridiag.js';

export const L = 1;

export function makeGrid(N) {
  const x = new Float64Array(N);
  for (let i = 0; i < N; i += 1) x[i] = L * i / (N - 1);
  return x;
}

// Real tridiagonal solve via the shared complex solver (imag = 0).
function triSolveReal(a, b, c, d, N) {
  const z = new Float64Array(N);
  const xr = new Float64Array(N), xi = new Float64Array(N);
  tridiagonalSolveComplex(a, z, b, z.slice(), c, z.slice(),
    Float64Array.from(d), z.slice(), xr, xi, N);
  return xr;
}

// WAVE  u_tt = c^2 u_xx, fixed ends. Standing mode m: analytic
// u = sin(m pi x / L) cos(m pi c t / L). Leapfrog (CFL = c dt/dx <= 1).
export function waveAnalytic(x, t, c, m) {
  const k = m * Math.PI / L;
  return x.map((xx) => Math.sin(k * xx) * Math.cos(k * c * t));
}
export function makeWave(N, c, m) {
  const x = makeGrid(N), dx = L / (N - 1);
  const dt = 0.9 * dx / c;                                // CFL-safe
  const k = m * Math.PI / L;
  const u = Float64Array.from(x, (xx) => Math.sin(k * xx));
  // first step from u_t(0)=0: u1 = u0 + 0.5 r^2 (u_xx)
  const r2 = (c * dt / dx) ** 2;
  const uPrev = Float64Array.from(u);
  const u1 = Float64Array.from(u);
  for (let i = 1; i < N - 1; i += 1) u1[i] = u[i] + 0.5 * r2 * (u[i + 1] - 2 * u[i] + u[i - 1]);
  return { x, dx, dt, c, m, r2, u: u1, uPrev: u, t: dt, N };
}
export function stepWave(s) {
  const { N, u, uPrev, r2 } = s;
  const un = new Float64Array(N);
  for (let i = 1; i < N - 1; i += 1) {
    un[i] = 2 * u[i] - uPrev[i] + r2 * (u[i + 1] - 2 * u[i] + u[i - 1]);
  }
  s.uPrev = u; s.u = un; s.t += s.dt;
  return s;
}
export function waveEnergy(s) {
  const { u, uPrev, dt, dx, c, N } = s;
  let e = 0;
  for (let i = 1; i < N - 1; i += 1) {
    const ut = (u[i] - uPrev[i]) / dt;
    const ux = (u[i + 1] - u[i - 1]) / (2 * dx);
    e += 0.5 * (ut * ut + c * c * ux * ux) * dx;
  }
  return e;
}

// HEAT  u_t = alpha u_xx, fixed ends. Mode m decays:
// u = e^{-alpha (m pi / L)^2 t} sin(m pi x / L). Crank-Nicolson.
export function heatAnalytic(x, t, alpha, m) {
  const k = m * Math.PI / L;
  const dec = Math.exp(-alpha * k * k * t);
  return x.map((xx) => dec * Math.sin(k * xx));
}
export function makeHeat(N, alpha, m) {
  const x = makeGrid(N), dx = L / (N - 1), dt = 0.4 * dx * dx / alpha * 8;
  const k = m * Math.PI / L;
  return { x, dx, dt, alpha, m, u: Float64Array.from(x, (xx) => Math.sin(k * xx)), t: 0, N };
}
export function stepHeat(s) {
  const { N, u, alpha, dt, dx } = s;
  const r = alpha * dt / (dx * dx);
  const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), d = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    if (i === 0 || i === N - 1) { b[i] = 1; d[i] = 0; continue; }   // Dirichlet 0
    a[i] = -r / 2; b[i] = 1 + r; c[i] = -r / 2;
    d[i] = (r / 2) * u[i - 1] + (1 - r) * u[i] + (r / 2) * u[i + 1];
  }
  s.u = triSolveReal(a, b, c, d, N); s.t += dt;
  return s;
}

// LAPLACE/POISSON  u'' = -f, Dirichlet 0. For f = sin(m pi x / L) the
// analytic solution is u = sin(m pi x / L) / (m pi / L)^2.
export function poissonAnalytic(x, m) {
  const k = m * Math.PI / L;
  return x.map((xx) => Math.sin(k * xx) / (k * k));
}
export function solvePoisson(N, m) {
  const x = makeGrid(N), dx = L / (N - 1), k = m * Math.PI / L;
  const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), d = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    if (i === 0 || i === N - 1) { b[i] = 1; d[i] = 0; continue; }
    a[i] = 1; b[i] = -2; c[i] = 1;
    d[i] = -Math.sin(k * x[i]) * dx * dx;                 // -f h^2
  }
  return { x, u: triSolveReal(a, b, c, d, N), N };
}

// SCHRODINGER  i psi_t = -1/2 psi_xx (free particle). A Gaussian packet
// (x0, k0, sigma) spreads; |psi|^2 norm is conserved (unitary CN).
export function schrodingerPacket(x, x0, k0, sig) {
  const re = new Float64Array(x.length), im = new Float64Array(x.length);
  let nrm = 0;
  for (let i = 0; i < x.length; i += 1) {
    const g = Math.exp(-((x[i] - x0) ** 2) / (2 * sig * sig));
    re[i] = g * Math.cos(k0 * x[i]); im[i] = g * Math.sin(k0 * x[i]);
    nrm += re[i] * re[i] + im[i] * im[i];
  }
  const s = 1 / Math.sqrt(nrm * (L / (x.length - 1)));
  for (let i = 0; i < x.length; i += 1) { re[i] *= s; im[i] *= s; }
  return { re, im };
}
export function makeSchrodinger(N, x0 = 0.35, k0 = 60, sig = 0.05) {
  const x = makeGrid(N), dx = L / (N - 1), dt = 0.4 * dx * dx;
  const p = schrodingerPacket(x, x0, k0, sig);
  return { x, dx, dt, re: p.re, im: p.im, t: 0, N };
}
export function stepSchrodinger(s) {
  const { N, re, im, dt, dx } = s;
  const r = dt / (2 * dx * dx);                           // i psi_t = -1/2 psi_xx
  const aRe = new Float64Array(N), aIm = new Float64Array(N);
  const bRe = new Float64Array(N), bIm = new Float64Array(N);
  const cRe = new Float64Array(N), cIm = new Float64Array(N);
  const dRe = new Float64Array(N), dIm = new Float64Array(N);
  const xr = new Float64Array(N), xi = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    if (i === 0 || i === N - 1) { bRe[i] = 1; continue; } // psi = 0 at ends
    aIm[i] = -r / 2; bRe[i] = 1; bIm[i] = r; cIm[i] = -r / 2;
    // RHS = (1 - i r ... ) explicit half
    dRe[i] = re[i] - (r / 2) * (-(im[i + 1] - 2 * im[i] + im[i - 1]));
    dIm[i] = im[i] + (r / 2) * (-(re[i + 1] - 2 * re[i] + re[i - 1]));
  }
  tridiagonalSolveComplex(aRe, aIm, bRe, bIm, cRe, cIm, dRe, dIm, xr, xi, N);
  s.re = xr; s.im = xi; s.t += dt;
  return s;
}
export function schrodingerNorm(s) {
  let n = 0; const h = L / (s.N - 1);
  for (let i = 0; i < s.N; i += 1) n += (s.re[i] ** 2 + s.im[i] ** 2);
  return n * h;
}

// BURGERS  u_t + u u_x = nu u_xx (1D Navier-Stokes analogue), periodic.
// Conservative flux form keeps the integral of u; viscosity decays the
// integral of u^2 and smooths the shock.
export function makeBurgers(N, nu, amp = 0.6) {
  const x = makeGrid(N), dx = L / (N - 1), dt = 0.2 * dx * dx / Math.max(nu, 1e-4);
  const u = Float64Array.from(x, (xx) => amp * Math.sin(2 * Math.PI * xx / L));
  return { x, dx, dt: Math.min(dt, 0.4 * dx), nu, u, t: 0, N };
}
export function stepBurgers(s) {
  const { N, u, nu, dt, dx } = s;
  const un = new Float64Array(N);
  for (let i = 0; i < N; i += 1) {
    const ip = (i + 1) % N, im = (i - 1 + N) % N;
    const flux = (u[ip] * u[ip] - u[im] * u[im]) / 4 / dx;          // d(u^2/2)/dx
    const diff = nu * (u[ip] - 2 * u[i] + u[im]) / (dx * dx);
    un[i] = u[i] + dt * (-flux + diff);
  }
  s.u = un; s.t += dt;
  return s;
}
export function burgersIntegral(s) { let q = 0; for (let i = 0; i < s.N; i += 1) q += s.u[i]; return q * s.dx; }
export function burgersEnergy(s) { let e = 0; for (let i = 0; i < s.N; i += 1) e += s.u[i] * s.u[i]; return e * s.dx; }

export function maxError(num, ana) {
  let e = 0; for (let i = 0; i < num.length; i += 1) e = Math.max(e, Math.abs(num[i] - ana[i]));
  return e;
}
