// 2D Lennard-Jones molecular dynamics in a periodic box, reduced
// units (sigma = epsilon = m = kB = 1). The velocity-Verlet
// integration is the verified shared symplectic engine; this file
// supplies the shifted-force LJ interaction (continuous force and
// energy at the cutoff, so energy is conserved cleanly), the
// minimum-image convention, and the thermodynamic estimators:
// kinetic temperature, the virial pressure, and the radial
// distribution g(r). Reference: Allen and Tildesley, Computer
// Simulation of Liquids (2nd ed.), Ch. 1-3 (`allen-tildesley`).

import { create, step, diagnostics, snapshot, restore } from '../../../shared/js/engine/symplectic.js';
import { makeRng, gaussian } from '../../../shared/js/render/rng.js';

export { diagnostics, snapshot, restore };
export const RC = 2.5;

// Raw LJ potential and the radial force magnitude F = -dU/dr.
export function ljPotentialRaw(r) { const i6 = 1 / r ** 6; return 4 * (i6 * i6 - i6); }
// Radial force magnitude F(r) = -dU/dr = 24 (2 r^-13 - r^-7).
export function ljForceRaw(r) { const i6 = 1 / r ** 6; return (24 / r) * (2 * i6 * i6 - i6); }
const U_RC = ljPotentialRaw(RC), F_RC = ljForceRaw(RC);

// Shifted-force LJ: Fsf(rc) = 0 and Usf(rc) = 0, both continuous.
export function ljForce(r) { return r >= RC ? 0 : ljForceRaw(r) - F_RC; }
export function ljPotential(r) { return r >= RC ? 0 : ljPotentialRaw(r) - U_RC - F_RC * (RC - r); }

function buildAccelEnergy(N, L) {
  const half = L / 2;
  const mic = (d) => (d > half ? d - L : (d < -half ? d + L : d));
  function accel(q, qdot, m, t, out) {
    out.fill(0);
    for (let i = 0; i < N; i += 1) {
      const xi = q[2 * i], yi = q[2 * i + 1];
      for (let j = i + 1; j < N; j += 1) {
        const dx = mic(xi - q[2 * j]), dy = mic(yi - q[2 * j + 1]);
        const r2 = dx * dx + dy * dy;
        if (r2 >= RC * RC || r2 < 1e-12) continue;
        const r = Math.sqrt(r2), f = ljForce(r) / r;     // f * (dx,dy) = force vector
        out[2 * i] += f * dx; out[2 * i + 1] += f * dy;
        out[2 * j] -= f * dx; out[2 * j + 1] -= f * dy;
      }
    }
  }
  function energy(q, qdot, m) {
    let ke = 0;
    for (let i = 0; i < N; i += 1) ke += 0.5 * m[i] * (qdot[2 * i] ** 2 + qdot[2 * i + 1] ** 2);
    let pe = 0;
    for (let i = 0; i < N; i += 1) {
      const xi = q[2 * i], yi = q[2 * i + 1];
      for (let j = i + 1; j < N; j += 1) {
        const dx = mic(xi - q[2 * j]), dy = mic(yi - q[2 * j + 1]);
        const r2 = dx * dx + dy * dy;
        if (r2 < RC * RC && r2 > 1e-12) pe += ljPotential(Math.sqrt(r2));
      }
    }
    return ke + pe;
  }
  return { accel, energy, mic };
}

// N particles on a square lattice in an L x L box with rho = N/L^2,
// Maxwell-Boltzmann velocities at temperature T0, net momentum zeroed.
export function makeLJ({ N = 144, rho = 0.6, T0 = 1.0, seed = 0xC0FFEE } = {}) {
  const L = Math.sqrt(N / rho);
  const side = Math.ceil(Math.sqrt(N));
  const a = L / side;
  const rng = makeRng(seed);
  const pos = new Float64Array(2 * N), vel = new Float64Array(2 * N), m = new Float64Array(N).fill(1);
  let k = 0;
  for (let iy = 0; iy < side && k < N; iy += 1) {
    for (let ix = 0; ix < side && k < N; ix += 1) {
      pos[2 * k] = (ix + 0.5) * a; pos[2 * k + 1] = (iy + 0.5) * a; k += 1;
    }
  }
  let px = 0, py = 0;
  for (let i = 0; i < N; i += 1) {
    vel[2 * i] = gaussian(rng, 0, Math.sqrt(T0));
    vel[2 * i + 1] = gaussian(rng, 0, Math.sqrt(T0));
    px += vel[2 * i]; py += vel[2 * i + 1];
  }
  for (let i = 0; i < N; i += 1) { vel[2 * i] -= px / N; vel[2 * i + 1] -= py / N; }
  const { accel, energy, mic } = buildAccelEnergy(N, L);
  const inst = create({ positions: pos, velocities: vel, masses: m, accelerationFn: accel, energyFn: energy, integrator: 'verlet' });
  const state = { inst, N, L, rho, mic };
  rescaleTo(state, T0);
  return state;
}

