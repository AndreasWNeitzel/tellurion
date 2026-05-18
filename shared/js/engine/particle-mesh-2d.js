// particle-mesh-2d.js
// Reusable 2D particle-mesh (PM) self-gravity engine.
//
// Cloud-in-cell (CIC) mass deposit, a periodic Poisson solve by separable
// DFT, CIC force interpolation, and a kick-drift-kick leapfrog step. Because
// the field is solved from the actual particle distribution and fed back to
// the particles, self-gravity is fully self-consistent: collapse, dynamical
// friction, mergers and phase mixing all emerge with no special-case forces.
//
// Reference: Hockney and Eastwood 1988, Computer Simulation Using Particles,
// Chapters 5 to 7.
//
// State is a plain object { x, v, m, N } with x, v as Float64Array(2*N)
// laid out [x0,y0,x1,y1,...] and m as Float64Array(N). Grid parameters are
// passed explicitly so several playgrounds can reuse one engine.

function periodicIndex(i, n) {
  if (i < 0) return i + n;
  if (i >= n) return i - n;
  return i;
}

function dft1DRow(re, im, NX, NY, sign) {
  const Re = new Float64Array(NX * NY), Im = new Float64Array(NX * NY);
  for (let y = 0; y < NY; y += 1) {
    for (let kx = 0; kx < NX; kx += 1) {
      let r = 0, i = 0;
      for (let x = 0; x < NX; x += 1) {
        const phase = sign * 2 * Math.PI * kx * x / NX;
        const c = Math.cos(phase), s = Math.sin(phase);
        r += re[y * NX + x] * c - im[y * NX + x] * s;
        i += re[y * NX + x] * s + im[y * NX + x] * c;
      }
      Re[y * NX + kx] = r; Im[y * NX + kx] = i;
    }
  }
  return { Re, Im };
}

function dft1DCol(re, im, NX, NY, sign) {
  const Re = new Float64Array(NX * NY), Im = new Float64Array(NX * NY);
  for (let x = 0; x < NX; x += 1) {
    for (let ky = 0; ky < NY; ky += 1) {
      let r = 0, i = 0;
      for (let y = 0; y < NY; y += 1) {
        const phase = sign * 2 * Math.PI * ky * y / NY;
        const c = Math.cos(phase), s = Math.sin(phase);
        r += re[y * NX + x] * c - im[y * NX + x] * s;
        i += re[y * NX + x] * s + im[y * NX + x] * c;
      }
      Re[ky * NX + x] = r; Im[ky * NX + x] = i;
    }
  }
  return { Re, Im };
}

function isPow2(n) { return n > 0 && (n & (n - 1)) === 0; }

// In-place iterative radix-2 Cooley-Tukey FFT on one length-n row segment
// starting at offset off (stride 1). sign = -1 forward, +1 inverse.
function fft1dInPlace(re, im, off, n, sign) {
  for (let i = 1, j = 0; i < n; i += 1) {       // bit-reversal permutation
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const a = off + i, b = off + j;
      let t = re[a]; re[a] = re[b]; re[b] = t;
      t = im[a]; im[a] = im[b]; im[b] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = sign * 2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k += 1) {
        const a = off + i + k, b = off + i + k + len / 2;
        const xr = re[b] * cr - im[b] * ci;
        const xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi;
        re[a] += xr; im[a] += xi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}

// 2D transform of a square N x N complex array. Uses the fast radix-2 FFT
// when N is a power of two (the case for every PM grid here) and falls back
// to the exact separable DFT otherwise so non-pow2 callers stay correct.
function dft2D(re, im, NX, NY, sign) {
  if (NX === NY && isPow2(NX)) {
    const N = NX;
    const R = Float64Array.from(re), I = Float64Array.from(im);
    for (let y = 0; y < N; y += 1) fft1dInPlace(R, I, y * N, N, sign);   // rows
    // transpose, FFT rows (= original columns), transpose back
    const R2 = new Float64Array(N * N), I2 = new Float64Array(N * N);
    for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
      R2[x * N + y] = R[y * N + x]; I2[x * N + y] = I[y * N + x];
    }
    for (let y = 0; y < N; y += 1) fft1dInPlace(R2, I2, y * N, N, sign);
    for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
      R[y * N + x] = R2[x * N + y]; I[y * N + x] = I2[x * N + y];
    }
    return { Re: R, Im: I };
  }
  const r1 = dft1DRow(re, im, NX, NY, sign);
  return dft1DCol(r1.Re, r1.Im, NX, NY, sign);
}

