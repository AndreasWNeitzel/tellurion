// 2D Boussinesq Rayleigh-Benard engine on a MAC staggered grid
// (p, theta at cell centres; u on x-faces; v on y-faces). Reuses the
// chorin-2d-cpu MAC projection pattern (forward-divergence /
// backward-gradient / 5-point Laplacian Hodge pair) and adds the
// temperature-perturbation field, semi-Lagrangian (or BFECC)
// transport, implicit diffusion, and the Boussinesq buoyancy coupling.
//
// Perturbation formulation (essential for a clean discrete onset):
// theta = T_hat - (1 - y) is the departure from the linear conduction
// profile. The base state theta = 0, u = 0 is then an EXACT discrete
// equilibrium (zero buoyancy force, zero source), so the seeded
// infinitesimal mode is the only thing that evolves and the measured
// neutral Rayleigh number is the physical one, not a projection
// residual. Equations (length d, time d^2/kappa, velocity kappa/d,
// temperature DeltaT):
//   d_t u + (u.grad)u = -grad p + Pr Lap u + Ra Pr theta y_hat,  div u = 0
//   d_t theta + (u.grad)theta = Lap theta + w     (w = vertical velocity)
// Boundaries: laterally periodic in x; stress-free, perfectly
// conducting plates (theta = 0 on both plates). Free-free linear onset
// has the closed form Ra_c = 27 pi^4 / 4 ~= 657.511 at k_c = pi/sqrt2,
// the engine's headline invariant. Reference: Rayleigh, Phil. Mag. 32
// (1916) 529 (`rayleigh1916`); Chandrasekhar 1961 Ch. II
// (`chandrasekhar1961`); Drazin and Reid 2004 sec. 2 (`drazin-reid`);
// Chorin 1968 (`chorin1968`); Harlow and Welch 1965
// (`harlow-welch1965`); Stam 1999 (`stam1999`); Selle et al. 2008
// BFECC (`selle2008-bfecc`).

export const RA_C = 27 * Math.PI ** 4 / 4;          // 657.5113...
export const K_C = Math.PI / Math.SQRT2;            // 2.2214...
export const LAMBDA_C = 2 * Math.PI / K_C;          // 2*sqrt(2) ~= 2.8284

const Pi = (NX, i, j) => j * NX + i;                 // cell centre
const Ui = (NX, i, j) => j * (NX + 1) + i;           // x-face
const Vi = (NX, i, j) => j * NX + i;                 // y-face (NX wide, NY+1 tall)
const wrap = (i, NX) => (i % NX + NX) % NX;          // periodic x

export function createState(NX, NY, { Ra = 2 * RA_C, Pr = 1, width = LAMBDA_C } = {}) {
  return {
    NX, NY, Ra, Pr, width,
    u: new Float64Array((NX + 1) * NY),
    v: new Float64Array(NX * (NY + 1)),
    p: new Float64Array(NX * NY),
    th: new Float64Array(NX * NY),                   // theta (perturbation), 0 in conduction
    _u: new Float64Array((NX + 1) * NY),
    _v: new Float64Array(NX * (NY + 1)),
    _th: new Float64Array(NX * NY),
    _d: new Float64Array(NX * NY),
  };
}

// Seed the analytic free-free eigenfunction at k_c on a box of width
// exactly lambda_c (cos(k_c x) is then the n = 1 periodic Fourier
// mode, zero quantization error). Fixed phase, no RNG, deterministic.
export function seedMode(s, eps = 1e-6) {
  const { NX, NY, th, width } = s;
  s.u.fill(0); s.v.fill(0); s.p.fill(0);
  for (let j = 0; j < NY; j += 1) {
    const y = (j + 0.5) / NY;
    for (let i = 0; i < NX; i += 1) {
      const x = (i + 0.5) / NX * width;
      th[Pi(NX, i, j)] = eps * Math.sin(Math.PI * y) * Math.cos(K_C * x);
    }
  }
}

// theta = 0 at both conducting plates; no penetration at the stress-
// free walls. Periodic x is handled by index wrapping in the kernels.
function applyBC(s) {
  const { NX, NY, v, th } = s;
  for (let i = 0; i < NX; i += 1) {
    v[Vi(NX, i, 0)] = 0; v[Vi(NX, i, NY)] = 0;
    th[Pi(NX, i, 0)] = 0; th[Pi(NX, i, NY - 1)] = 0;
  }
}