function wrap(state) {
  const { inst, N, L } = state;
  for (let i = 0; i < 2 * N; i += 1) { inst.q[i] = ((inst.q[i] % L) + L) % L; }
}

export function ljStep(state, dt, sub = 1) {
  for (let s = 0; s < sub; s += 1) step(state.inst, dt);
  wrap(state);
}

export function kineticEnergy(state) {
  const { inst, N } = state;
  let ke = 0;
  for (let i = 0; i < N; i += 1) ke += 0.5 * (inst.qdot[2 * i] ** 2 + inst.qdot[2 * i + 1] ** 2);
  return ke;
}

// 2D equipartition: KE = (dof/2) kT, dof = 2N (momentum removed gives
// 2N-2 but 2N is the standard estimator at large N).
export function temperature(state) { return kineticEnergy(state) / state.N; }

export function rescaleTo(state, T) {
  const cur = temperature(state);
  if (cur <= 1e-12) return;
  const s = Math.sqrt(T / cur);
  for (let i = 0; i < 2 * state.N; i += 1) state.inst.qdot[i] *= s;
}

export function totalMomentum(state) {
  const { inst, N } = state;
  let px = 0, py = 0;
  for (let i = 0; i < N; i += 1) { px += inst.qdot[2 * i]; py += inst.qdot[2 * i + 1]; }
  return Math.hypot(px, py);
}

export function minPairDistance(state) {
  const { inst, N, L, mic } = state;
  let mn = Infinity;
  for (let i = 0; i < N; i += 1) {
    for (let j = i + 1; j < N; j += 1) {
      const dx = mic(inst.q[2 * i] - inst.q[2 * j]), dy = mic(inst.q[2 * i + 1] - inst.q[2 * j + 1]);
      const r = Math.hypot(dx, dy);
      if (r < mn) mn = r;
    }
  }
  return mn;
}

// 2D virial pressure: P = rho T + (1 / (2 V)) sum_{i<j} r_ij . F_ij.
export function pressure(state, T = temperature(state)) {
  const { inst, N, L, mic } = state;
  let vir = 0;
  for (let i = 0; i < N; i += 1) {
    for (let j = i + 1; j < N; j += 1) {
      const dx = mic(inst.q[2 * i] - inst.q[2 * j]), dy = mic(inst.q[2 * i + 1] - inst.q[2 * j + 1]);
      const r2 = dx * dx + dy * dy;
      if (r2 >= RC * RC || r2 < 1e-12) continue;
      const r = Math.sqrt(r2);
      vir += r * ljForce(r);                              // r . F = r * |F| (radial)
    }
  }
  const V = L * L;
  return state.rho * T + vir / (2 * V);
}

// Radial distribution function g(r) (2D normalization: ideal shell
// area 2 pi r dr, density rho).
export function radialDistribution(state, nbins = 100, rmax = null) {
  const { inst, N, L, mic } = state;
  rmax = rmax ?? L / 2;
  const dr = rmax / nbins, hist = new Float64Array(nbins);
  for (let i = 0; i < N; i += 1) {
    for (let j = i + 1; j < N; j += 1) {
      const dx = mic(inst.q[2 * i] - inst.q[2 * j]), dy = mic(inst.q[2 * i + 1] - inst.q[2 * j + 1]);
      const r = Math.hypot(dx, dy);
      if (r < rmax) { const b = Math.floor(r / dr); hist[b] += 2; }
    }
  }
  const g = new Float64Array(nbins), rs = new Float64Array(nbins);
  for (let b = 0; b < nbins; b += 1) {
    const rIn = b * dr, rOut = rIn + dr;
    const shell = Math.PI * (rOut * rOut - rIn * rIn);    // 2D shell area
    const ideal = state.rho * shell * N;
    rs[b] = (rIn + rOut) / 2;
    g[b] = ideal > 0 ? hist[b] / ideal : 0;
  }
  return { r: rs, g };
}
