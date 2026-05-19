// Korteweg-de Vries equation, pseudo-spectral solver (DOM-free).
//
//   u_t + 6 u u_x + u_xxx = 0   on a periodic domain [0, L).
//
// Spatial derivatives are exact in Fourier space; the stiff linear
// dispersive part u_xxx is treated by an integrating factor so the
// step size is limited only by the smooth nonlinearity, and the
// linear oscillation never goes unstable. Time stepping is the
// classic integrating-factor RK4 (Trefethen, Spectral Methods in
// MATLAB, SIAM 2000, Program 27; Kassam & Trefethen, SIAM J. Sci.
// Comput. 26 (2005) 1214). The single-soliton solution is
//
//   u(x,t) = (c/2) sech^2( (sqrt(c)/2)(x - c t - x0) ),
//
// an amplitude a = c/2 hump moving at speed c = 2a: taller solitons
// are faster. KdV has infinitely many conserved quantities; the
// first three (mass, momentum, energy) are exported for the
// invariant tests so a fake animation cannot pass.
//
// References: Drazin & Johnson, Solitons: An Introduction, CUP 1989,
// Ch. 2; Trefethen 2000, Prog. 27. Engine, not a renderer: no DOM.

// In-place iterative radix-2 Cooley-Tukey FFT. re/im are Float64Array
// of length n (n a power of two). sign = -1 forward, +1 inverse
// (inverse is NOT normalised; divide by n at the call site).
export function fftInPlace(re, im, sign) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i += 1) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i]; re[i] = re[j]; re[j] = tr;
      const ti = im[i]; im[i] = im[j]; im[j] = ti;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = sign * 2 * Math.PI / len;
    const wlr = Math.cos(ang), wli = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let wr = 1, wi = 0;
      for (let k = 0; k < len >> 1; k += 1) {
        const a = i + k, b = i + k + (len >> 1);
        const xr = re[b] * wr - im[b] * wi;
        const xi = re[b] * wi + im[b] * wr;
        re[b] = re[a] - xr; im[b] = im[a] - xi;
        re[a] += xr;        im[a] += xi;
        const nwr = wr * wlr - wi * wli;
        wi = wr * wli + wi * wlr; wr = nwr;
      }
    }
  }
}

function isPow2(n) { return n >= 2 && (n & (n - 1)) === 0; }

// Wavenumber array for a length-L periodic grid of N points:
// k = 2 pi/L * [0,1,...,N/2-1, -N/2,...,-1].
function wavenumbers(N, L) {
  const k = new Float64Array(N);
  const f = 2 * Math.PI / L;
  for (let i = 0; i < N; i += 1) k[i] = f * (i < N / 2 ? i : i - N);
  return k;
}

// State: { N, L, dx, x, u, t, k, k3, _scratch... }. u is the height
// field; everything else is precomputed work space so step() does no
// allocation.
export function makeKdV(N = 512, L = 40) {
  if (!isPow2(N)) throw new Error(`KdV grid N must be a power of two, got ${N}`);
  const dx = L / N;
  const x = new Float64Array(N);
  for (let i = 0; i < N; i += 1) x[i] = i * dx;
  const k = wavenumbers(N, L);
  const k3 = new Float64Array(N);          // linear symbol L = i k^3
  for (let i = 0; i < N; i += 1) k3[i] = k[i] * k[i] * k[i];
  // Orszag 2/3 dealiasing mask: zero the top third of |k| so the
  // quadratic u^2 term does not alias energy back into resolved
  // modes (without this the invariants drift and the run blows up).
  const kmax = (Math.PI / dx);
  const dealias = new Float64Array(N);
  for (let i = 0; i < N; i += 1) dealias[i] = Math.abs(k[i]) <= (2 / 3) * kmax ? 1 : 0;
  return {
    N, L, dx, x, t: 0,
    // Dispersion coefficient delta in u_t + 6 u u_x + delta u_xxx = 0.
    // Default 1 (the canonical KdV the invariant tests use); the
    // playground maps "canal depth" onto it for exploration.
    dispersion: 1,
    u: new Float64Array(N),
    k, k3, dealias,
    // FFT / RK4 work buffers (no per-step allocation).
    ur: new Float64Array(N), ui: new Float64Array(N),
    vr: new Float64Array(N), vi: new Float64Array(N),
    ar: new Float64Array(N), ai: new Float64Array(N),
    br: new Float64Array(N), bi: new Float64Array(N),
    cr: new Float64Array(N), ci: new Float64Array(N),
    tmpr: new Float64Array(N), tmpi: new Float64Array(N),
    sq: new Float64Array(N),
  };
}

