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

// A circular bluff body (a real 2D cylinder cross-section, so the
// "cylinder" label is honest). Centre at (fracX*NX, mid + yShift),
// radius r cells; yShift seeds the wake asymmetry as above.
export function setDiskObstacle(s, fracX = 0.28, r = 6, yShift = 0) {
  const { NX, NY } = s;
  const ci = Math.round(fracX * NX), cj = (NY - 1) / 2 + yShift;
  for (let j = 1; j < NY - 1; j += 1) {
    for (let i = 1; i < NX - 1; i += 1) {
      if ((i - ci) ** 2 + (j - cj) ** 2 <= r * r) s.obstacle[Pi(NX, i, j)] = 1;
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

// Plain first-order semi-Lagrangian self-advection (the default;
// the gate-tested path the invariants run on; unchanged behaviour).
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

// Semi-Lagrangian transport of (fU,fV) along the frozen velocity
// (velU=s._u, velV=s._v) by step h, into (oU,oV). Used by BFECC.
function slTransport(s, h, fU, fV, oU, oV) {
  const { NX, NY } = s;
  const fuAt = (x, y) => bilerp(fU, NX + 1, NY, x, y - 0.5);
  const fvAt = (x, y) => bilerp(fV, NX, NY + 1, x - 0.5, y);
  for (let j = 0; j < NY; j += 1) {
    for (let i = 1; i < NX; i += 1) {
      const px = i - h * uAt(s, i, j + 0.5), py = (j + 0.5) - h * vAt(s, i, j + 0.5);
      oU[Ui(NX, i, j)] = fuAt(Math.max(0.5, Math.min(NX - 0.5, px)), Math.max(0.5, Math.min(NY - 0.5, py)));
    }
  }
  for (let j = 1; j < NY; j += 1) {
    for (let i = 0; i < NX; i += 1) {
      const px = (i + 0.5) - h * uAt(s, i + 0.5, j), py = j - h * vAt(s, i + 0.5, j);
      oV[Vi(NX, i, j)] = fvAt(Math.max(0.5, Math.min(NX - 0.5, px)), Math.max(0.5, Math.min(NY - 0.5, py)));
    }
  }
}

// BFECC self-advection: forward, backward, error-correct, forward
// again, clamped to the first-pass range so no new extrema appear
// (boundedness preserved). Roughly halves the semi-Lagrangian
// numerical viscosity, so the effective Reynolds tracks the nominal
// one and vortices actually shed at a coarse interactive grid.
function advectBFECC(s, dt) {
  const { NX, NY, u, v, _u, _v } = s;
  _u.set(u); _v.set(v);                              // frozen advecting velocity
  const nU = (NX + 1) * NY, nV = NX * (NY + 1);
  s._p1u ||= new Float64Array(nU); s._p1v ||= new Float64Array(nV);
  s._p2u ||= new Float64Array(nU); s._p2v ||= new Float64Array(nV);
  s._bbu ||= new Float64Array(nU); s._bbv ||= new Float64Array(nV);
  const o1u = s._p1u, o1v = s._p1v, o2u = s._p2u, o2v = s._p2v, bu = s._bbu, bv = s._bbv;
  slTransport(s, dt, _u, _v, o1u, o1v);              // phi1 = A(phi0)
  slTransport(s, -dt, o1u, o1v, o2u, o2v);           // phi2 = A^{-1}(phi1)
  for (let k = 0; k < nU; k += 1) bu[k] = _u[k] + 0.5 * (_u[k] - o2u[k]);
  for (let k = 0; k < nV; k += 1) bv[k] = _v[k] + 0.5 * (_v[k] - o2v[k]);
  slTransport(s, dt, bu, bv, u, v);                  // phi_new = A(phi_bar)
  // clamp to the first-pass (monotone) result so no new extrema grow
  for (let k = 0; k < nU; k += 1) {
    const lo = Math.min(_u[k], o1u[k]), hi = Math.max(_u[k], o1u[k]);
    u[k] = Math.max(lo, Math.min(hi, u[k]));
  }
  for (let k = 0; k < nV; k += 1) {
    const lo = Math.min(_v[k], o1v[k]), hi = Math.max(_v[k], o1v[k]);
    v[k] = Math.max(lo, Math.min(hi, v[k]));
  }
  applyBC(s);
}

// Steinhoff vorticity confinement: a body force that pushes velocity
// back toward vorticity maxima, re-sharpening the eddies coarse-grid
// numerical diffusion smears out. eps = 0 disables it (the default,
// so the invariants are unaffected).
function confine(s, eps, dt) {
  if (!(eps > 0)) return;
  const { NX, NY, u, v, obstacle } = s;
  const { uc, vc } = cellVelocity(s);
  const w = new Float64Array(NX * NY);
  for (let j = 1; j < NY - 1; j += 1) {
    for (let i = 1; i < NX - 1; i += 1) {
      const c = Pi(NX, i, j);
      w[c] = 0.5 * (vc[c + 1] - vc[c - 1]) - 0.5 * (uc[c + NX] - uc[c - NX]);
    }
  }
  for (let j = 2; j < NY - 2; j += 1) {
    for (let i = 2; i < NX - 2; i += 1) {
      const c = Pi(NX, i, j);
      if (obstacle[c]) continue;
      const gx = 0.5 * (Math.abs(w[c + 1]) - Math.abs(w[c - 1]));
      const gy = 0.5 * (Math.abs(w[c + NX]) - Math.abs(w[c - NX]));
      const m = Math.hypot(gx, gy) + 1e-12;
      const Nx = gx / m, Ny = gy / m;
      const fx = eps * (Ny * w[c]);                  // (N x omega zhat)
      const fy = eps * (-Nx * w[c]);
      u[Ui(NX, i, j)] += dt * fx; u[Ui(NX, i + 1, j)] += dt * fx;
      v[Vi(NX, i, j)] += dt * fy; v[Vi(NX, i, j + 1)] += dt * fy;
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

// Defaults (bfecc=false, confine=0) reproduce the original
// first-order scheme exactly, so the gate-tested invariants are
// unchanged. The live playground opts into bfecc+confine for a
// low-dissipation, vortex-shedding, Re-sensitive flow.
export function step(s, dt, { diffuseSweeps = 20, projOpts, bfecc = false, confine: eps = 0 } = {}) {
  if (bfecc) advectBFECC(s, dt); else advect(s, dt);
  diffuse(s, dt, diffuseSweeps);
  if (eps > 0) confine(s, eps, dt);
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
