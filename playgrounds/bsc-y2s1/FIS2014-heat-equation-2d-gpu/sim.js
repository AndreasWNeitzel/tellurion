// 2D heat equation with spatially varying diffusivity. Headless and
// deterministic. Explicit forward-Euler finite differences on an NxN
// grid:
//   dT/dt = div( kappa grad T ) + S
// with the conductive flux across a face taken at the arithmetic mean
// of the two cell diffusivities. Stability needs the CFL bound
//   dt <= dx^2 / (4 kappa_max).
// Reference: Press et al., Numerical Recipes, Sec. 20.2; Incropera,
// Fundamentals of Heat and Mass Transfer, Ch. 5.

export function createGrid(N) {
  return {
    N,
    T: new Float64Array(N * N),
    kap: new Float64Array(N * N).fill(1),
    src: new Float64Array(N * N),     // volumetric source S
    fixed: new Uint8Array(N * N),     // Dirichlet flag
    val: new Float64Array(N * N),
  };
}

export function setFixed(g, i, j, v) { const k = j * g.N + i; g.fixed[k] = 1; g.val[k] = v; g.T[k] = v; }
export function setKappa(g, i, j, kp) { g.kap[j * g.N + i] = kp; }

export function cflDt(g, safety = 0.9) {
  let km = 1e-9; for (const v of g.kap) km = Math.max(km, v);
  return safety * 1 / (4 * km);             // dx = 1
}

// One explicit step; insulated (zero-flux) outer edges unless cells are
// fixed. Returns the max |dT| (a steady-state residual proxy).
export function step(g, dt) {
  const { N, T, kap, src, fixed, val } = g;
  const nT = new Float64Array(T);
  let maxd = 0;
  const faceK = (a, b) => 0.5 * (a + b);
  for (let j = 0; j < N; j += 1) {
    for (let i = 0; i < N; i += 1) {
      const k = j * N + i;
      if (fixed[k]) { nT[k] = val[k]; continue; }
      const Tc = T[k];
      const ke = i < N - 1 ? faceK(kap[k], kap[k + 1]) : 0;
      const kw = i > 0 ? faceK(kap[k], kap[k - 1]) : 0;
      const kn = j < N - 1 ? faceK(kap[k], kap[k + N]) : 0;
      const ks = j > 0 ? faceK(kap[k], kap[k - N]) : 0;
      const Te = i < N - 1 ? T[k + 1] : Tc;
      const Tw = i > 0 ? T[k - 1] : Tc;
      const Tn = j < N - 1 ? T[k + N] : Tc;
      const Ts = j > 0 ? T[k - N] : Tc;
      const lap = ke * (Te - Tc) + kw * (Tw - Tc) + kn * (Tn - Tc) + ks * (Ts - Tc);
      const d = dt * (lap + src[k]);
      nT[k] = Tc + d;
      const ad = Math.abs(d); if (ad > maxd) maxd = ad;
    }
  }
  g.T = nT;
  return maxd;
}

export function totalHeat(g) { let s = 0; for (const v of g.T) s += v; return s; }
export function variance(g) {
  let m = 0; for (const v of g.T) m += v; m /= g.T.length;
  let s = 0; for (const v of g.T) s += (v - m) * (v - m); return s / g.T.length;
}

// Max discrete div(kappa grad T) over free, source-free cells: must go
// to zero at steady state (the Laplace/Poisson balance).
export function maxResidual(g) {
  const { N, T, kap, src, fixed } = g;
  let m = 0;
  for (let j = 1; j < N - 1; j += 1) for (let i = 1; i < N - 1; i += 1) {
    const k = j * N + i; if (fixed[k] || src[k] !== 0) continue;
    const r = 0.5 * (kap[k] + kap[k + 1]) * (T[k + 1] - T[k]) + 0.5 * (kap[k] + kap[k - 1]) * (T[k - 1] - T[k])
      + 0.5 * (kap[k] + kap[k + N]) * (T[k + N] - T[k]) + 0.5 * (kap[k] + kap[k - N]) * (T[k - N] - T[k]);
    m = Math.max(m, Math.abs(r));
  }
  return m;
}

export function applyPreset(g, name) {
  const N = g.N;
  g.T.fill(0); g.kap.fill(1); g.src.fill(0); g.fixed.fill(0); g.val.fill(0);
  if (name === 'rod') {
    for (let j = 0; j < N; j += 1) { setFixed(g, 1, j, 1); setFixed(g, N - 2, j, 0); }
  } else if (name === 'composite') {
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) g.kap[j * N + i] = i < N / 2 ? 4 : 0.25;
    for (let j = 0; j < N; j += 1) { setFixed(g, 1, j, 1); setFixed(g, N - 2, j, 0); }
  } else if (name === 'radiator') {
    for (let j = N * 0.7; j < N * 0.85; j += 1) for (let i = N * 0.1; i < N * 0.25; i += 1) g.src[(j | 0) * N + (i | 0)] = 0.05;
    for (let i = 0; i < N; i += 1) { setFixed(g, i, N - 1, 0); }
  } else if (name === 'heatsink') {
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) if (i < N * 0.3) g.kap[j * N + i] = 6;
    for (let j = N * 0.4; j < N * 0.6; j += 1) for (let i = 0; i < 3; i += 1) g.src[(j | 0) * N + i] = 0.06;
    for (let i = 0; i < N; i += 1) setFixed(g, N - 1, i, 0);
  }
}