// Solve grad^2 phi = 4 pi G rho on a periodic NGRID x NGRID box of side L.
export function solvePoisson2D(rho, NGRID, L, G) {
  const N = rho.length;
  const im0 = new Float64Array(N);
  const { Re: rhoR, Im: rhoI } = dft2D(rho, im0, NGRID, NGRID, -1);
  const phiR = new Float64Array(N), phiI = new Float64Array(N);
  for (let ky = 0; ky < NGRID; ky += 1) {
    for (let kx = 0; kx < NGRID; kx += 1) {
      const k = ky * NGRID + kx;
      if (kx === 0 && ky === 0) { phiR[k] = 0; phiI[k] = 0; continue; }
      const kkx = (kx <= NGRID / 2) ? kx : kx - NGRID;
      const kky = (ky <= NGRID / 2) ? ky : ky - NGRID;
      const fx = 2 * Math.PI * kkx / L;
      const fy = 2 * Math.PI * kky / L;
      const denom = fx * fx + fy * fy;
      phiR[k] = -4 * Math.PI * G * rhoR[k] / denom;
      phiI[k] = -4 * Math.PI * G * rhoI[k] / denom;
    }
  }
  const { Re: phi } = dft2D(phiR, phiI, NGRID, NGRID, +1);
  for (let i = 0; i < phi.length; i += 1) phi[i] /= NGRID * NGRID;
  return phi;
}

// Isolated (vacuum) boundary conditions by the zero-padded Green's-function
// convolution (Hockney trick; Hockney and Eastwood 1988, Ch. 6). The density
// is embedded in a 2M x 2M grid and cyclically convolved with the softened
// free-space 2D Green's function G(r) = (1/2pi) ln sqrt(r^2 + eps^2); the
// M x M sub-block is the true free-space potential, so there are NO periodic
// images and particles never wrap. The Green's-function transform is cached
// because it never changes.
const _greenCache = new Map();
function greenFFT(M, L, eps) {
  const key = `${M}|${L}|${eps}`;
  const hit = _greenCache.get(key);
  if (hit) return hit;
  const NX = 2 * M, DX = L / M;
  const g = new Float64Array(NX * NX);
  for (let j = 0; j < NX; j += 1) {
    const jj = j < M ? j : j - NX;       // minimum-image on the doubled grid
    for (let i = 0; i < NX; i += 1) {
      const ii = i < M ? i : i - NX;
      const r2 = (ii * DX) * (ii * DX) + (jj * DX) * (jj * DX);
      g[j * NX + i] = (1 / (2 * Math.PI)) * 0.5 * Math.log(r2 + eps * eps);
    }
  }
  const { Re, Im } = dft2D(g, new Float64Array(NX * NX), NX, NX, -1);
  const out = { Re, Im, NX };
  _greenCache.set(key, out);
  return out;
}

// Solve grad^2 phi = 4 pi G rho with isolated (free-space) boundaries.
export function solvePoissonIsolated2D(rho, M, L, G, eps = 0.05 * L / M) {
  const NX = 2 * M, DX = L / M;
  // Zero-pad the density into the 2M x 2M grid (no DC subtraction: an
  // isolated system has a real total mass and a real monopole potential).
  const rp = new Float64Array(NX * NX);
  for (let j = 0; j < M; j += 1) {
    for (let i = 0; i < M; i += 1) rp[j * NX + i] = rho[j * M + i];
  }
  const { Re: rR, Im: rI } = dft2D(rp, new Float64Array(NX * NX), NX, NX, -1);
  const gf = greenFFT(M, L, eps);
  // Convolution theorem: FT(phi) = 4 pi G * DX^2 * FT(rho) * FT(green).
  const pref = 4 * Math.PI * G * DX * DX;
  const cR = new Float64Array(NX * NX), cI = new Float64Array(NX * NX);
  for (let k = 0; k < NX * NX; k += 1) {
    cR[k] = pref * (rR[k] * gf.Re[k] - rI[k] * gf.Im[k]);
    cI[k] = pref * (rR[k] * gf.Im[k] + rI[k] * gf.Re[k]);
  }
  const { Re: conv } = dft2D(cR, cI, NX, NX, +1);
  const phi = new Float64Array(M * M);
  const norm = NX * NX;
  for (let j = 0; j < M; j += 1) {
    for (let i = 0; i < M; i += 1) phi[j * M + i] = conv[j * NX + i] / norm;
  }
  return phi;
}

