// particle-mesh-3d.js
// Reusable 3D particle-mesh (PM) self-gravity engine with ISOLATED
// (free-space) boundaries.
//
// Cloud-in-cell mass deposit on an M^3 grid, a zero-padded Green's-function
// Poisson solve (Hockney trick) on a (2M)^3 grid via a radix-2 FFT, CIC
// force interpolation, kick-drift-kick leapfrog. Self-gravity is fully
// self-consistent: collapse, dynamical friction and mergers all emerge with
// no special-case forces and no periodic images.
//
// State is { x, v, m, N }: x, v are Float64Array(3*N) laid out
// [x0,y0,z0,x1,...], m is Float64Array(N). The free-space Green's function
// of grad^2 phi = 4 pi G rho in 3D is -1/(4 pi r), softened to
// -1/(4 pi sqrt(r^2+eps^2)).
//
// Reference: Hockney and Eastwood 1988, Computer Simulation Using
// Particles, Chapters 5 to 8.

function isPow2(n) { return n > 0 && (n & (n - 1)) === 0; }

// In-place iterative radix-2 FFT on a length-n strided segment.
function fftStride(re, im, off, stride, n, sign) {
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const a = off + i * stride, b = off + j * stride;
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
        const a = off + (i + k) * stride, b = off + (i + k + len / 2) * stride;
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

// 3D FFT of an N x N x N complex array (index = (z*N + y)*N + x), in place.
function fft3D(re, im, N, sign) {
  if (!isPow2(N)) throw new Error('fft3D needs a power-of-two size');
  const N2 = N * N;
  for (let z = 0; z < N; z += 1) for (let y = 0; y < N; y += 1) {
    fftStride(re, im, (z * N + y) * N, 1, N, sign);            // along x
  }
  for (let z = 0; z < N; z += 1) for (let x = 0; x < N; x += 1) {
    fftStride(re, im, z * N2 + x, N, N, sign);                 // along y
  }
  for (let y = 0; y < N; y += 1) for (let x = 0; x < N; x += 1) {
    fftStride(re, im, y * N + x, N2, N, sign);                 // along z
  }
}

const _green3Cache = new Map();
function greenFFT3(M, L, eps) {
  const key = `${M}|${L}|${eps}`;
  const hit = _green3Cache.get(key);
  if (hit) return hit;
  const NX = 2 * M, DX = L / M, NX2 = NX * NX;
  const gr = new Float64Array(NX * NX * NX);
  const gi = new Float64Array(NX * NX * NX);
  for (let z = 0; z < NX; z += 1) {
    const zz = z < M ? z : z - NX;
    for (let y = 0; y < NX; y += 1) {
      const yy = y < M ? y : y - NX;
      for (let x = 0; x < NX; x += 1) {
        const xx = x < M ? x : x - NX;
        const r2 = (xx * DX) ** 2 + (yy * DX) ** 2 + (zz * DX) ** 2;
        gr[z * NX2 + y * NX + x] = -1 / (4 * Math.PI * Math.sqrt(r2 + eps * eps));
      }
    }
  }
  fft3D(gr, gi, NX, -1);
  const res = { Re: gr, Im: gi, NX };
  _green3Cache.set(key, res);
  return res;
}

// Solve grad^2 phi = 4 pi G rho with isolated boundaries on an M^3 grid.
export function solvePoissonIsolated3D(rho, M, L, G, eps = 0.05 * L / M) {
  const NX = 2 * M, DX = L / M, NX2 = NX * NX;
  const rR = new Float64Array(NX * NX * NX);
  for (let z = 0; z < M; z += 1) for (let y = 0; y < M; y += 1) for (let x = 0; x < M; x += 1) {
    rR[z * NX2 + y * NX + x] = rho[(z * M + y) * M + x];
  }
  const rI = new Float64Array(NX * NX * NX);
  fft3D(rR, rI, NX, -1);
  const gf = greenFFT3(M, L, eps);
  const pref = 4 * Math.PI * G * DX * DX * DX;
  for (let i = 0; i < rR.length; i += 1) {
    const ar = rR[i], ai = rI[i], br = gf.Re[i], bi = gf.Im[i];
    rR[i] = pref * (ar * br - ai * bi);
    rI[i] = pref * (ar * bi + ai * br);
  }
  fft3D(rR, rI, NX, +1);
  const norm = NX * NX * NX;
  const phi = new Float64Array(M * M * M);
  for (let z = 0; z < M; z += 1) for (let y = 0; y < M; y += 1) for (let x = 0; x < M; x += 1) {
    phi[(z * M + y) * M + x] = rR[z * NX2 + y * NX + x] / norm;
  }
  return phi;
}

// Open-boundary CIC deposit (no wrap, no DC subtraction): the M^3 grid
// spans [0, L) in each axis; particles outside it do not deposit.
export function depositCIC3D(x, m, N, M, L) {
  const DX = L / M, rho = new Float64Array(M * M * M);
  for (let p = 0; p < N; p += 1) {
    const fx = x[3 * p] / DX, fy = x[3 * p + 1] / DX, fz = x[3 * p + 2] / DX;
    const i0 = Math.floor(fx), j0 = Math.floor(fy), k0 = Math.floor(fz);
    if (i0 < 0 || i0 >= M - 1 || j0 < 0 || j0 >= M - 1 || k0 < 0 || k0 >= M - 1) continue;
    const sx = fx - i0, sy = fy - j0, sz = fz - k0;
    const mp = m[p];
    for (let dz = 0; dz < 2; dz += 1) for (let dy = 0; dy < 2; dy += 1) for (let dx = 0; dx < 2; dx += 1) {
      const wx = dx ? sx : 1 - sx, wy = dy ? sy : 1 - sy, wz = dz ? sz : 1 - sz;
      rho[((k0 + dz) * M + (j0 + dy)) * M + (i0 + dx)] += mp * wx * wy * wz;
    }
  }
  return rho;
}

export function gradPhi3D(phi, M, L) {
  const DX = L / M, M2 = M * M;
  const gx = new Float64Array(M2 * M), gy = new Float64Array(M2 * M), gz = new Float64Array(M2 * M);
  const at = (i, j, k) => phi[(k * M + j) * M + i];
  for (let k = 0; k < M; k += 1) for (let j = 0; j < M; j += 1) for (let i = 0; i < M; i += 1) {
    const ip = Math.min(i + 1, M - 1), im = Math.max(i - 1, 0);
    const jp = Math.min(j + 1, M - 1), jm = Math.max(j - 1, 0);
    const kp = Math.min(k + 1, M - 1), km = Math.max(k - 1, 0);
    const idx = (k * M + j) * M + i;
    gx[idx] = (at(ip, j, k) - at(im, j, k)) / ((ip - im) * DX);
    gy[idx] = (at(i, jp, k) - at(i, jm, k)) / ((jp - jm) * DX);
    gz[idx] = (at(i, j, kp) - at(i, j, km)) / ((kp - km) * DX);
  }
  return { gx, gy, gz };
}

export function interpolateCIC3D(x, field, N, M, L) {
  const DX = L / M, out = new Float64Array(N);
  for (let p = 0; p < N; p += 1) {
    const fx = x[3 * p] / DX, fy = x[3 * p + 1] / DX, fz = x[3 * p + 2] / DX;
    const i0 = Math.floor(fx), j0 = Math.floor(fy), k0 = Math.floor(fz);
    if (i0 < 0 || i0 >= M - 1 || j0 < 0 || j0 >= M - 1 || k0 < 0 || k0 >= M - 1) { out[p] = 0; continue; }
    const sx = fx - i0, sy = fy - j0, sz = fz - k0;
    let v = 0;
    for (let dz = 0; dz < 2; dz += 1) for (let dy = 0; dy < 2; dy += 1) for (let dx = 0; dx < 2; dx += 1) {
      const wx = dx ? sx : 1 - sx, wy = dy ? sy : 1 - sy, wz = dz ? sz : 1 - sz;
      v += field[((k0 + dz) * M + (j0 + dy)) * M + (i0 + dx)] * wx * wy * wz;
    }
    out[p] = v;
  }
  return out;
}

// Kick-drift-kick leapfrog step. Returns the grid potential for diagnostics.
export function stepPM3D(state, dt, { M, L, G, eps }) {
  const acc = () => {
    const rho = depositCIC3D(state.x, state.m, state.N, M, L);
    const phi = solvePoissonIsolated3D(rho, M, L, G, eps);
    const g = gradPhi3D(phi, M, L);
    return {
      ax: interpolateCIC3D(state.x, g.gx, state.N, M, L),
      ay: interpolateCIC3D(state.x, g.gy, state.N, M, L),
      az: interpolateCIC3D(state.x, g.gz, state.N, M, L),
      phi,
    };
  };
  const a0 = acc();
  for (let p = 0; p < state.N; p += 1) {
    state.v[3 * p]     -= 0.5 * dt * a0.ax[p];
    state.v[3 * p + 1] -= 0.5 * dt * a0.ay[p];
    state.v[3 * p + 2] -= 0.5 * dt * a0.az[p];
    state.x[3 * p]     += dt * state.v[3 * p];
    state.x[3 * p + 1] += dt * state.v[3 * p + 1];
    state.x[3 * p + 2] += dt * state.v[3 * p + 2];
  }
  const a1 = acc();
  for (let p = 0; p < state.N; p += 1) {
    state.v[3 * p]     -= 0.5 * dt * a1.ax[p];
    state.v[3 * p + 1] -= 0.5 * dt * a1.ay[p];
    state.v[3 * p + 2] -= 0.5 * dt * a1.az[p];
  }
  state.t = (state.t ?? 0) + dt;
  state.nSteps = (state.nSteps ?? 0) + 1;
  return a1.phi;
}
