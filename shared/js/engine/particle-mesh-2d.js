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

function dft2D(re, im, NX, NY, sign) {
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

// One kick-drift-kick leapfrog PM step. Returns the grid potential so
// callers can compute per-particle energies for diagnostics.
export function stepPM(state, dt, { NGRID, L, G }) {
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
