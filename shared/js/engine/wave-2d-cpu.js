// 2D wave equation, leapfrog. Square grid with Dirichlet (u = 0) at boundary.
//   u_tt = c^2 (u_xx + u_yy) - gamma u_t.
// Stability: dt < dx / (c sqrt(2)).
export function makeGrid(N, dx = 1) {
  return { N, dx, u: new Float32Array(N * N), uPrev: new Float32Array(N * N) };
}
export function seedImpulse(state, cx, cy, A, sigma) {
  const { N, u, uPrev } = state;
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
    const r2 = (x - cx) ** 2 + (y - cy) ** 2;
    const v = A * Math.exp(-r2 / (sigma * sigma));
    u[y * N + x] += v;
    uPrev[y * N + x] += v;
  }
}
export function step(state, c, gamma, dt) {
  const { N, dx, u, uPrev } = state;
  const a = c * c * dt * dt / (dx * dx);
  const g = gamma * dt;
  const uNew = new Float32Array(N * N);
  for (let y = 1; y < N - 1; y += 1) {
    for (let x = 1; x < N - 1; x += 1) {
      const i = y * N + x;
      const lap = u[i - 1] + u[i + 1] + u[i - N] + u[i + N] - 4 * u[i];
      uNew[i] = (2 * u[i] - uPrev[i] + a * lap - g * (u[i] - uPrev[i])) / (1 + g * 0.001);
    }
  }
  state.uPrev = u; state.u = uNew;
}
export function totalEnergy(state, c, dx) {
  const { N, u, uPrev } = state;
  let E = 0;
  for (let i = 0; i < N * N; i += 1) E += (u[i] - uPrev[i]) ** 2;
  for (let y = 1; y < N - 1; y += 1) for (let x = 1; x < N - 1; x += 1) {
    const i = y * N + x;
    const grad2 = ((u[i + 1] - u[i - 1]) / (2 * dx)) ** 2 + ((u[i + N] - u[i - N]) / (2 * dx)) ** 2;
    E += c * c * grad2;
  }
  return E;
}

// Barrier-aware variant (rigid Dirichlet obstacles plus an absorbing
// sponge band) for the wave-2d-complex-geometry playground. The
// original four exports above are left byte-identical so existing
// golden frames do not move.

export function makeBarrier(N) { return new Uint8Array(N * N); }

// Vertical wall at grid column xCol with rectangular slit gaps.
// slits is an array of [centerY, halfHeight] in grid units.
export function addWallWithSlits(barrier, N, xCol, slits, thickness = 2) {
  for (let y = 0; y < N; y += 1) {
    let open = false;
    for (const [cy, hh] of slits) if (Math.abs(y - cy) <= hh) open = true;
    if (open) continue;
    for (let t = 0; t < thickness; t += 1) {
      const x = xCol + t; if (x >= 0 && x < N) barrier[y * N + x] = 1;
    }
  }
  return barrier;
}

// Sponge multiplier: 1 in the interior, ramping below 1 within a band
// of width w at each edge so outgoing waves are absorbed and the
// far-field pattern is not contaminated by reflections.
export function makeSponge(N, w = 24, floor = 0.92) {
  const s = new Float32Array(N * N).fill(1);
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
    const d = Math.min(x, y, N - 1 - x, N - 1 - y);
    if (d < w) { const r = d / w; s[y * N + x] = floor + (1 - floor) * r * r; }
  }
  return s;
}

// Leapfrog step with rigid barriers (u held at 0) and an optional
// absorbing sponge. Same core stencil and damping as step().
export function stepBarriered(state, c, gamma, dt, barrier, sponge = null) {
  const { N, dx, u, uPrev } = state;
  const a = c * c * dt * dt / (dx * dx);
  const g = gamma * dt;
  const uNew = new Float32Array(N * N);
  for (let y = 1; y < N - 1; y += 1) {
    for (let x = 1; x < N - 1; x += 1) {
      const i = y * N + x;
      if (barrier && barrier[i]) { uNew[i] = 0; continue; }
      const lap = u[i - 1] + u[i + 1] + u[i - N] + u[i + N] - 4 * u[i];
      let v = (2 * u[i] - uPrev[i] + a * lap - g * (u[i] - uPrev[i])) / (1 + g * 0.001);
      if (sponge) v *= sponge[i];
      uNew[i] = v;
    }
  }
  state.uPrev = u; state.u = uNew;
}

// Soft monochromatic point source, added to u and uPrev so it does not
// inject a spurious velocity transient.
export function addSourceRing(state, cx, cy, A, phase) {
  const { N, u, uPrev } = state;
  for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) {
    const x = cx + dx, y = cy + dy; if (x < 1 || y < 1 || x >= N - 1 || y >= N - 1) continue;
    const w = Math.exp(-(dx * dx + dy * dy) / 4) * A * Math.sin(phase);
    u[y * N + x] += w; uPrev[y * N + x] += w;
  }
}