function bilerpPX(f, W, H, x, y, NXper) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const tx = x - x0, ty = y - y0;
  const ya = Math.max(0, Math.min(H - 1, y0));
  const yb = Math.max(0, Math.min(H - 1, y0 + 1));
  const xa = wrap(x0, NXper), xb = wrap(x0 + 1, NXper);
  const f00 = f[ya * W + xa], f10 = f[ya * W + xb];
  const f01 = f[yb * W + xa], f11 = f[yb * W + xb];
  return (1 - ty) * ((1 - tx) * f00 + tx * f10) + ty * ((1 - tx) * f01 + tx * f11);
}
function uAt(s, x, y) { return bilerpPX(s._u, s.NX + 1, s.NY, x, y - 0.5, s.NX + 1); }
function vAt(s, x, y) { return bilerpPX(s._v, s.NX, s.NY + 1, x - 0.5, y, s.NX); }
function thAt(s, x, y) { return bilerpPX(s._th, s.NX, s.NY, x - 0.5, y - 0.5, s.NX); }

function advectSL(s, dt) {
  const { NX, NY, u, v, th, _u, _v, _th } = s;
  _u.set(u); _v.set(v); _th.set(th);
  for (let j = 0; j < NY; j += 1) for (let i = 0; i < NX + 1; i += 1) {
    const x = i, y = j + 0.5;
    const px = x - dt * uAt(s, x, y), py = y - dt * vAt(s, x, y);
    u[Ui(NX, i, j)] = uAt(s, px, Math.max(0.5, Math.min(NY - 0.5, py)));
  }
  for (let j = 1; j < NY; j += 1) for (let i = 0; i < NX; i += 1) {
    const x = i + 0.5, y = j;
    const px = x - dt * uAt(s, x, y), py = y - dt * vAt(s, x, y);
    v[Vi(NX, i, j)] = vAt(s, px, Math.max(0.5, Math.min(NY - 0.5, py)));
  }
  for (let j = 0; j < NY; j += 1) for (let i = 0; i < NX; i += 1) {
    const x = i + 0.5, y = j + 0.5;
    const px = x - dt * uAt(s, x, y), py = y - dt * vAt(s, x, y);
    th[Pi(NX, i, j)] = thAt(s, px, Math.max(0.5, Math.min(NY - 0.5, py)));
  }
  applyBC(s);
}

// BFECC low-dissipation transport (the onset-test path).
function advectBFECC(s, dt) {
  const u0 = s.u.slice(), v0 = s.v.slice(), t0 = s.th.slice();
  advectSL(s, dt);
  const u1 = s.u.slice(), v1 = s.v.slice(), t1 = s.th.slice();
  advectSL(s, -dt);
  for (let k = 0; k < u0.length; k += 1) s.u[k] = u0[k] + 0.5 * (u0[k] - s.u[k]);
  for (let k = 0; k < v0.length; k += 1) s.v[k] = v0[k] + 0.5 * (v0[k] - s.v[k]);
  for (let k = 0; k < t0.length; k += 1) s.th[k] = t0[k] + 0.5 * (t0[k] - s.th[k]);
  advectSL(s, dt);
  for (let k = 0; k < u0.length; k += 1) {
    const lo = Math.min(u0[k], u1[k]), hi = Math.max(u0[k], u1[k]);
    s.u[k] = Math.max(lo, Math.min(hi, s.u[k]));
  }
  for (let k = 0; k < v0.length; k += 1) {
    const lo = Math.min(v0[k], v1[k]), hi = Math.max(v0[k], v1[k]);
    s.v[k] = Math.max(lo, Math.min(hi, s.v[k]));
  }
  for (let k = 0; k < t0.length; k += 1) {
    const lo = Math.min(t0[k], t1[k]), hi = Math.max(t0[k], t1[k]);
    s.th[k] = Math.max(lo, Math.min(hi, s.th[k]));
  }
  applyBC(s);
}

function diffuse(s, dt, nu, field, W, H, sweeps) {
  const a = nu * dt;
  const src = field.slice();
  for (let it = 0; it < sweeps; it += 1) {
    for (let j = 0; j < H; j += 1) for (let i = 0; i < W; i += 1) {
      const c = j * W + i;
      const iL = j * W + wrap(i - 1, W), iR = j * W + wrap(i + 1, W);
      const jD = Math.max(0, j - 1) * W + i, jU = Math.min(H - 1, j + 1) * W + i;
      field[c] = (src[c] + a * (field[iL] + field[iR] + field[jD] + field[jU])) / (1 + 4 * a);
    }
  }
}

