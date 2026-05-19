// Time-dependent Schrodinger equation, Crank-Nicolson (DOM-free).
//
//   i d psi/dt = [ -1/2 d^2/dx^2 + V(x) ] psi      (hbar = m = 1)
//
// solved by Crank-Nicolson on a uniform grid:
//
//   (1 + i dt/2 H) psi^{n+1} = (1 - i dt/2 H) psi^n .
//
// CN is unitary by construction, so the total probability is
// conserved to round-off every step (the anti-cheat invariant). The
// complex tridiagonal solve reuses shared/js/engine/cn-tridiag.js
// (no engine duplication). A rectangular barrier has a closed-form
// transmission coefficient that the playground reads off; a classical
// ball is integrated alongside for the contrast (it never passes a
// barrier taller than its energy; the quantum packet tunnels).
//
// References: Griffiths, Introduction to Quantum Mechanics, 3rd ed.,
// CUP 2018, Ch. 2 (rectangular barrier); Press et al., Numerical
// Recipes, 3rd ed., Sec. 19.2 (Crank-Nicolson for the TDSE).

import { tridiagonalSolveComplex } from './cn-tridiag.js';

export function makeTDSE(N = 2048, L = 200) {
  const dx = L / N;
  const x = new Float64Array(N);
  for (let i = 0; i < N; i += 1) x[i] = -L / 2 + i * dx;
  return {
    N, L, dx, t: 0,
    x,
    psiRe: new Float64Array(N), psiIm: new Float64Array(N),
    V: new Float64Array(N),
    // CN tridiagonal coefficient scratch (rebuilt if dt or V changes).
    aRe: new Float64Array(N), aIm: new Float64Array(N),
    bRe: new Float64Array(N), bIm: new Float64Array(N),
    cRe: new Float64Array(N), cIm: new Float64Array(N),
    dRe: new Float64Array(N), dIm: new Float64Array(N),
    xRe: new Float64Array(N), xIm: new Float64Array(N),
    _dt: 0,
    classical: null,                       // {x, p, E} contrast particle
  };
}

// Normalised Gaussian wavepacket centred at x0, mean wavenumber k0,
// spatial width sigma. Mean kinetic energy ~ k0^2/2 + 1/(8 sigma^2).
export function setPacket(s, x0, k0, sigma) {
  const { N, dx, x } = s;
  let norm = 0;
  for (let i = 0; i < N; i += 1) {
    const g = Math.exp(-((x[i] - x0) ** 2) / (4 * sigma * sigma));
    s.psiRe[i] = g * Math.cos(k0 * x[i]);
    s.psiIm[i] = g * Math.sin(k0 * x[i]);
    norm += s.psiRe[i] ** 2 + s.psiIm[i] ** 2;
  }
  const inv = 1 / Math.sqrt(norm * dx);
  for (let i = 0; i < N; i += 1) { s.psiRe[i] *= inv; s.psiIm[i] *= inv; }
  s.t = 0;
  s.classical = { x: x0, p: k0, E: 0.5 * k0 * k0 };   // hbar=m=1
}

// Potential builders. kind: 'rect' | 'double' | 'step' | 'free'.
// height V0, width a (in x units), centred at x=0. Returns the right
// edge of the (last) barrier for the transmission window.
export function setPotential(s, kind, V0, a, gap = 6) {
  const { N, x } = s;
  s.V.fill(0);
  let rightEdge = a / 2;
  if (kind === 'rect') {
    for (let i = 0; i < N; i += 1) if (Math.abs(x[i]) < a / 2) s.V[i] = V0;
  } else if (kind === 'double') {
    for (let i = 0; i < N; i += 1) {
      const xi = x[i];
      if (Math.abs(xi - (-(gap / 2 + a / 2))) < a / 2 || Math.abs(xi - (gap / 2 + a / 2)) < a / 2) s.V[i] = V0;
    }
    rightEdge = gap / 2 + a;
  } else if (kind === 'step') {
    for (let i = 0; i < N; i += 1) if (x[i] > 0) s.V[i] = V0;
    rightEdge = 0;
  }
  s.barrierRight = rightEdge;
  s.barrierKind = kind; s.V0 = V0; s.bw = a;
  return rightEdge;
}

// Directly sculpt the potential in a window (the "drag the terrain"
// interaction). Adds delta in a soft bump around xc of half-width w.
export function sculptV(s, xc, w, delta) {
  for (let i = 0; i < s.N; i += 1) {
    const u = (s.x[i] - xc) / w;
    if (Math.abs(u) < 1) s.V[i] = Math.max(0, s.V[i] + delta * (1 - u * u));
  }
}

