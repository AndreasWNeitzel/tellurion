// shared/js/engine/chorin-2d-cpu.js
// Headless 2D incompressible Navier-Stokes, Chorin projection on a
// MAC staggered grid (pressure at cell centres, u on vertical faces,
// v on horizontal faces). The staggered layout makes the discrete
// divergence, gradient and Laplacian exactly consistent AND
// reflection-symmetric, so the projection genuinely removes the
// divergence (no collocated odd-even checkerboard) and a symmetric
// problem stays symmetric (the Stokes invariant). One step is:
// semi-Lagrangian advection (Stam; unconditionally stable, no
// advective CFL), implicit Jacobi diffusion (no diffusion CFL), then
// a variable-coefficient pressure-Poisson projection by red-black
// SOR iterated to convergence. Boundary conditions: Dirichlet inflow
// u=(1,0) at the left, zero-gradient outflow at the right, free-slip
// (no-penetration) top/bottom, no-slip on obstacle faces. No DOM, no
// RNG, deterministic. Reference: Chorin, Math. Comput. 22 (1968) 745
// (`chorin1968`); Harlow and Welch, Phys. Fluids 8 (1965) 2182, the
// MAC staggered scheme (`harlow-welch1965`); Stam, SIGGRAPH 99
// (1999) 121 (`stam1999`).

const Pi = (NX, i, j) => j * NX + i;                 // pressure / cell
const Ui = (NX, i, j) => j * (NX + 1) + i;           // u on x-faces
const Vi = (NX, i, j) => j * NX + i;                 // v on y-faces

export function createState(NX, NY, Re) {
  const s = {
    NX, NY, nu: 1 / Re,
    u: new Float64Array((NX + 1) * NY),
    v: new Float64Array(NX * (NY + 1)),
    p: new Float64Array(NX * NY),
    obstacle: new Uint8Array(NX * NY),
    _u: new Float64Array((NX + 1) * NY),
    _v: new Float64Array(NX * (NY + 1)),
    _d: new Float64Array(NX * NY),
  };
  s.u.fill(1);                                       // uniform inflow stream
  return s;
}

// Rectangular bluff body. With yShift = 0 it is exactly symmetric
// about the top-bottom mirror axis j <-> NY-1-j (the Stokes-symmetry
// invariant relies on this default). A small nonzero yShift breaks
// that symmetry on purpose, the perturbation a deterministic solver
// needs to grow the supercritical von Karman instability into an
// alternating vortex street (a real cylinder sheds because of
// ambient perturbations; here we seed one).
export function setBlockObstacle(s, fracX = 0.30, w = 4, h = 6, yShift = 0) {
  const { NX, NY } = s;
  const ci = Math.round(fracX * NX);
  const cj2 = (NY - 1) + 2 * yShift;                 // 2 * mirror centre
  for (let j = 1; j < NY - 1; j += 1) {
    if (Math.abs(2 * j - cj2) > 2 * h) continue;
    for (let i = ci - w; i <= ci + w; i += 1) {
      if (i > 0 && i < NX - 1) s.obstacle[Pi(NX, i, j)] = 1;
    }
  }
}

function applyBC(s) {
  const { NX, NY, u, v, obstacle } = s;
  for (let j = 0; j < NY; j += 1) {
    u[Ui(NX, 0, j)] = 1;                              // inflow
    u[Ui(NX, NX, j)] = u[Ui(NX, NX - 1, j)];          // outflow du/dx=0
  }
  for (let i = 0; i < NX; i += 1) {
    v[Vi(NX, i, 0)] = 0; v[Vi(NX, i, NY)] = 0;        // free-slip walls
  }
  for (let j = 0; j < NY; j += 1) {
    for (let i = 0; i < NX; i += 1) {
      if (!obstacle[Pi(NX, i, j)]) continue;          // no-slip faces
      u[Ui(NX, i, j)] = 0; u[Ui(NX, i + 1, j)] = 0;
      v[Vi(NX, i, j)] = 0; v[Vi(NX, i, j + 1)] = 0;
    }
  }
}

// Bilinear sample of a face field. u nodes sit at (x=i, y=j+0.5);
// v nodes at (x=i+0.5, y=j). Caller passes node-space coords.
function bilerp(f, W, H, x, y) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const tx = x - x0, ty = y - y0;
  const xa = Math.max(0, Math.min(W - 1, x0)), xb = Math.max(0, Math.min(W - 1, x0 + 1));
  const ya = Math.max(0, Math.min(H - 1, y0)), yb = Math.max(0, Math.min(H - 1, y0 + 1));
  const f00 = f[ya * W + xa], f10 = f[ya * W + xb];
  const f01 = f[yb * W + xa], f11 = f[yb * W + xb];
  return (1 - ty) * ((1 - tx) * f00 + tx * f10) + ty * ((1 - tx) * f01 + tx * f11);
}

