// sim.js
// Rectangular barrier scattering for a 1D Schrodinger particle of mass m
// and energy E incident on a barrier of height V0, width a. Units:
// hbar = m = 1.
//
// Stationary scattering wavefunction (Griffiths QM 2018, Section 2.5),
// using the visualization convention psi_III(x) = t exp(i k (x - a)) so
// the transmitted-wave phase is referenced to the right edge of the
// barrier:
//
//   Region I (x < 0):    psi_I  = exp(+i k x) + r exp(-i k x)
//   Region II (0 < x < a):
//     E < V0:   psi_II = A exp(-kappa x) + B exp(+kappa x),  kappa = sqrt(2(V0-E))
//     E > V0:   psi_II = A exp(+i kappa x) + B exp(-i kappa x),  kappa = sqrt(2(E-V0))
//   Region III (x > a):  psi_III = t exp(i k (x - a))
//
// Boundary conditions psi and psi' continuous at x = 0 and x = a give
// closed-form (r, t, A, B) (all complex). Below we derive and use them.
//
// For E < V0:
//   1/t = cosh(kappa a) + i ((kappa^2 - k^2) / (2 k kappa)) sinh(kappa a)
//   r   = -i t (k^2 + kappa^2) / (2 k kappa) sinh(kappa a)
//   A   = (t / 2) (1 - i k / kappa) exp(+kappa a)
//   B   = (t / 2) (1 + i k / kappa) exp(-kappa a)
//
// For E > V0 (oscillating interior):
//   1/t = cos(kappa a) - i ((k^2 + kappa^2) / (2 k kappa)) sin(kappa a)
//   r   = -i t (k^2 - kappa^2) / (2 k kappa) sin(kappa a)
//   A   = (t / 2) (1 + k / kappa) exp(-i kappa a)
//   B   = (t / 2) (1 - k / kappa) exp(+i kappa a)
//
// We compute these directly. The visualization psi(x, t) = psi(x) exp(-i E t)
// then has Re(psi) continuous at both interfaces by construction.

function cdiv(a_re, a_im, b_re, b_im) {
  const den = b_re * b_re + b_im * b_im;
  return [(a_re * b_re + a_im * b_im) / den, (a_im * b_re - a_re * b_im) / den];
}
function cabs2(re, im) { return re * re + im * im; }

function matchedBelow(E, V0, a) {
  const k = Math.sqrt(2 * E);
  const kappa = Math.sqrt(2 * (V0 - E));
  const ch = Math.cosh(kappa * a);
  const sh = Math.sinh(kappa * a);
  const eps = (kappa * kappa - k * k) / (2 * k * kappa);
  const [t_re, t_im] = cdiv(1, 0, ch, eps * sh);
  // r = -i * coef2 * sh * t, with coef2 = (k^2 + kappa^2) / (2 k kappa).
  // -i * (t_re + i t_im) = t_im - i t_re. Times (coef2 sh):
  const coef2 = (k * k + kappa * kappa) / (2 * k * kappa);
  const r_re = coef2 * sh * t_im;
  const r_im = -coef2 * sh * t_re;
  const eKp = Math.exp(kappa * a);
  const eKm = Math.exp(-kappa * a);
  const kok = k / kappa;
  // A = (t / 2)(1 - i kok) e^{kappa a}
  // (t_re + i t_im)(1 - i kok) = (t_re + kok t_im) + i (t_im - kok t_re)
  const A_re = 0.5 * eKp * (t_re + kok * t_im);
  const A_im = 0.5 * eKp * (t_im - kok * t_re);
  // B = (t / 2)(1 + i kok) e^{-kappa a}
  const B_re = 0.5 * eKm * (t_re - kok * t_im);
  const B_im = 0.5 * eKm * (t_im + kok * t_re);
  return { mode: 'below', k, kappa, r_re, r_im, t_re, t_im, A_re, A_im, B_re, B_im };
}

