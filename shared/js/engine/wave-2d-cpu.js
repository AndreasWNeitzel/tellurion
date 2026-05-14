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