export function depositCIC(x, m, N, NGRID, L) {
  const DX = L / NGRID;
  const rho = new Float64Array(NGRID * NGRID);
  for (let p = 0; p < N; p += 1) {
    let px = x[2 * p], py = x[2 * p + 1];
    px -= Math.floor(px / L) * L;
    py -= Math.floor(py / L) * L;
    const fx = px / DX, fy = py / DX;
    const i0 = Math.floor(fx), j0 = Math.floor(fy);
    const sx = fx - i0, sy = fy - j0;
    const i1 = periodicIndex(i0 + 1, NGRID), j1 = periodicIndex(j0 + 1, NGRID);
    const ii0 = periodicIndex(i0, NGRID), jj0 = periodicIndex(j0, NGRID);
    rho[jj0 * NGRID + ii0] += m[p] * (1 - sx) * (1 - sy);
    rho[jj0 * NGRID + i1]  += m[p] * sx * (1 - sy);
    rho[j1 * NGRID + ii0]  += m[p] * (1 - sx) * sy;
    rho[j1 * NGRID + i1]   += m[p] * sx * sy;
  }
  let avg = 0;
  for (let i = 0; i < rho.length; i += 1) avg += rho[i];
  avg /= rho.length;
  for (let i = 0; i < rho.length; i += 1) rho[i] -= avg;   // phi[k=0] = 0
  return rho;
}

export function gradPhi(phi, NGRID, L) {
  const DX = L / NGRID;
  const gx = new Float64Array(NGRID * NGRID);
  const gy = new Float64Array(NGRID * NGRID);
  for (let j = 0; j < NGRID; j += 1) for (let i = 0; i < NGRID; i += 1) {
    const ip1 = periodicIndex(i + 1, NGRID), im1 = periodicIndex(i - 1, NGRID);
    const jp1 = periodicIndex(j + 1, NGRID), jm1 = periodicIndex(j - 1, NGRID);
    gx[j * NGRID + i] = (phi[j * NGRID + ip1] - phi[j * NGRID + im1]) / (2 * DX);
    gy[j * NGRID + i] = (phi[jp1 * NGRID + i] - phi[jm1 * NGRID + i]) / (2 * DX);
  }
  return { gx, gy };
}

export function interpolateCIC(x, field, N, NGRID, L) {
  const DX = L / NGRID;
  const out = new Float64Array(N);
  for (let p = 0; p < N; p += 1) {
    let px = x[2 * p], py = x[2 * p + 1];
    px -= Math.floor(px / L) * L;
    py -= Math.floor(py / L) * L;
    const fx = px / DX, fy = py / DX;
    const i0 = Math.floor(fx), j0 = Math.floor(fy);
    const sx = fx - i0, sy = fy - j0;
    const i1 = periodicIndex(i0 + 1, NGRID), j1 = periodicIndex(j0 + 1, NGRID);
    const ii0 = periodicIndex(i0, NGRID), jj0 = periodicIndex(j0, NGRID);
    out[p] = field[jj0 * NGRID + ii0] * (1 - sx) * (1 - sy)
           + field[jj0 * NGRID + i1]  * sx * (1 - sy)
           + field[j1 * NGRID + ii0]  * (1 - sx) * sy
           + field[j1 * NGRID + i1]   * sx * sy;
  }
  return out;
}

// Open-boundary (non-wrapping) CIC: the M x M grid spans [0, L) in each
// axis; particles outside it simply do not deposit or feel force (they have
// left the system honestly, no periodic image). No DC subtraction, because
// an isolated system has a real total mass.
export function depositCICOpen(x, m, N, M, L) {
  const DX = L / M;
  const rho = new Float64Array(M * M);
  for (let p = 0; p < N; p += 1) {
    const fx = x[2 * p] / DX, fy = x[2 * p + 1] / DX;
    const i0 = Math.floor(fx), j0 = Math.floor(fy);
    if (i0 < 0 || i0 >= M - 1 || j0 < 0 || j0 >= M - 1) continue;
    const sx = fx - i0, sy = fy - j0;
    rho[j0 * M + i0]           += m[p] * (1 - sx) * (1 - sy);
    rho[j0 * M + (i0 + 1)]     += m[p] * sx * (1 - sy);
    rho[(j0 + 1) * M + i0]     += m[p] * (1 - sx) * sy;
    rho[(j0 + 1) * M + (i0 + 1)] += m[p] * sx * sy;
  }
  return rho;
}

export function gradPhiOpen(phi, M, L) {
  const DX = L / M;
  const gx = new Float64Array(M * M), gy = new Float64Array(M * M);
  for (let j = 0; j < M; j += 1) for (let i = 0; i < M; i += 1) {
    const ip = Math.min(i + 1, M - 1), im = Math.max(i - 1, 0);
    const jp = Math.min(j + 1, M - 1), jm = Math.max(j - 1, 0);
    gx[j * M + i] = (phi[j * M + ip] - phi[j * M + im]) / ((ip - im) * DX);
    gy[j * M + i] = (phi[jp * M + i] - phi[jm * M + i]) / ((jp - jm) * DX);
  }
  return { gx, gy };
}