function buildCN(s, dt) {
  const { N, dx } = s;
  // alpha = i dt / (4 dx^2);  H = -1/2 d2 + V
  const alpha = dt / (4 * dx * dx);              // multiplies i
  for (let i = 0; i < N; i += 1) {
    // A = 1 + i dt/2 H : offdiag = -i*alpha ; diag = 1 + i(2 alpha + dt/2 V)
    s.aRe[i] = 0; s.aIm[i] = -alpha;
    s.cRe[i] = 0; s.cIm[i] = -alpha;
    s.bRe[i] = 1; s.bIm[i] = 2 * alpha + 0.5 * dt * s.V[i];
  }
  // Dirichlet ends: decouple the boundary rows.
  s.aIm[0] = 0; s.cIm[0] = 0; s.bIm[0] = 0; s.bRe[0] = 1;
  s.aIm[N - 1] = 0; s.cIm[N - 1] = 0; s.bIm[N - 1] = 0; s.bRe[N - 1] = 1;
  s._dt = dt;
}

export function step(s, dt) {
  const { N } = s;
  if (s._dt !== dt) buildCN(s, dt);
  const alpha = dt / (4 * s.dx * s.dx);
  // RHS d = (1 - i dt/2 H) psi : offdiag +i alpha ; diag 1 - i(2alpha + dt/2 V)
  for (let i = 1; i < N - 1; i += 1) {
    const dgRe = 1, dgIm = -(2 * alpha + 0.5 * dt * s.V[i]);
    // diag * psi_i
    let re = dgRe * s.psiRe[i] - dgIm * s.psiIm[i];
    let im = dgRe * s.psiIm[i] + dgIm * s.psiRe[i];
    // + i alpha * (psi_{i-1} + psi_{i+1})
    const sRe = s.psiRe[i - 1] + s.psiRe[i + 1];
    const sIm = s.psiIm[i - 1] + s.psiIm[i + 1];
    re += -alpha * sIm;          // i*alpha*(sRe+ i sIm) = -alpha sIm + i alpha sRe
    im += alpha * sRe;
    s.dRe[i] = re; s.dIm[i] = im;
  }
  s.dRe[0] = 0; s.dIm[0] = 0; s.dRe[N - 1] = 0; s.dIm[N - 1] = 0;
  tridiagonalSolveComplex(s.aRe, s.aIm, s.bRe, s.bIm, s.cRe, s.cIm, s.dRe, s.dIm, s.xRe, s.xIm, N);
  s.psiRe.set(s.xRe); s.psiIm.set(s.xIm);
  s.t += dt;
  // classical contrast: a ball with the packet's mean energy. It only
  // crosses a barrier whose height is below its energy.
  if (s.classical) {
    const c = s.classical;
    const Vmax = maxBarrier(s);
    if (c.E > Vmax || c.x > (s.barrierRight ?? 0)) c.x += c.p * dt;
    else c.p = -Math.abs(c.p), c.x += c.p * dt;     // reflect
  }
}

function maxBarrier(s) { let m = 0; for (let i = 0; i < s.N; i += 1) m = Math.max(m, s.V[i]); return m; }

export function norm(s) {
  let n = 0; for (let i = 0; i < s.N; i += 1) n += s.psiRe[i] ** 2 + s.psiIm[i] ** 2;
  return n * s.dx;
}

// Probability to the right of the last barrier (transmitted) and to
// the left (reflected). After the packet clears the barrier these sum
// to ~1.
export function fluxSplit(s) {
  const xr = s.barrierRight ?? 0;
  let T = 0, R = 0;
  for (let i = 0; i < s.N; i += 1) {
    const p = (s.psiRe[i] ** 2 + s.psiIm[i] ** 2) * s.dx;
    if (s.x[i] > xr) T += p; else R += p;
  }
  return { T, R };
}

// Closed-form transmission of a rectangular barrier height V0, width
// a, for a particle of energy E (hbar = m = 1). Griffiths Eq. 2.169.
export function rectBarrierT(E, V0, a) {
  if (V0 <= 0) return 1;
  if (E < V0) {
    const k = Math.sqrt(2 * (V0 - E));
    const s = Math.sinh(k * a);
    return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (V0 - E)));
  }
  if (E > V0) {
    const k = Math.sqrt(2 * (E - V0));
    const s = Math.sin(k * a);
    return 1 / (1 + (V0 * V0 * s * s) / (4 * E * (E - V0)));
  }
  // E == V0
  const ka = Math.sqrt(2 * E) * a;
  return 1 / (1 + (ka * ka) / 4);
}
