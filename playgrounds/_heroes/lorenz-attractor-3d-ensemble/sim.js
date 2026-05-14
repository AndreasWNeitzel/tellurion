// Lorenz attractor ensemble. sigma=10, rho=28, beta=8/3.
import { makeRng } from '../../../shared/js/render/rng.js';
export function initEnsemble(N, eps = 1e-3, seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  const state = new Float64Array(3 * N);
  for (let i = 0; i < N; i += 1) {
    state[3 * i] = 1 + eps * (rng() - 0.5);
    state[3 * i + 1] = 1 + eps * (rng() - 0.5);
    state[3 * i + 2] = 1 + eps * (rng() - 0.5);
  }
  return state;
}
export function rk4(state, dt, sigma = 10, rho = 28, beta = 8 / 3) {
  const N = state.length / 3;
  function f(x, y, z) { return [sigma * (y - x), x * (rho - z) - y, x * y - beta * z]; }
  for (let i = 0; i < N; i += 1) {
    const x = state[3 * i], y = state[3 * i + 1], z = state[3 * i + 2];
    const k1 = f(x, y, z);
    const k2 = f(x + 0.5 * dt * k1[0], y + 0.5 * dt * k1[1], z + 0.5 * dt * k1[2]);
    const k3 = f(x + 0.5 * dt * k2[0], y + 0.5 * dt * k2[1], z + 0.5 * dt * k2[2]);
    const k4 = f(x + dt * k3[0], y + dt * k3[1], z + dt * k3[2]);
    state[3 * i] = x + dt * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6;
    state[3 * i + 1] = y + dt * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
    state[3 * i + 2] = z + dt * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) / 6;
  }
}
export function centroid(state) {
  const N = state.length / 3;
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < N; i += 1) { cx += state[3 * i]; cy += state[3 * i + 1]; cz += state[3 * i + 2]; }
  return [cx / N, cy / N, cz / N];
}
