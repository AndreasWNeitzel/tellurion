// CPU reference for the Lorenz ensemble. The GPU path defers to this for
// correctness; if GPU disagrees with CPU at the same seed, the GPU is wrong.
// State layout: Float32Array of length 3*N, [x0, y0, z0, x1, y1, z1, ...].

export function initEnsemble(N, eps = 1e-3, seed = 0xC0FFEE) {
  let s = seed >>> 0;
  const rnd = () => { s = Math.imul(s, 1664525) + 1013904223 >>> 0; return s / 0x100000000; };
  const state = new Float32Array(3 * N);
  for (let i = 0; i < N; i += 1) {
    state[3 * i] = 1 + eps * (rnd() - 0.5);
    state[3 * i + 1] = 1 + eps * (rnd() - 0.5);
    state[3 * i + 2] = 1 + eps * (rnd() - 0.5);
  }
  return state;
}

const SIGMA = 10, RHO = 28, BETA = 8 / 3;

function f(x, y, z) {
  return [SIGMA * (y - x), x * (RHO - z) - y, x * y - BETA * z];
}

export function rk4Step(state, dt) {
  const N = state.length / 3;
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

export function diameter(state) {
  const N = state.length / 3;
  const c = centroid(state);
  let r2max = 0;
  for (let i = 0; i < N; i += 1) {
    const dx = state[3 * i] - c[0], dy = state[3 * i + 1] - c[1], dz = state[3 * i + 2] - c[2];
    const r2 = dx * dx + dy * dy + dz * dz;
    if (r2 > r2max) r2max = r2;
  }
  return 2 * Math.sqrt(r2max);
}