// One periodic KdV soliton of the given amplitude, centred at x0,
// added onto the current field. Speed c = 2*amplitude (returned).
export function addSoliton(s, x0, amplitude) {
  const c = 2 * amplitude;
  const w = Math.sqrt(c) / 2;
  for (let i = 0; i < s.N; i += 1) {
    // Nearest periodic image so a soliton near the seam is smooth.
    let d = s.x[i] - x0;
    d -= s.L * Math.round(d / s.L);
    const ch = Math.cosh(w * d);
    s.u[i] += (c / 2) / (ch * ch);
  }
  return c;
}

// A non-soliton initial lump (a Gaussian): it is NOT a KdV
// eigen-shape, so it disperses into a wavetrain. For the contrast
// preset. Replaces the field.
export function setGaussian(s, x0, amp, width) {
  for (let i = 0; i < s.N; i += 1) {
    let d = s.x[i] - x0;
    d -= s.L * Math.round(d / s.L);
    s.u[i] = amp * Math.exp(-(d * d) / (2 * width * width));
  }
  s.t = 0;
}

export function clear(s) { s.u.fill(0); s.t = 0; }

// Nonlinear term in Fourier space: N(u) = -3 i k * FFT(u^2)
// (since 6 u u_x = 3 (u^2)_x). Input: real field via (ur,ui=0) is
// NOT used; we take the spectral coefficients (Ur,Ui) and write the
// nonlinear spectral term into (outr,outi).
function nonlinear(s, Ur, Ui, outr, outi) {
  const { N, k } = s;
  // u = ifft(U)  (U is a full complex spectrum; field is real).
  s.tmpr.set(Ur); s.tmpi.set(Ui);
  fftInPlace(s.tmpr, s.tmpi, +1);
  for (let i = 0; i < N; i += 1) {
    const ux = s.tmpr[i] / N;            // real space u
    s.sq[i] = ux * ux;                   // u^2
  }
  // FFT(u^2)
  s.tmpr.set(s.sq); s.tmpi.fill(0);
  fftInPlace(s.tmpr, s.tmpi, -1);
  // multiply by -3 i k  (i*(a+ib) = -b + i a), then 2/3-dealias.
  for (let i = 0; i < N; i += 1) {
    const re = s.tmpr[i], im = s.tmpi[i];
    // -3 k * (i * (re + i im)) = -3 k * (-im + i re)
    outr[i] = (-3 * k[i] * (-im)) * s.dealias[i];
    outi[i] = (-3 * k[i] * (re)) * s.dealias[i];
  }
}