export function interpolateCICOpen(x, field, N, M, L) {
  const DX = L / M;
  const out = new Float64Array(N);
  for (let p = 0; p < N; p += 1) {
    const fx = x[2 * p] / DX, fy = x[2 * p + 1] / DX;
    const i0 = Math.floor(fx), j0 = Math.floor(fy);
    if (i0 < 0 || i0 >= M - 1 || j0 < 0 || j0 >= M - 1) { out[p] = 0; continue; }
    const sx = fx - i0, sy = fy - j0;
    out[p] = field[j0 * M + i0] * (1 - sx) * (1 - sy)
           + field[j0 * M + (i0 + 1)] * sx * (1 - sy)
           + field[(j0 + 1) * M + i0] * (1 - sx) * sy
           + field[(j0 + 1) * M + (i0 + 1)] * sx * sy;
  }
  return out;
}

// One kick-drift-kick leapfrog PM step. Returns the grid potential so
// callers can compute per-particle energies for diagnostics. With
// `isolated: true` it uses free-space boundaries and never wraps positions.
export function stepPM(state, dt, opts) {
  const { NGRID, L, G, isolated = false, eps } = opts;
  if (isolated) {
    const acc = () => {
      const rho = depositCICOpen(state.x, state.m, state.N, NGRID, L);
      const phi = solvePoissonIsolated2D(rho, NGRID, L, G, eps);
      const { gx, gy } = gradPhiOpen(phi, NGRID, L);
      return {
        ax: interpolateCICOpen(state.x, gx, state.N, NGRID, L),
        ay: interpolateCICOpen(state.x, gy, state.N, NGRID, L),
        phi,
      };
    };
    const a0 = acc();
    for (let p = 0; p < state.N; p += 1) {
      state.v[2 * p]     -= 0.5 * dt * a0.ax[p];
      state.v[2 * p + 1] -= 0.5 * dt * a0.ay[p];
      state.x[2 * p]     += dt * state.v[2 * p];
      state.x[2 * p + 1] += dt * state.v[2 * p + 1];   // no wrap (honest)
    }
    const a1 = acc();
    for (let p = 0; p < state.N; p += 1) {
      state.v[2 * p]     -= 0.5 * dt * a1.ax[p];
      state.v[2 * p + 1] -= 0.5 * dt * a1.ay[p];
    }
    state.t = (state.t ?? 0) + dt;
    state.nSteps = (state.nSteps ?? 0) + 1;
    return a1.phi;
  }
  return stepPMPeriodic(state, dt, { NGRID, L, G });
}

function stepPMPeriodic(state, dt, { NGRID, L, G }) {
  const acc = () => {
    const rho = depositCIC(state.x, state.m, state.N, NGRID, L);
    const phi = solvePoisson2D(rho, NGRID, L, G);
    const { gx, gy } = gradPhi(phi, NGRID, L);
    return {
      ax: interpolateCIC(state.x, gx, state.N, NGRID, L),
      ay: interpolateCIC(state.x, gy, state.N, NGRID, L),
      phi,
    };
  };
  const a0 = acc();
  for (let p = 0; p < state.N; p += 1) {
    state.v[2 * p]     -= 0.5 * dt * a0.ax[p];
    state.v[2 * p + 1] -= 0.5 * dt * a0.ay[p];
    let nx = state.x[2 * p]     + dt * state.v[2 * p];
    let ny = state.x[2 * p + 1] + dt * state.v[2 * p + 1];
    nx -= Math.floor(nx / L) * L;
    ny -= Math.floor(ny / L) * L;
    state.x[2 * p] = nx; state.x[2 * p + 1] = ny;
  }
  const a1 = acc();
  for (let p = 0; p < state.N; p += 1) {
    state.v[2 * p]     -= 0.5 * dt * a1.ax[p];
    state.v[2 * p + 1] -= 0.5 * dt * a1.ay[p];
  }
  state.t = (state.t ?? 0) + dt;
  state.nSteps = (state.nSteps ?? 0) + 1;
  return a1.phi;
}

// Potential at every particle (CIC-interpolated), for energy diagnostics.
export function potentialAtParticles(state, phi, { NGRID, L }) {
  return interpolateCIC(state.x, phi, state.N, NGRID, L);
}
