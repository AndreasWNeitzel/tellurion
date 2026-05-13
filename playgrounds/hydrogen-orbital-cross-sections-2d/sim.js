// sim.js
// Probability density |psi_nlm(r, theta, phi=0)|^2 for the hydrogen atom in
// the (x, z) plane (i.e., y = 0, phi = 0).
//
// Atomic units: hbar = m_e = e = 4 pi epsilon_0 = 1, a_0 = 1.
//
// psi_nlm(r, theta, phi) = R_nl(r) Y_lm(theta, phi)
//
// Radial part (Griffiths 2018 QM Eq. 4.89):
//   R_nl(r) = sqrt( (2 / n)^3  (n - l - 1)! / (2 n (n + l)!) )
//             * exp(-r / n)  (2 r / n)^l  L^{2 l + 1}_{n - l - 1}(2 r / n)
//
// where L^{alpha}_p is the associated Laguerre polynomial. Real spherical
// harmonics (cubic form) for visualization:
//   Y_l^0(theta, phi) = sqrt((2 l + 1) / (4 pi)) P_l(cos theta)
//   Y_l^|m| real combinations (Condon-Shortley, e.g., Sakurai 2017 Ch. 3.6).
//
// Reference: Griffiths and Schroeter 2018 Section 4.2 (`griffithsqm2018`).

function factorial(n) { let f = 1; for (let k = 2; k <= n; k += 1) f *= k; return f; }

// Associated Laguerre polynomial L^alpha_p(x) by recurrence.
// (p + 1) L_{p+1}^alpha = (2 p + 1 + alpha - x) L_p^alpha - (p + alpha) L_{p-1}^alpha
// with L_0 = 1, L_1 = 1 + alpha - x.
function assocLaguerre(p, alpha, x) {
  if (p === 0) return 1;
  if (p === 1) return 1 + alpha - x;
  let Lm1 = 1;
  let L = 1 + alpha - x;
  for (let k = 1; k < p; k += 1) {
    const Lp1 = ((2 * k + 1 + alpha - x) * L - (k + alpha) * Lm1) / (k + 1);
    Lm1 = L; L = Lp1;
  }
  return L;
}

// Associated Legendre polynomial P_l^m(x) for m >= 0.
// Numerical Recipes / standard recurrence (Sakurai 3.6.30):
//   P_m^m = (-1)^m (2 m - 1)!! (1 - x^2)^{m/2}
//   P_{m+1}^m = x (2 m + 1) P_m^m
//   P_l^m = ((2 l - 1) x P_{l-1}^m - (l + m - 1) P_{l-2}^m) / (l - m)
function assocLegendre(l, m, x) {
  if (m < 0 || m > l) return 0;
  let pmm = 1;
  if (m > 0) {
    const somx2 = Math.sqrt(Math.max(0, (1 - x) * (1 + x)));
    let fact = 1;
    for (let k = 1; k <= m; k += 1) {
      pmm *= -fact * somx2;
      fact += 2;
    }
  }
  if (l === m) return pmm;
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (l === m + 1) return pmmp1;
  let pll = 0;
  for (let ll = m + 2; ll <= l; ll += 1) {
    pll = ((2 * ll - 1) * x * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
    pmm = pmmp1;
    pmmp1 = pll;
  }
  return pll;
}

// Real spherical harmonic (Condon-Shortley). Returns Y_l^m(theta, phi) where
// for m = 0:    sqrt((2l+1)/(4 pi)) P_l(cos theta)
// for m > 0:    sqrt(2) sqrt((2l+1)/(4 pi) (l-m)!/(l+m)!) P_l^m(cos theta) cos(m phi)
// for m < 0:    sqrt(2) sqrt((2l+1)/(4 pi) (l-|m|)!/(l+|m|)!) P_l^|m|(cos theta) sin(|m| phi)
export function realY(l, m, theta, phi) {
  const x = Math.cos(theta);
  const absm = Math.abs(m);
  const N = Math.sqrt((2 * l + 1) / (4 * Math.PI) * (factorial(l - absm) / factorial(l + absm)));
  const P = assocLegendre(l, absm, x);
  if (m === 0) return N * P;
  if (m > 0) return Math.SQRT2 * N * P * Math.cos(m * phi);
  return Math.SQRT2 * N * P * Math.sin(absm * phi);
}

// Radial wavefunction R_nl(r) in atomic units.
export function R_nl(n, l, r) {
  const rho = 2 * r / n;
  const norm = Math.sqrt(Math.pow(2 / n, 3) * factorial(n - l - 1) / (2 * n * factorial(n + l)));
  return norm * Math.exp(-r / n) * Math.pow(rho, l) * assocLaguerre(n - l - 1, 2 * l + 1, rho);
}

export function psi(n, l, m, r, theta, phi) {
  return R_nl(n, l, r) * realY(l, m, theta, phi);
}

// Density field |psi_nlm|^2 on (x, z) plane (phi = 0; theta = atan2(x, z)).
// Returns Float32Array of length N * N.
export function densityField({
  n = 3, l = 2, m = 0, N = 256, span = 30,
} = {}) {
  const field = new Float32Array(N * N);
  let zMax = 0;
  for (let j = 0; j < N; j += 1) {
    const z = -span + (2 * span) * (j / (N - 1));
    for (let i = 0; i < N; i += 1) {
      const x = -span + (2 * span) * (i / (N - 1));
      const r = Math.hypot(x, z);
      const theta = Math.atan2(Math.abs(x), z);
      // For real harmonics with m > 0 we need phi in [-pi, pi]; in the xz plane
      // we use phi = 0 if x >= 0, phi = pi if x < 0.
      const phi = x >= 0 ? 0 : Math.PI;
      const v = psi(n, l, m, r, theta, phi);
      const d = v * v;
      field[j * N + i] = d;
      if (d > zMax) zMax = d;
    }
  }
  return { field, N, span, zMax };
}

// Available (n, l, m) labels for the dropdown. m is restricted so xz-plane
// shows the canonical lobed shapes.
export const ORBITALS = [
  { label: '1s   (n=1, l=0, m=0)',  n: 1, l: 0, m: 0,  span: 8 },
  { label: '2s   (n=2, l=0, m=0)',  n: 2, l: 0, m: 0,  span: 20 },
  { label: '2p_z (n=2, l=1, m=0)',  n: 2, l: 1, m: 0,  span: 16 },
  { label: '2p_x (n=2, l=1, m=+1)', n: 2, l: 1, m: 1,  span: 16 },
  { label: '3s   (n=3, l=0, m=0)',  n: 3, l: 0, m: 0,  span: 35 },
  { label: '3p_z (n=3, l=1, m=0)',  n: 3, l: 1, m: 0,  span: 35 },
  { label: '3d_z2 (n=3, l=2, m=0)', n: 3, l: 2, m: 0,  span: 30 },
  { label: '3d_xz (n=3, l=2, m=+1)',n: 3, l: 2, m: 1,  span: 30 },
  { label: '4f_z3 (n=4, l=3, m=0)', n: 4, l: 3, m: 0,  span: 50 },
];