// Buoyancy Ra Pr theta on the vertical faces; zero in conduction.
function buoyancy(s, dt) {
  const { NX, NY, v, th } = s;
  const g = s.Ra * s.Pr;
  for (let j = 1; j < NY; j += 1) for (let i = 0; i < NX; i += 1) {
    const tf = 0.5 * (th[Pi(NX, i, j)] + th[Pi(NX, i, j - 1)]);
    v[Vi(NX, i, j)] += g * tf * dt;
  }
}

// The +w source: advection of the background conduction gradient.
// d_t theta gains + w (w = vertical velocity at the cell centre).
function thetaSource(s, dt) {
  const { NX, NY, v, th } = s;
  for (let j = 0; j < NY; j += 1) for (let i = 0; i < NX; i += 1) {
    const w = 0.5 * (v[Vi(NX, i, j)] + v[Vi(NX, i, j + 1)]);
    th[Pi(NX, i, j)] += w * dt;
  }
  applyBC(s);
}

export function project(s, { sweeps = 80 } = {}) {
  const { NX, NY, u, v, p, _d } = s;
  let mean = 0;
  for (let j = 0; j < NY; j += 1) for (let i = 0; i < NX; i += 1) {
    const d = (u[Ui(NX, i + 1, j)] - u[Ui(NX, i, j)]) + (v[Vi(NX, i, j + 1)] - v[Vi(NX, i, j)]);
    _d[Pi(NX, i, j)] = d; mean += d;
  }
  mean /= NX * NY;
  for (let k = 0; k < NX * NY; k += 1) _d[k] -= mean;       // periodic gauge compatibility
  p.fill(0);
  for (let it = 0; it < sweeps; it += 1) {
    for (let j = 0; j < NY; j += 1) for (let i = 0; i < NX; i += 1) {
      const c = Pi(NX, i, j);
      const pL = p[Pi(NX, wrap(i - 1, NX), j)], pR = p[Pi(NX, wrap(i + 1, NX), j)];
      const pD = j > 0 ? p[Pi(NX, i, j - 1)] : p[c];         // Neumann at plates
      const pU = j < NY - 1 ? p[Pi(NX, i, j + 1)] : p[c];
      p[c] = 0.25 * (pL + pR + pD + pU - _d[c]);
    }
    p[0] = 0;                                                // pin the gauge
  }
  for (let j = 0; j < NY; j += 1) for (let i = 0; i < NX; i += 1) {
    const c = Pi(NX, i, j);
    u[Ui(NX, i, j)] -= p[c] - p[Pi(NX, wrap(i - 1, NX), j)];
    if (j > 0) v[Vi(NX, i, j)] -= p[c] - p[Pi(NX, i, j - 1)];
  }
  for (let j = 0; j < NY; j += 1) u[Ui(NX, NX, j)] = u[Ui(NX, 0, j)];
  for (let i = 0; i < NX; i += 1) { v[Vi(NX, i, 0)] = 0; v[Vi(NX, i, NY)] = 0; }
  return divergenceMax(s);
}

export function divergenceMax(s) {
  const { NX, NY, u, v } = s;
  let m = 0;
  for (let j = 0; j < NY; j += 1) for (let i = 0; i < NX; i += 1) {
    const d = (u[Ui(NX, i + 1, j)] - u[Ui(NX, i, j)]) + (v[Vi(NX, i, j + 1)] - v[Vi(NX, i, j)]);
    if (Math.abs(d) > m) m = Math.abs(d);
  }
  return m;
}

export function step(s, dt, { bfecc = false, projSweeps = 80, diffuseSweeps = 24 } = {}) {
  const dtc = Math.min(dt, 0.2 / Math.sqrt(s.Ra * s.Pr));    // buoyancy CFL clamp
  buoyancy(s, dtc);
  if (bfecc) advectBFECC(s, dtc); else advectSL(s, dtc);
  thetaSource(s, dtc);                                       // + w
  diffuse(s, dtc, s.Pr, s.u, s.NX + 1, s.NY, diffuseSweeps);
  diffuse(s, dtc, s.Pr, s.v, s.NX, s.NY + 1, diffuseSweeps);
  diffuse(s, dtc, 1.0, s.th, s.NX, s.NY, diffuseSweeps);
  applyBC(s);
  return project(s, { sweeps: projSweeps });
}

