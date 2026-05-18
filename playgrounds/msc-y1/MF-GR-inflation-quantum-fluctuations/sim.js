// Single-field slow-roll inflation (reduced Planck mass M_pl = 1).
// Mukhanov, Physical Foundations of Cosmology; Baumann, Cosmology;
// Starobinsky 1980; Planck 2018.
//
//   epsilon = (1/2)(V'/V)^2,  eta = V''/V
//   n_s = 1 - 6 epsilon + 2 eta,  r = 16 epsilon,  n_t = -2 epsilon
//   N(phi) = integral_{phi_end}^{phi} V/V' dphi   (inflation ends at
//   epsilon = 1); P_s ~ V/(24 pi^2 epsilon) at horizon crossing,
//   nearly scale invariant: P_s(k) ~ A_s (k/k0)^{n_s-1}.

const B = Math.sqrt(2 / 3);                            // Starobinsky exponent

// Potentials: V, V', V'' (M_pl = 1).
export const POTENTIALS = {
  quadratic: {
    V: (p) => 0.5 * p * p,
    Vp: (p) => p,
    Vpp: () => 1,
    phiStart: 16,
  },
  starobinsky: {
    V: (p) => { const e = 1 - Math.exp(-B * p); return e * e; },
    Vp: (p) => 2 * (1 - Math.exp(-B * p)) * B * Math.exp(-B * p),
    Vpp: (p) => {
      const x = Math.exp(-B * p);
      return 2 * B * B * x * (2 * x - (1 - x));        // d/dphi [2(1-x) B x]
    },
    phiStart: 5.5,
  },
};

export function epsilon(p, pot) { const P = POTENTIALS[pot]; const v = P.V(p); return 0.5 * (P.Vp(p) / v) ** 2; }
export function eta(p, pot) { const P = POTENTIALS[pot]; return P.Vpp(p) / P.V(p); }
export function nsOf(p, pot) { return 1 - 6 * epsilon(p, pot) + 2 * eta(p, pot); }
export function rOf(p, pot) { return 16 * epsilon(p, pot); }
export function ntOf(p, pot) { return -2 * epsilon(p, pot); }

// End of inflation: smallest phi (above the minimum) with epsilon = 1.
export function phiEnd(pot) {
  let lo = 1e-3, hi = POTENTIALS[pot].phiStart;
  // epsilon decreases with phi for these potentials; bisect epsilon-1.
  for (let i = 0; i < 200; i += 1) {
    const m = 0.5 * (lo + hi);
    (epsilon(m, pot) - 1 > 0) ? (lo = m) : (hi = m);
  }
  return 0.5 * (lo + hi);
}

// e-folds from phi_end to phi: N = integral V/V' dphi (Simpson).
export function eFolds(p, pot, N = 4000) {
  const pe = phiEnd(pot);
  const a = pe, b = p;
  const P = POTENTIALS[pot];
  let s = 0;
  for (let i = 0; i <= N; i += 1) {
    const phi = a + (b - a) * i / N;
    const f = P.V(phi) / P.Vp(phi);
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    s += w * f;
  }
  return Math.abs(s * ((b - a) / N) / 3);
}

// Field value that gives N e-folds before the end of inflation.
export function phiAtN(Ntarget, pot) {
  const pe = phiEnd(pot);
  let lo = pe + 1e-4, hi = POTENTIALS[pot].phiStart;
  for (let i = 0; i < 120; i += 1) {
    const m = 0.5 * (lo + hi);
    (eFolds(m, pot, 1200) < Ntarget) ? (lo = m) : (hi = m);
  }
  return 0.5 * (lo + hi);
}

// Scalar power spectrum amplitude at horizon crossing (units where the
// 24 pi^2 and M_pl are absorbed): A_s ~ V / epsilon.
export function scalarAmplitude(p, pot) {
  return POTENTIALS[pot].V(p) / (24 * Math.PI * Math.PI * epsilon(p, pot));
}
// P_s(k) ~ A_s (k/k0)^{n_s-1} (near scale invariant).
export function powerSpectrum(k, k0, ns, As) {
  return As * Math.pow(k / k0, ns - 1);
}

// Mode stretching: physical wavelength = comoving * a, a = e^{Ne}
// during inflation; the Hubble radius 1/H is nearly constant
// (H ~ sqrt(V/3), slowly varying). Returns arrays over e-folds Ne.
export function modeHistory(lambdaCom, pot, phiStartN = 60, steps = 240) {
  const Ne = new Float64Array(steps + 1);
  const lamPhys = new Float64Array(steps + 1);
  const horizon = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const ne = phiStartN * i / steps;
    const phi = phiAtN(Math.max(1e-3, phiStartN - ne), pot);
    const Hh = Math.sqrt(POTENTIALS[pot].V(phi) / 3);
    Ne[i] = ne;
    lamPhys[i] = lambdaCom * Math.exp(ne);
    horizon[i] = 1 / Hh;
  }
  return { Ne, lamPhys, horizon };
}
