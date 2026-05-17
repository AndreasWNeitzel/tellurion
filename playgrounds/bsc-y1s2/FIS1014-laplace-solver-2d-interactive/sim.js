// Laplace / Poisson solver on a square grid by successive
// over-relaxation (SOR). Headless and deterministic; the interactive
// renderer runs the same scheme on a finer grid. Dirichlet cells (the
// conductors) are held fixed each sweep:
//   phi_ij <- (1-w) phi_ij + (w/4)(phi_i+1,j + phi_i-1,j
//                                  + phi_i,j+1 + phi_i,j-1) + w q_ij/4
// with the optimal w ~ 2/(1+sin(pi/N)) ~ 1.8 for these sizes. The
// electric field is E = -grad phi by central differences.
// Reference: Griffiths, Introduction to Electrodynamics (4th ed.),
// Sec. 2.5 and 3.1; Press et al., Numerical Recipes, Sec. 20.5.

export function createGrid(N) {
  return { N, phi: new Float64Array(N * N), fixed: new Uint8Array(N * N), val: new Float64Array(N * N), rho: new Float64Array(N * N) };
}

export function setFixed(g, i, j, v) {
  const k = j * g.N + i;
  g.fixed[k] = 1; g.val[k] = v; g.phi[k] = v;
}

// One red-black SOR sweep. Returns the max absolute update (a residual
// proxy that must decay to zero).
export function sweep(g, omega = 1.8) {
  const { N, phi, fixed, val, rho } = g;
  let maxd = 0;
  for (let color = 0; color < 2; color += 1) {
    for (let j = 1; j < N - 1; j += 1) {
      for (let i = 1 + ((j + color) & 1); i < N - 1; i += 2) {
        const k = j * N + i;
        if (fixed[k]) { phi[k] = val[k]; continue; }
        const nb = 0.25 * (phi[k + 1] + phi[k - 1] + phi[k + N] + phi[k - N] + rho[k]);
        const d = omega * (nb - phi[k]);
        phi[k] += d;
        const ad = Math.abs(d); if (ad > maxd) maxd = ad;
      }
    }
  }
  return maxd;
}

export function relax(g, iters = 400, omega = 1.8) {
  let last = Infinity;
  for (let n = 0; n < iters; n += 1) last = sweep(g, omega);
  return last;
}

// Electric field at a cell: E = -grad phi (central difference).
export function fieldAt(g, i, j) {
  const { N, phi } = g;
  const ex = -(phi[j * N + (i + 1)] - phi[j * N + (i - 1)]) * 0.5;
  const ey = -(phi[(j + 1) * N + i] - phi[(j - 1) * N + i]) * 0.5;
  return [ex, ey];
}

// Max discrete Laplacian over the free (non-fixed, source-free)
// interior: must go to zero for a converged Laplace solution.
export function maxResidual(g) {
  const { N, phi, fixed, rho } = g;
  let m = 0;
  for (let j = 1; j < N - 1; j += 1) for (let i = 1; i < N - 1; i += 1) {
    const k = j * N + i;
    if (fixed[k] || rho[k] !== 0) continue;
    const lap = phi[k + 1] + phi[k - 1] + phi[k + N] + phi[k - N] - 4 * phi[k];
    m = Math.max(m, Math.abs(lap));
  }
  return m;
}

// Presets place Dirichlet conductors on a fresh grid.
export function applyPreset(g, name) {
  const N = g.N;
  g.fixed.fill(0); g.val.fill(0); g.phi.fill(0); g.rho.fill(0);
  if (name === 'plates') {
    const x1 = Math.round(N * 0.32), x2 = Math.round(N * 0.68);
    for (let j = Math.round(N * 0.22); j < N * 0.78; j += 1) { setFixed(g, x1, j, +1); setFixed(g, x2, j, -1); }
  } else if (name === 'coax') {
    const c = (N - 1) / 2, ri = N * 0.10, ro = N * 0.40;
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) {
      const r = Math.hypot(i - c, j - c);
      if (r <= ri) setFixed(g, i, j, +1);
      else if (r >= ro && r < ro + 1.6) setFixed(g, i, j, 0);
    }
  } else if (name === 'dipole') {
    const c = (N - 1) / 2;
    for (let dj = -2; dj <= 2; dj += 1) for (let di = -2; di <= 2; di += 1) {
      setFixed(g, Math.round(c - N * 0.18) + di, Math.round(c) + dj, +1);
      setFixed(g, Math.round(c + N * 0.18) + di, Math.round(c) + dj, -1);
    }
  } else if (name === 'sphere') {
    const c = (N - 1) / 2, R = N * 0.16;
    for (let j = 0; j < N; j += 1) for (let i = 0; i < N; i += 1) if (Math.hypot(i - c, j - c) <= R) setFixed(g, i, j, +1);
  }
  // Grounded box frame for every preset.
  for (let i = 0; i < N; i += 1) { setFixed(g, i, 0, 0); setFixed(g, i, N - 1, 0); setFixed(g, 0, i, 0); setFixed(g, N - 1, i, 0); }
}