export function perturbAmplitude(s) {
  const { NX, NY, v } = s;
  let sum = 0, n = 0;
  for (let j = 1; j < NY; j += 1) for (let i = 0; i < NX; i += 1) {
    const x = v[Vi(NX, i, j)]; sum += x * x; n += 1;
  }
  return Math.sqrt(sum / n);
}

// Linear growth rate sigma from a least-squares fit of log(amplitude)
// vs time, after a transient. sigma < 0 below Ra_c, > 0 above.
export function growthRate(s, { warm = 80, samples = 80, dt = 3e-3, bfecc = true } = {}) {
  for (let n = 0; n < warm; n += 1) step(s, dt, { bfecc });
  const ts = [], ls = [];
  for (let k = 0; k < samples; k += 1) {
    step(s, dt, { bfecc });
    const a = perturbAmplitude(s);
    if (a > 0 && Number.isFinite(a)) { ts.push(k * dt); ls.push(Math.log(a)); }
  }
  const n = ts.length;
  if (n < 5) return NaN;
  let mt = 0, ml = 0;
  for (let k = 0; k < n; k += 1) { mt += ts[k]; ml += ls[k]; }
  mt /= n; ml /= n;
  let num = 0, den = 0;
  for (let k = 0; k < n; k += 1) { num += (ts[k] - mt) * (ls[k] - ml); den += (ts[k] - mt) ** 2; }
  return num / den;
}

// Nu = 1 + <w theta> with the conduction flux normalized to 1 in
// these units. Nu = 1 in pure conduction (theta = 0).
export function nusselt(s) {
  const { NX, NY, v, th } = s;
  let acc = 0;
  for (let j = 0; j < NY; j += 1) for (let i = 0; i < NX; i += 1) {
    const w = 0.5 * (v[Vi(NX, i, j)] + v[Vi(NX, i, j + 1)]);
    acc += w * th[Pi(NX, i, j)];
  }
  return 1 + (acc / (NX * NY)) * NY;
}

// Full nondimensional temperature for rendering: T_hat = (1 - y) + theta.
// Linear stability of the free-free single-mode (w, theta) system,
// the rigorous onset gate (exact, fast, GPU-free; the nonlinear
// growth-rate measurement is transient-polluted and not used as the
// gate). For horizontal wavenumber `a` and the gravest vertical mode
// the reduced Boussinesq equations give the quadratic
//   sigma^2 + M(Pr+1) sigma + Pr (M^2 - a^2 Ra / M) = 0,
// with M = a^2 - lambda1 and lambda1 the discrete vertical-Laplacian
// eigenvalue of the gravest conducting mode at resolution NY. The
// marginal (sigma = 0) curve is Ra(a) = M^3 / a^2; with the continuum
// lambda1 = -pi^2 this is exactly Ra_c = 27 pi^4 / 4 at a = k_c.
function lambda1(NY) {
  // Discrete second-difference eigenvalue for sin(pi y), dy = 1/NY.
  return -2 * (1 - Math.cos(Math.PI / NY)) * NY * NY;
}
export function discreteRaC(NY, a = K_C) {
  const M = a * a - lambda1(NY);
  return (M * M * M) / (a * a);
}
export function linearSigma(NY, Ra, Pr = 1, a = K_C) {
  const M = a * a - lambda1(NY);
  const b = M * (Pr + 1);
  const c = Pr * (M * M - (a * a * Ra) / M);
  const disc = b * b - 4 * c;
  if (disc < 0) return -b / 2;                       // complex pair: Re = -b/2 < 0
  return (-b + Math.sqrt(disc)) / 2;                 // dominant (largest) root
}

export function temperatureField(s) {
  const { NX, NY, th } = s;
  const T = new Float64Array(NX * NY);
  for (let j = 0; j < NY; j += 1) {
    const cond = 1 - (j + 0.5) / NY;
    for (let i = 0; i < NX; i += 1) T[Pi(NX, i, j)] = cond + th[Pi(NX, i, j)];
  }
  return T;
}