function matchedAbove(E, V0, a) {
  const k = Math.sqrt(2 * E);
  const kappa = Math.sqrt(2 * (E - V0));
  const c = Math.cos(kappa * a);
  const s = Math.sin(kappa * a);
  const coef = (k * k + kappa * kappa) / (2 * k * kappa);
  const [t_re, t_im] = cdiv(1, 0, c, -coef * s);
  // r = -i (k^2 - kappa^2)/(2 k kappa) sin(kappa a) * t
  const coef2 = (k * k - kappa * kappa) / (2 * k * kappa);
  const r_re = coef2 * s * t_im;
  const r_im = -coef2 * s * t_re;
  // A = (t/2)(1 + k/kappa) e^{-i kappa a}
  // (t_re + i t_im)(c - i s) = (t_re c + t_im s) + i (t_im c - t_re s)
  const r1 = 1 + k / kappa;
  const A_re = 0.5 * r1 * (t_re * c + t_im * s);
  const A_im = 0.5 * r1 * (t_im * c - t_re * s);
  // B = (t/2)(1 - k/kappa) e^{+i kappa a}
  // (t_re + i t_im)(c + i s) = (t_re c - t_im s) + i (t_im c + t_re s)
  const r2 = 1 - k / kappa;
  const B_re = 0.5 * r2 * (t_re * c - t_im * s);
  const B_im = 0.5 * r2 * (t_im * c + t_re * s);
  return { mode: 'above', k, kappa, r_re, r_im, t_re, t_im, A_re, A_im, B_re, B_im };
}

// Public: stationary wavefunction Re(psi(x) exp(-i E t)).
export function psiReal(x, t, E, V0, a) {
  if (E <= 0) return 0;
  const p = E < V0 ? matchedBelow(E, V0, a) : matchedAbove(E, V0, a);
  const { k, kappa, r_re, r_im, t_re, t_im, A_re, A_im, B_re, B_im, mode } = p;
  let psi_re, psi_im;
  if (x < 0) {
    const ckx = Math.cos(k * x), skx = Math.sin(k * x);
    // exp(ikx) = ckx + i skx; r exp(-ikx) = (r_re + i r_im)(ckx - i skx)
    const rxr = r_re * ckx + r_im * skx;
    const rxi = r_im * ckx - r_re * skx;
    psi_re = ckx + rxr;
    psi_im = skx + rxi;
  } else if (x > a) {
    const xa = x - a;
    const c = Math.cos(k * xa), s = Math.sin(k * xa);
    psi_re = t_re * c - t_im * s;
    psi_im = t_re * s + t_im * c;
  } else if (mode === 'below') {
    const eM = Math.exp(-kappa * x);
    const eP = Math.exp(+kappa * x);
    psi_re = A_re * eM + B_re * eP;
    psi_im = A_im * eM + B_im * eP;
  } else {
    const c = Math.cos(kappa * x), s = Math.sin(kappa * x);
    // A exp(+i kappa x) + B exp(-i kappa x)
    const apr = A_re * c - A_im * s;
    const api = A_re * s + A_im * c;
    const bpr = B_re * c + B_im * s;
    const bpi = -B_re * s + B_im * c;
    psi_re = apr + bpr;
    psi_im = api + bpi;
  }
  const ce = Math.cos(E * t), se = Math.sin(E * t);
  return psi_re * ce + psi_im * se;
}

export function transmission(E, V0, a) {
  if (E <= 0) return 0;
  if (Math.abs(E - V0) < 1e-12) return 1 / (1 + V0 * a * a / 2);
  const p = E < V0 ? matchedBelow(E, V0, a) : matchedAbove(E, V0, a);
  return cabs2(p.t_re, p.t_im);
}

export function reflection(E, V0, a) {
  return 1 - transmission(E, V0, a);
}

export function resonanceEnergy(n, V0, a) {
  const kappa = n * Math.PI / a;
  return V0 + 0.5 * kappa * kappa;
}
