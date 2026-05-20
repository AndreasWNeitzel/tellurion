// Headless 3D N-body orrery: a heavy central body plus several
// orbiting planets, plus two ghost asteroids that demonstrate
// sensitivity to initial conditions. The acceleration function is the
// gravitational sum with Plummer softening; the symplectic Yoshida-4
// integrator from the shared engine advances the state. Reference:
// Yoshida, Phys. Lett. A 150 (1990) 262 (`yoshida1990`); Newton,
// Principia Book III (gravitation).

import { create as createSymplectic, step, diagnostics } from '../../../shared/js/engine/symplectic.js';

const G = 1.0;
const EPS = 0.01;
const EPS2 = EPS * EPS;

// 3D N-body acceleration sum. The positions vector is laid out as
// (x0, y0, z0, x1, y1, z1, ...). Output is written into outAccel.
export function nbodyAccel3D(q, qdot, m, t, outAccel) {
  const n = q.length / 3 | 0;
  for (let i = 0; i < 3 * n; i += 1) outAccel[i] = 0;
  for (let i = 0; i < n; i += 1) {
    const xi = q[3 * i], yi = q[3 * i + 1], zi = q[3 * i + 2];
    for (let j = i + 1; j < n; j += 1) {
      const dx = q[3 * j] - xi, dy = q[3 * j + 1] - yi, dz = q[3 * j + 2] - zi;
      const r2 = dx * dx + dy * dy + dz * dz + EPS2;
      const inv = 1 / (r2 * Math.sqrt(r2));
      const fx = G * inv * dx, fy = G * inv * dy, fz = G * inv * dz;
      const mi = m[3 * i], mj = m[3 * j];      // m duplicated per DOF
      outAccel[3 * i]     += mj * fx;
      outAccel[3 * i + 1] += mj * fy;
      outAccel[3 * i + 2] += mj * fz;
      outAccel[3 * j]     -= mi * fx;
      outAccel[3 * j + 1] -= mi * fy;
      outAccel[3 * j + 2] -= mi * fz;
    }
  }
}

export function nbodyEnergy3D(q, qdot, m) {
  const n = q.length / 3 | 0;
  let K = 0;
  for (let i = 0; i < n; i += 1) {
    const vx = qdot[3 * i], vy = qdot[3 * i + 1], vz = qdot[3 * i + 2];
    K += 0.5 * m[3 * i] * (vx * vx + vy * vy + vz * vz);
  }
  let U = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const dx = q[3 * j] - q[3 * i];
      const dy = q[3 * j + 1] - q[3 * i + 1];
      const dz = q[3 * j + 2] - q[3 * i + 2];
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz + EPS2);
      U -= G * m[3 * i] * m[3 * j] / r;
    }
  }
  return K + U;
}

// Build the orrery: 1 sun (mass M_sun) + N_PLANETS planets in 3D Kepler
// orbits (random inclinations) + N_GHOST identical ghost asteroids
// separated by a tiny epsilon offset. Returns positions, velocities,
// masses arrays (per-DOF) and bookkeeping for which body is what.
export function makeOrrery(opts = {}) {
  const { seed = 0xC0FFEE, M_sun = 100, n_planets = 5, n_ghost = 2 } = opts;
  let s = seed | 0 || 1;
  const rand = () => {
    s = (s * 1664525 + 1013904223) | 0;
    return ((s >>> 0) % 0xFFFFFFFF) / 0xFFFFFFFF;
  };
  const N = 1 + n_planets + n_ghost;
  const q = new Float64Array(3 * N);
  const qdot = new Float64Array(3 * N);
  const m = new Float64Array(3 * N);
  // Sun at origin.
  m[0] = m[1] = m[2] = M_sun;
  // Planets: orbital radii 0.6, 1.0, 1.6, 2.5, 4.0; small inclinations.
  const radii = [0.6, 1.0, 1.6, 2.5, 4.0];
  const masses = [0.6, 1.0, 0.8, 0.4, 1.4];           // toy planet masses
  for (let p = 0; p < n_planets; p += 1) {
    const i = 1 + p;
    const r = radii[p];
    const incl = (rand() - 0.5) * 0.4;
    const phi = rand() * 2 * Math.PI;
    const x = r * Math.cos(phi);
    const y = r * Math.sin(phi);
    const z = r * Math.sin(incl);
    q[3 * i] = x;
    q[3 * i + 1] = y;
    q[3 * i + 2] = z;
    // Circular speed around the sun (ignoring planet-planet for IC).
    const vCirc = Math.sqrt(G * M_sun / r);
    const cosI = Math.cos(incl);
    qdot[3 * i]     = -vCirc * Math.sin(phi) * cosI;
    qdot[3 * i + 1] =  vCirc * Math.cos(phi) * cosI;
    qdot[3 * i + 2] =  vCirc * Math.sin(incl) * 0.3;
    m[3 * i] = m[3 * i + 1] = m[3 * i + 2] = masses[p];
  }
  // Ghost asteroids: identical orbits with a 1e-6 offset in phi, all at
  // radius 3.2, between Mars and Jupiter. Their trajectories will
  // diverge as Yoshida-4 amplifies the offset along the unstable
  // manifold of nearby resonances.
  for (let g = 0; g < n_ghost; g += 1) {
    const i = 1 + n_planets + g;
    const r = 3.2;
    const phi = 0.7 + g * 1e-6;          // microscopic separation
    const x = r * Math.cos(phi);
    const y = r * Math.sin(phi);
    const z = 0;
    q[3 * i] = x;
    q[3 * i + 1] = y;
    q[3 * i + 2] = z;
    const vCirc = Math.sqrt(G * M_sun / r);
    qdot[3 * i]     = -vCirc * Math.sin(phi);
    qdot[3 * i + 1] =  vCirc * Math.cos(phi);
    qdot[3 * i + 2] = 0;
    // Massless test particles (still use small mass for bookkeeping).
    m[3 * i] = m[3 * i + 1] = m[3 * i + 2] = 1e-9;
  }
  return { positions: q, velocities: qdot, masses: m, N, n_planets, n_ghost, M_sun };
}

// Convenience: create a symplectic instance directly from an orrery.
export function makeOrreryInstance(opts) {
  const orr = makeOrrery(opts);
  const inst = createSymplectic({
    positions: orr.positions,
    velocities: orr.velocities,
    masses: orr.masses,
    accelerationFn: nbodyAccel3D,
    energyFn: nbodyEnergy3D,
    integrator: 'yoshida4',
  });
  inst.orrery = orr;
  return inst;
}

export { step, diagnostics };
