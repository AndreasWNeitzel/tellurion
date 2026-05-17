// 2D isotropic linear elasticity: a vector displacement field u on a
// square grid obeying
//   rho u_tt = (lambda + mu) grad(div u) + mu lap(u).
// Explicit leapfrog. Compressional (P) waves carry divergence and
// travel at v_P = sqrt((lambda + 2 mu)/rho); shear (S) waves carry
// curl and travel at v_S = sqrt(mu/rho). A directed point force
// radiates both; a seismograph at distance d records the P arrival
// then the S arrival, delay d (1/v_S - 1/v_P). Headless and
// deterministic. Reference: Landau and Lifshitz, Theory of Elasticity
// (Vol. 7), Sec. 22-24.

export function speeds(lambda, mu, rho) {
  return { vP: Math.sqrt((lambda + 2 * mu) / rho), vS: Math.sqrt(mu / rho) };
}

// Stable dt from the fastest wave: dt < dx / (v_P sqrt 2).
export function cflDt(lambda, mu, rho, dx = 1, safety = 0.85) {
  const vP = Math.sqrt((lambda + 2 * mu) / rho);
  return safety * dx / (vP * Math.SQRT2);
}

export function makeSolid(N, dx = 1) {
  return {
    N, dx,
    ux: new Float64Array(N * N), uy: new Float64Array(N * N),
    pux: new Float64Array(N * N), puy: new Float64Array(N * N),
    t: 0,
  };
}

// Ricker (Mexican-hat) temporal pulse, peak frequency f0.
export function ricker(t, t0, f0) {
  const a = Math.PI * f0 * (t - t0);
  return (1 - 2 * a * a) * Math.exp(-a * a);
}

// One leapfrog step. force(i,j) -> [fx, fy] body force (per unit
// volume) applied this step; pass null for free propagation. A
// sponge of width `sponge` damps the edges.
export function step(state, lambda, mu, rho, dt, force, sponge = 10) {
  const { N, dx, ux, uy, pux, puy } = state;
  const nux = new Float64Array(N * N), nuy = new Float64Array(N * N);
  const c1 = (lambda + mu) / rho, c2 = mu / rho;
  const dt2 = dt * dt, h = dx, h2 = dx * dx;
  for (let j = 1; j < N - 1; j += 1) {
    for (let i = 1; i < N - 1; i += 1) {
      const k = j * N + i;
      // divergence at the four neighbours, for grad(div u)
      const div_ip = (i < N - 2) ? ((ux[k + 2] - ux[k]) / (2 * h) + (uy[k + 1 + N] - uy[k + 1 - N]) / (2 * h)) : 0;
      const div_im = (i > 1) ? ((ux[k] - ux[k - 2]) / (2 * h) + (uy[k - 1 + N] - uy[k - 1 - N]) / (2 * h)) : 0;
      const div_jp = (j < N - 2) ? ((ux[k + N + 1] - ux[k + N - 1]) / (2 * h) + (uy[k + 2 * N] - uy[k]) / (2 * h)) : 0;
      const div_jm = (j > 1) ? ((ux[k - N + 1] - ux[k - N - 1]) / (2 * h) + (uy[k] - uy[k - 2 * N]) / (2 * h)) : 0;
      const gradDivx = (div_ip - div_im) / (2 * h);
      const gradDivy = (div_jp - div_jm) / (2 * h);
      const lapx = (ux[k + 1] + ux[k - 1] + ux[k + N] + ux[k - N] - 4 * ux[k]) / h2;
      const lapy = (uy[k + 1] + uy[k - 1] + uy[k + N] + uy[k - N] - 4 * uy[k]) / h2;
      let ax = c1 * gradDivx + c2 * lapx;
      let ay = c1 * gradDivy + c2 * lapy;
      if (force) { const f = force(i, j); if (f) { ax += f[0] / rho; ay += f[1] / rho; } }
      nux[k] = 2 * ux[k] - pux[k] + dt2 * ax;
      nuy[k] = 2 * uy[k] - puy[k] + dt2 * ay;
    }
  }
  // absorbing sponge ramp at the edges
  if (sponge > 0) {
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
      const d = Math.min(i, j, N - 1 - i, N - 1 - j);
      if (d < sponge) { const r = 0.94 + 0.06 * (d / sponge); const k = j * N + i; nux[k] *= r; nuy[k] *= r; }
    }
  }
  state.pux = ux; state.puy = uy; state.ux = nux; state.uy = nuy; state.t += dt;
}

// Scalar fields: divergence (P content) and out-of-plane curl (S).
export function divergence(state, i, j) {
  const { N, dx, ux, uy } = state, k = j * N + i;
  return (ux[k + 1] - ux[k - 1]) / (2 * dx) + (uy[k + N] - uy[k - N]) / (2 * dx);
}
export function curlZ(state, i, j) {
  const { N, dx, ux, uy } = state, k = j * N + i;
  return (uy[k + 1] - uy[k - 1]) / (2 * dx) - (ux[k + N] - ux[k - N]) / (2 * dx);
}

// Radius (from the source) at which |field| first exceeds a fraction
// of its current global max, i.e. the wavefront radius of that mode.
export function frontRadius(state, kind, si, sj, frac = 0.18) {
  const { N } = state;
  const fn = kind === 'P' ? divergence : curlZ;
  let mx = 0;
  for (let j = 2; j < N - 2; j += 1) for (let i = 2; i < N - 2; i += 1) mx = Math.max(mx, Math.abs(fn(state, i, j)));
  if (mx < 1e-12) return 0;
  const thr = frac * mx;
  let rMax = 0;
  for (let j = 2; j < N - 2; j += 1) for (let i = 2; i < N - 2; i += 1) {
    if (Math.abs(fn(state, i, j)) > thr) { const r = Math.hypot(i - si, j - sj); if (r > rMax) rMax = r; }
  }
  return rMax;
}

export function totalEnergy(state) {
  const { N, ux, uy, pux, puy } = state;
  let E = 0;
  for (let idx = 0; idx < N * N; idx += 1) E += (ux[idx] - pux[idx]) ** 2 + (uy[idx] - puy[idx]) ** 2;
  return E;
}
