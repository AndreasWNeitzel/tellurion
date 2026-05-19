// Pure D2Q9 lattice-Boltzmann core (no DOM), shared by playground.js and
// invariants.test.mjs. BGK single-relaxation collision, steady inflow on
// the left, zero-gradient outflow on the right, half-way bounce-back at
// solid cells and walls. Reduced lattice units (dx = dt = 1, c_s^2 = 1/3).
//
// Kinematic viscosity nu = (tau - 1/2) / 3; the obstacle Reynolds number
// is Re = uIn * D / nu with D the obstacle diameter in cells.
// Reference: Kruger et al., The Lattice Boltzmann Method (2017), Ch. 3-5;
// Succi, The Lattice Boltzmann Equation (2001).

export const W  = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36];
export const CX = [0, 1, 0, -1, 0, 1, -1, -1, 1];
export const CY = [0, 0, 1, 0, -1, 1, 1, -1, -1];
export const OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6];

// Equilibrium distribution f_k^eq for given (rho, ux, uy).
export function feq(k, rho, ux, uy) {
  const cu = 3 * (CX[k] * ux + CY[k] * uy);
  return W[k] * rho * (1 + cu + 0.5 * cu * cu - 1.5 * (ux * ux + uy * uy));
}

export function createLBM(NX, NY, opts = {}) {
  const s = {
    NX, NY,
    tau: opts.tau ?? 0.6,
    uIn: opts.uIn ?? 0.10,
    f: new Float64Array(NX * NY * 9),
    f2: new Float64Array(NX * NY * 9),
    obstacle: new Uint8Array(NX * NY),
    steps: 0,
  };
  reset(s);
  return s;
}

// Reset the populations to a uniform fluid at rest (rho = 1). Obstacles
// are left untouched so a drawn geometry survives a flow reset.
export function reset(s) {
  const { NX, NY, f } = s;
  for (let i = 0; i < NX * NY; i += 1) {
    for (let k = 0; k < 9; k += 1) f[i * 9 + k] = W[k];
  }
  s.steps = 0;
}

export function addCircle(s, cx, cy, r) {
  const { NX, NY, obstacle } = s;
  for (let y = 0; y < NY; y += 1) {
    for (let x = 0; x < NX; x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 < r * r) obstacle[y * NX + x] = 1;
    }
  }
}

// Macroscopic moments at a cell (density and velocity).
export function macro(s, idx) {
  const f = s.f;
  let rho = 0, ux = 0, uy = 0;
  for (let k = 0; k < 9; k += 1) {
    const v = f[idx * 9 + k];
    rho += v; ux += CX[k] * v; uy += CY[k] * v;
  }
  if (rho > 0) { ux /= rho; uy /= rho; }
  return { rho, ux, uy };
}

// Total mass over the fluid (non-obstacle) cells.
export function fluidMass(s) {
  const { NX, NY, obstacle, f } = s;
  let m = 0;
  for (let i = 0; i < NX * NY; i += 1) {
    if (obstacle[i]) continue;
    for (let k = 0; k < 9; k += 1) m += f[i * 9 + k];
  }
  return m;
}

// One lattice-Boltzmann step: inflow, outflow, BGK collision, then
// streaming with half-way bounce-back at walls and obstacles.
export function step(s) {
  const { NX, NY, tau, uIn, obstacle } = s;
  let f = s.f, f2 = s.f2;

  // Steady inflow on the left edge: equilibrium at (rho, u) = (1, uIn).
  for (let y = 0; y < NY; y += 1) {
    const idx = y * NX + 0;
    for (let k = 0; k < 9; k += 1) f[idx * 9 + k] = feq(k, 1.0, uIn, 0);
  }
  // Zero-gradient outflow on the right edge (copy the last interior column).
  for (let y = 0; y < NY; y += 1) {
    const dst = (y * NX + (NX - 1)) * 9;
    const src = (y * NX + (NX - 2)) * 9;
    for (let k = 0; k < 9; k += 1) f[dst + k] = f[src + k];
  }
  // BGK collision on fluid cells.
  for (let y = 0; y < NY; y += 1) {
    for (let x = 0; x < NX; x += 1) {
      const idx = y * NX + x;
      if (obstacle[idx]) continue;
      let rho = 0, ux = 0, uy = 0;
      for (let k = 0; k < 9; k += 1) {
        const v = f[idx * 9 + k];
        rho += v; ux += CX[k] * v; uy += CY[k] * v;
      }
      ux /= rho; uy /= rho;
      for (let k = 0; k < 9; k += 1) {
        f[idx * 9 + k] += -(f[idx * 9 + k] - feq(k, rho, ux, uy)) / tau;
      }
    }
  }
  // Streaming with bounce-back at walls and obstacles.
  for (let y = 0; y < NY; y += 1) {
    for (let x = 0; x < NX; x += 1) {
      const src = (y * NX + x) * 9;
      for (let k = 0; k < 9; k += 1) {
        const xn = x + CX[k], yn = y + CY[k];
        if (xn < 0 || xn >= NX || yn < 0 || yn >= NY) {
          f2[src + OPP[k]] = f[src + k];
        } else if (obstacle[yn * NX + xn]) {
          f2[src + OPP[k]] = f[src + k];
        } else {
          f2[(yn * NX + xn) * 9 + k] = f[src + k];
        }
      }
    }
  }
  s.f = f2; s.f2 = f;
  s.steps += 1;
}

// Advance n steps (deterministic; no RNG anywhere in the solver).
export function advance(s, n) {
  for (let i = 0; i < n; i += 1) step(s);
}

// Kinematic viscosity and obstacle Reynolds number.
export const viscosity = (tau) => (tau - 0.5) / 3;
export const reynolds = (uIn, D, tau) => (uIn * D) / viscosity(tau);