// Integrating-factor RK4 advance by dt. Linear symbol L = i k^3 so
// the exact propagator over h is E = exp(L h) = exp(i k^3 h); applied
// as complex rotations. This is unconditionally stable for the
// dispersive part; dt is limited only by the (smooth) nonlinearity.
export function step(s, dt) {
  const { N, k3 } = s;
  const dl = s.dispersion;               // dispersion coefficient delta
  // Spectrum of the current real field.
  s.ur.set(s.u); s.ui.fill(0);
  fftInPlace(s.ur, s.ui, -1);            // U = fft(u)

  // Complex rotation helpers for exp(i*theta).
  const rot = (ar, ai, idx, theta) => {
    const cr = Math.cos(theta), ci = Math.sin(theta);
    const re = ar[idx] * cr - ai[idx] * ci;
    const im = ar[idx] * ci + ai[idx] * cr;
    ar[idx] = re; ai[idx] = im;
  };

  // a = N(U)
  nonlinear(s, s.ur, s.ui, s.ar, s.ai);
  // Ua = E_{h/2} (U + h/2 a)
  for (let i = 0; i < N; i += 1) { s.vr[i] = s.ur[i] + 0.5 * dt * s.ar[i]; s.vi[i] = s.ui[i] + 0.5 * dt * s.ai[i]; }
  for (let i = 0; i < N; i += 1) rot(s.vr, s.vi, i, 0.5 * dt * k3[i] * dl);
  // b = N(Ua)
  nonlinear(s, s.vr, s.vi, s.br, s.bi);
  // also need E_{h/2} a for the final combination -> store rotated a in cr/ci
  s.cr.set(s.ar); s.ci.set(s.ai);
  for (let i = 0; i < N; i += 1) rot(s.cr, s.ci, i, 0.5 * dt * k3[i] * dl);
  // Ub = E_{h/2} U + h/2 b
  for (let i = 0; i < N; i += 1) { s.tmpr[i] = s.ur[i]; s.tmpi[i] = s.ui[i]; }
  for (let i = 0; i < N; i += 1) rot(s.tmpr, s.tmpi, i, 0.5 * dt * k3[i] * dl);
  for (let i = 0; i < N; i += 1) { s.tmpr[i] += 0.5 * dt * s.br[i]; s.tmpi[i] += 0.5 * dt * s.bi[i]; }
  // c = N(Ub)
  nonlinear(s, s.tmpr, s.tmpi, s.cr2 ?? (s.cr2 = new Float64Array(N)), s.ci2 ?? (s.ci2 = new Float64Array(N)));
  const c2r = s.cr2, c2i = s.ci2;
  // Ud = E_{h} U + E_{h/2} h c
  s.vr.set(s.ur); s.vi.set(s.ui);
  for (let i = 0; i < N; i += 1) rot(s.vr, s.vi, i, dt * k3[i] * dl);
  // E_{h/2} (h c)
  s.tmpr.set(c2r); s.tmpi.set(c2i);
  for (let i = 0; i < N; i += 1) rot(s.tmpr, s.tmpi, i, 0.5 * dt * k3[i] * dl);
  for (let i = 0; i < N; i += 1) { s.vr[i] += dt * s.tmpr[i]; s.vi[i] += dt * s.tmpi[i]; }
  // d = N(Ud)
  const dr = s.dr ?? (s.dr = new Float64Array(N));
  const di = s.di ?? (s.di = new Float64Array(N));
  nonlinear(s, s.vr, s.vi, dr, di);

  // Combine:
  // U_new = E_h U + (h/6)[ E_h a + 2 E_{h/2}(b + c) + d ]
  // E_h a:
  s.tmpr.set(s.ar); s.tmpi.set(s.ai);
  for (let i = 0; i < N; i += 1) rot(s.tmpr, s.tmpi, i, dt * k3[i] * dl);
  // 2 E_{h/2} (b + c):
  for (let i = 0; i < N; i += 1) { s.br[i] += c2r[i]; s.bi[i] += c2i[i]; }
  for (let i = 0; i < N; i += 1) rot(s.br, s.bi, i, 0.5 * dt * k3[i] * dl);
  // E_h U:
  for (let i = 0; i < N; i += 1) rot(s.ur, s.ui, i, dt * k3[i] * dl);
  for (let i = 0; i < N; i += 1) {
    s.ur[i] += (dt / 6) * (s.tmpr[i] + 2 * s.br[i] + dr[i]);
    s.ui[i] += (dt / 6) * (s.tmpi[i] + 2 * s.bi[i] + di[i]);
  }
  // back to real space
  fftInPlace(s.ur, s.ui, +1);
  for (let i = 0; i < N; i += 1) s.u[i] = s.ur[i] / N;
  s.t += dt;
}

// First three KdV invariants for u_t + 6 u u_x + u_xxx = 0:
//   I1 = integral u dx                         (mass)
//   I2 = integral u^2 dx                        (momentum)
//   I3 = integral ( u_x^2 - 2 u^3 ) dx          (energy / Hamiltonian)
// u_x via the spectral derivative (exact for the periodic field).
export function invariants(s) {
  const { N, dx, k } = s;
  let I1 = 0, I2 = 0;
  for (let i = 0; i < N; i += 1) { I1 += s.u[i]; I2 += s.u[i] * s.u[i]; }
  // spectral derivative
  s.tmpr.set(s.u); s.tmpi.fill(0);
  fftInPlace(s.tmpr, s.tmpi, -1);
  for (let i = 0; i < N; i += 1) {
    const re = s.tmpr[i], im = s.tmpi[i];   // d/dx -> multiply by i k
    s.tmpr[i] = -k[i] * im;
    s.tmpi[i] = k[i] * re;
  }
  fftInPlace(s.tmpr, s.tmpi, +1);
  let I3 = 0;
  for (let i = 0; i < N; i += 1) {
    const ux = s.tmpr[i] / N;
    I3 += ux * ux - 2 * s.u[i] * s.u[i] * s.u[i];
  }
  return { mass: I1 * dx, momentum: I2 * dx, energy: I3 * dx };
}

// Peak amplitude and its location (for the soliton probe / the
// post-collision amplitude invariant). Returns the tallest hump.
export function peak(s) {
  let amp = -Infinity, xi = 0;
  for (let i = 0; i < s.N; i += 1) if (s.u[i] > amp) { amp = s.u[i]; xi = i; }
  return { amplitude: amp, x: s.x[xi], speed: 2 * amp };
}