function uAt(s, x, y) { return bilerp(s._u, s.NX + 1, s.NY, x, y - 0.5); }
function vAt(s, x, y) { return bilerp(s._v, s.NX, s.NY + 1, x - 0.5, y); }

function advect(s, dt) {
  const { NX, NY, u, v, _u, _v } = s;
  _u.set(u); _v.set(v);
  for (let j = 0; j < NY; j += 1) {                  // u-faces at (i, j+0.5)
    for (let i = 1; i < NX; i += 1) {
      const x = i, y = j + 0.5;
      const px = x - dt * uAt(s, x, y), py = y - dt * vAt(s, x, y);
      u[Ui(NX, i, j)] = uAt(s, Math.max(0.5, Math.min(NX - 0.5, px)),
        Math.max(0.5, Math.min(NY - 0.5, py)));
    }
  }
  for (let j = 1; j < NY; j += 1) {                  // v-faces at (i+0.5, j)
    for (let i = 0; i < NX; i += 1) {
      const x = i + 0.5, y = j;
      const px = x - dt * uAt(s, x, y), py = y - dt * vAt(s, x, y);
      v[Vi(NX, i, j)] = vAt(s, Math.max(0.5, Math.min(NX - 0.5, px)),
        Math.max(0.5, Math.min(NY - 0.5, py)));
    }
  }
  applyBC(s);
}

function diffuseField(f, W, H, iLo, iHi, jLo, jHi, a, sweeps, tmp) {
  tmp.set(f);
  for (let it = 0; it < sweeps; it += 1) {
    for (let j = jLo; j < jHi; j += 1) {
      for (let i = iLo; i < iHi; i += 1) {
        const k = j * W + i;
        f[k] = (tmp[k] + a * (f[k - 1] + f[k + 1] + f[k - W] + f[k + W])) / (1 + 4 * a);
      }
    }
  }
}

function diffuse(s, dt, sweeps = 20) {
  const a = s.nu * dt;
  if (a <= 0) return;
  diffuseField(s.u, s.NX + 1, s.NY, 1, s.NX, 1, s.NY - 1, a, sweeps, s._u);
  diffuseField(s.v, s.NX, s.NY + 1, 1, s.NX - 1, 1, s.NY, a, sweeps, s._v);
  applyBC(s);
}

// Variable-coefficient MAC pressure-Poisson by red-black SOR. A face
// to a fluid neighbour couples both cells (symmetric matrix);
// free-slip walls, the inflow and obstacle faces are Neumann (no
// coupling, that face velocity is prescribed); the outflow column
// couples to a Dirichlet p=0 ghost, making the system non-singular
// and the projection a true Hodge decomposition.
export function project(s, { tol = 1e-7, maxIter = 4000 } = {}) {
  const { NX, NY, u, v, p, obstacle, _d } = s;
  for (let j = 0; j < NY; j += 1) {
    for (let i = 0; i < NX; i += 1) {
      const c = Pi(NX, i, j);
      _d[c] = obstacle[c] ? 0
        : (u[Ui(NX, i + 1, j)] - u[Ui(NX, i, j)]) + (v[Vi(NX, i, j + 1)] - v[Vi(NX, i, j)]);
    }
  }
  p.fill(0);
  const NXr = Math.max(NX, NY);
  const omega = 2 / (1 + Math.sin(Math.PI / NXr));
  const fluid = (i, j) => i >= 0 && i < NX && j >= 0 && j < NY && !obstacle[Pi(NX, i, j)];
  const sweep = (residualOut) => {
    let res = 0;
    for (let phase = 0; phase < 2; phase += 1) {
      for (let j = 0; j < NY; j += 1) {
        for (let i = 0; i < NX; i += 1) {
          if (((i + j) & 1) !== phase) continue;
          const c = Pi(NX, i, j);
          if (obstacle[c]) continue;
          let sum = 0, coeff = 0;
          if (fluid(i - 1, j)) { sum += p[Pi(NX, i - 1, j)]; coeff += 1; }
          if (i === NX - 1) { coeff += 1; }            // outflow Dirichlet p=0
          else if (fluid(i + 1, j)) { sum += p[Pi(NX, i + 1, j)]; coeff += 1; }
          if (fluid(i, j - 1)) { sum += p[Pi(NX, i, j - 1)]; coeff += 1; }
          if (fluid(i, j + 1)) { sum += p[Pi(NX, i, j + 1)]; coeff += 1; }
          if (coeff === 0) continue;
          const target = (sum - _d[c]) / coeff;
          if (residualOut) {
            const r = coeff * p[c] - sum + _d[c];
            if (Math.abs(r) > res) res = Math.abs(r);
          }
          p[c] += omega * (target - p[c]);
        }
      }
    }
    return res;
  };
  for (let it = 0; it < maxIter; it += 1) {
    const res = sweep((it & 7) === 0);
    if ((it & 7) === 0 && res < tol) break;
  }
  // gradient correction on free interior faces only
  for (let j = 0; j < NY; j += 1) {
    for (let i = 1; i < NX; i += 1) {
      if (fluid(i - 1, j) && fluid(i, j)) {
        u[Ui(NX, i, j)] -= (p[Pi(NX, i, j)] - p[Pi(NX, i - 1, j)]);
      }
    }
  }
  for (let j = 1; j < NY; j += 1) {
    for (let i = 0; i < NX; i += 1) {
      if (fluid(i, j - 1) && fluid(i, j)) {
        v[Vi(NX, i, j)] -= (p[Pi(NX, i, j)] - p[Pi(NX, i, j - 1)]);
      }
    }
  }
  applyBC(s);
  return divergenceMax(s);
}

