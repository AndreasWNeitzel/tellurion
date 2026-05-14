// 2D hard-disk gas in a box. Wall reflections + elastic disk-disk collisions.
// Emergent equilibrium: 2D Maxwell-Boltzmann speed distribution,
//   f(v) = (m / kT) v exp(-m v^2 / (2 kT)),
// and equipartition: <KE> = kT (2 dof / 2 in 2D for translation).
// Reference: Reif Statistical Physics Ch. 7 (`reif`).
import { makeRng } from '../../../shared/js/render/rng.js';
export function init(N, T_targ, seed = 0xC0FFEE) {
  const rng = makeRng(seed);
  const pos = new Float64Array(2 * N), vel = new Float64Array(2 * N);
  const r = 0.02;
  // Lay out on a small grid then jitter.
  const side = Math.ceil(Math.sqrt(N));
  const sp = 0.95 / (side + 1);
  for (let i = 0; i < N; i += 1) {
    const ix = i % side, iy = Math.floor(i / side);
    pos[2 * i] = -0.475 + (ix + 1) * sp + (rng() - 0.5) * sp * 0.1;
    pos[2 * i + 1] = -0.475 + (iy + 1) * sp + (rng() - 0.5) * sp * 0.1;
    const sp_v = Math.sqrt(2 * T_targ);
    const angle = rng() * 2 * Math.PI;
    vel[2 * i] = sp_v * Math.cos(angle);
    vel[2 * i + 1] = sp_v * Math.sin(angle);
  }
  return { pos, vel, r };
}
export function step(state, dt = 0.001) {
  const { pos, vel, r } = state;
  const N = pos.length / 2;
  for (let i = 0; i < N; i += 1) {
    pos[2 * i] += vel[2 * i] * dt;
    pos[2 * i + 1] += vel[2 * i + 1] * dt;
    if (pos[2 * i] > 0.5 - r) { pos[2 * i] = 0.5 - r; vel[2 * i] = -vel[2 * i]; }
    if (pos[2 * i] < -0.5 + r) { pos[2 * i] = -0.5 + r; vel[2 * i] = -vel[2 * i]; }
    if (pos[2 * i + 1] > 0.5 - r) { pos[2 * i + 1] = 0.5 - r; vel[2 * i + 1] = -vel[2 * i + 1]; }
    if (pos[2 * i + 1] < -0.5 + r) { pos[2 * i + 1] = -0.5 + r; vel[2 * i + 1] = -vel[2 * i + 1]; }
  }
  // Pairwise elastic collision check.
  for (let i = 0; i < N; i += 1) {
    for (let j = i + 1; j < N; j += 1) {
      const dx = pos[2 * j] - pos[2 * i], dy = pos[2 * j + 1] - pos[2 * i + 1];
      const dist2 = dx * dx + dy * dy;
      if (dist2 < (2 * r) ** 2) {
        const dist = Math.sqrt(dist2);
        const nx = dx / dist, ny = dy / dist;
        const overlap = 2 * r - dist;
        pos[2 * i] -= nx * overlap / 2; pos[2 * i + 1] -= ny * overlap / 2;
        pos[2 * j] += nx * overlap / 2; pos[2 * j + 1] += ny * overlap / 2;
        const vrel = (vel[2 * j] - vel[2 * i]) * nx + (vel[2 * j + 1] - vel[2 * i + 1]) * ny;
        if (vrel < 0) {
          vel[2 * i] += vrel * nx; vel[2 * i + 1] += vrel * ny;
          vel[2 * j] -= vrel * nx; vel[2 * j + 1] -= vrel * ny;
        }
      }
    }
  }
}
export function meanKE(state) {
  let s = 0; const N = state.vel.length / 2;
  for (let i = 0; i < N; i += 1) s += 0.5 * (state.vel[2 * i] ** 2 + state.vel[2 * i + 1] ** 2);
  return s / N;
}
export function meanSpeed(state) {
  let s = 0; const N = state.vel.length / 2;
  for (let i = 0; i < N; i += 1) s += Math.hypot(state.vel[2 * i], state.vel[2 * i + 1]);
  return s / N;
}