export function divergenceMax(s) {
  const { NX, NY, u, v, obstacle } = s;
  let m = 0;
  for (let j = 0; j < NY; j += 1) {
    for (let i = 0; i < NX; i += 1) {
      const c = Pi(NX, i, j);
      if (obstacle[c] || i === NX - 1) continue;       // skip the outflow column
      const d = Math.abs((u[Ui(NX, i + 1, j)] - u[Ui(NX, i, j)])
        + (v[Vi(NX, i, j + 1)] - v[Vi(NX, i, j)]));
      if (d > m) m = d;
    }
  }
  return m;
}

// Cell-centred velocity and vorticity (visualization / diagnostics).
export function cellVelocity(s) {
  const { NX, NY, u, v } = s;
  const uc = new Float64Array(NX * NY), vc = new Float64Array(NX * NY);
  for (let j = 0; j < NY; j += 1) {
    for (let i = 0; i < NX; i += 1) {
      uc[Pi(NX, i, j)] = 0.5 * (u[Ui(NX, i, j)] + u[Ui(NX, i + 1, j)]);
      vc[Pi(NX, i, j)] = 0.5 * (v[Vi(NX, i, j)] + v[Vi(NX, i, j + 1)]);
    }
  }
  return { uc, vc };
}

export function vorticity(s) {
  const { NX, NY } = s;
  const { uc, vc } = cellVelocity(s);
  const w = new Float64Array(NX * NY);
  for (let j = 1; j < NY - 1; j += 1) {
    for (let i = 1; i < NX - 1; i += 1) {
      const c = Pi(NX, i, j);
      w[c] = 0.5 * (vc[c + 1] - vc[c - 1]) - 0.5 * (uc[c + NX] - uc[c - NX]);
    }
  }
  return w;
}

export function step(s, dt, { diffuseSweeps = 20, projOpts } = {}) {
  advect(s, dt);
  diffuse(s, dt, diffuseSweeps);
  return project(s, projOpts);
}

// Semi-Lagrangian advection of a passive cell-centred scalar by the
// cell-centred velocity (tracer / scalar-conservation diagnostic).
export function advectScalar(s, field, dt) {
  const { NX, NY } = s;
  const { uc, vc } = cellVelocity(s);
  const src = field.slice();
  for (let j = 1; j < NY - 1; j += 1) {
    for (let i = 1; i < NX - 1; i += 1) {
      const c = Pi(NX, i, j);
      let x = i - dt * uc[c], y = j - dt * vc[c];
      x = Math.max(0.5, Math.min(NX - 1.5, x));
      y = Math.max(0.5, Math.min(NY - 1.5, y));
      field[c] = bilerp(src, NX, NY, x, y);
    }
  }
  return field;
}

// Dominant non-DC frequency of a uniformly sampled series, returned
// as a Strouhal number St = f D / U with D = U = 1. Weak diagnostic.
export function strouhal(series, dt) {
  const N = series.length;
  if (N < 16) return 0;
  let mean = 0;
  for (let i = 0; i < N; i += 1) mean += series[i];
  mean /= N;
  let bestF = 0, bestP = -1;
  const fmin = 1 / (N * dt), fmax = 0.5 / dt;
  for (let q = 1; q <= 256; q += 1) {
    const f = fmin + (fmax - fmin) * (q / 256);
    let re = 0, im = 0;
    for (let i = 0; i < N; i += 1) {
      const ph = 2 * Math.PI * f * i * dt, x = series[i] - mean;
      re += x * Math.cos(ph); im -= x * Math.sin(ph);
    }
    const pw = re * re + im * im;
    if (pw > bestP) { bestP = pw; bestF = f; }
  }
  return bestF;
}
