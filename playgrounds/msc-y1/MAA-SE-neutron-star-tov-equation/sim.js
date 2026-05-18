// Tolman-Oppenheimer-Volkoff structure of a neutron star (Tolman 1939;
// Oppenheimer and Volkoff 1939; Shapiro and Teukolsky Ch. 5). The TOV
// equations are integrated in SI units for four equations of state:
// an ideal degenerate free-neutron Fermi gas, a stiff and a soft
// relativistic polytrope, and an MIT-bag quark fluid. Sweeping the
// central density gives the mass-radius diagram and the maximum mass.

export const G = 6.674e-11, C = 2.99792458e8;
export const MN = 1.674927498e-27, HBAR = 1.054571817e-34;
export const MSUN = 1.98892e30, KM = 1e3;

// Free neutron Fermi gas (T = 0). x = k_F / (m_n c). Energy density
// and pressure (Shapiro and Teukolsky Eqs. 2.3.22-2.3.23):
//   eps = (eps0/8)[ x sqrt(1+x^2)(2x^2+1) - asinh(x) ]
//   P   = (eps0/24)[ x sqrt(1+x^2)(2x^2-3) + 3 asinh(x) ]
export const EPS0 = (MN ** 4) * (C ** 5) / (Math.PI * Math.PI * HBAR ** 3); // J/m^3
const asinh = (v) => Math.log(v + Math.sqrt(v * v + 1));
export function fermiEps(x) {
  const s = Math.sqrt(1 + x * x);
  return (EPS0 / 8) * (x * s * (2 * x * x + 1) - asinh(x));
}
export function fermiP(x) {
  const s = Math.sqrt(1 + x * x);
  return (EPS0 / 24) * (x * s * (2 * x * x - 3) + 3 * asinh(x));
}
// rest-mass density rho = m_n n, n = (m_n c/hbar)^3 x^3 / (3 pi^2)
export function fermiRho(x) {
  const n = ((MN * C / HBAR) ** 3) * x * x * x / (3 * Math.PI * Math.PI);
  return MN * n;
}
function fermiXofP(P) {                                   // invert P(x), P monotone
  if (P <= 0) return 0;
  let lo = 1e-6, hi = 1e3;
  for (let i = 0; i < 200; i += 1) {
    const mid = Math.sqrt(lo * hi);
    if (fermiP(mid) < P) lo = mid; else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

// Equations of state: each returns eps(P) [J/m^3] and a central
// pressure from a chosen central rest-mass density rho_c [kg/m^3].
// Polytropes anchored at nuclear saturation: P = P0 (rho/rho0)^Gamma.
const RHO0 = 2.7e17;                                       // nuclear saturation, kg/m^3
const P0_STIFF = 1.8e33, GPOLY_STIFF = 3.0;                // stiff -> Mmax above 2 Msun
const P0_SOFT = 0.85e33, GPOLY_SOFT = 2.0;                 // soft  -> Mmax below 2 Msun
const BAG = 6.0e34;                                        // MIT bag constant (J/m^3)
function polyEps(P, P0, G_) {
  if (P <= 0) return 0;
  const rho = RHO0 * Math.pow(P / P0, 1 / G_);
  return rho * C * C + P / (G_ - 1);
}
export const EOS = {
  fermi: {
    name: 'free neutron Fermi gas',
    Pc: (rhoc) => {
      // x from rho_c, then P(x)
      let lo = 1e-6, hi = 1e3;
      for (let i = 0; i < 200; i += 1) {
        const mid = Math.sqrt(lo * hi);
        if (fermiRho(mid) < rhoc) lo = mid; else hi = mid;
      }
      return fermiP(Math.sqrt(lo * hi));
    },
    eps: (P) => (P <= 0 ? 0 : fermiEps(fermiXofP(P))),
  },
  stiff: {
    name: 'stiff polytrope',
    Pc: (rhoc) => P0_STIFF * Math.pow(rhoc / RHO0, GPOLY_STIFF),
    eps: (P) => polyEps(P, P0_STIFF, GPOLY_STIFF),
  },
  soft: {
    name: 'soft polytrope',
    Pc: (rhoc) => P0_SOFT * Math.pow(rhoc / RHO0, GPOLY_SOFT),
    eps: (P) => polyEps(P, P0_SOFT, GPOLY_SOFT),
  },
  quark: {
    name: 'MIT-bag quark matter',
    Pc: (rhoc) => Math.max(1, (rhoc * C * C - 4 * BAG) / 3),
    eps: (P) => 3 * P + 4 * BAG,                            // self-bound
  },
};

// One TOV star: integrate from the centre with central pressure Pc
// (from rho_c via the EOS) by RK4 to the surface P = 0. SI units;
// returns R [m], M [kg] and the central energy density.
export function tovStar(eosKey, rhoc, dr = 20) {
  const eos = EOS[eosKey];
  const Pc = eos.Pc(rhoc);
  if (!(Pc > 0)) return { R: 0, M: 0, epsc: 0, Pc: 0 };
  const epsc = eos.eps(Pc);
  const deriv = (r, P, m) => {
    if (P <= 0) return [0, 0];
    const eps = eos.eps(P);
    const rho = eps / (C * C);                             // mass-energy density
    const denom = r * (r - 2 * G * m / (C * C));
    if (denom <= 0) return [0, 4 * Math.PI * r * r * rho];
    const dP = -(G / (r * r)) * (rho + P / (C * C))
      * (m + 4 * Math.PI * r ** 3 * P / (C * C)) * r * r / denom;
    const dm = 4 * Math.PI * r * r * rho;
    return [dP, dm];
  };
  let r = 1.0, P = Pc, m = (4 / 3) * Math.PI * r ** 3 * (epsc / (C * C));
  let steps = 0;
  while (P > 1e-8 * Pc && r < 1e6 && steps < 200000) {
    const [k1P, k1m] = deriv(r, P, m);
    const [k2P, k2m] = deriv(r + dr / 2, P + dr / 2 * k1P, m + dr / 2 * k1m);
    const [k3P, k3m] = deriv(r + dr / 2, P + dr / 2 * k2P, m + dr / 2 * k2m);
    const [k4P, k4m] = deriv(r + dr, P + dr * k3P, m + dr * k3m);
    const Pn = P + (dr / 6) * (k1P + 2 * k2P + 2 * k3P + k4P);
    const mn = m + (dr / 6) * (k1m + 2 * k2m + 2 * k3m + k4m);
    if (Pn <= 0) break;
    P = Pn; m = mn; r += dr; steps += 1;
  }
  return { R: r, M: m, epsc, Pc };
}

// Same integration as tovStar but recording the interior profile
// (radius, pressure, energy density and enclosed mass) for plotting.
export function tovProfile(eosKey, rhoc, dr = 30) {
  const eos = EOS[eosKey];
  const Pc = eos.Pc(rhoc);
  const out = { r: [], P: [], eps: [], m: [], R: 0, M: 0, Pc };
  if (!(Pc > 0)) return out;
  const epsc = eos.eps(Pc);
  const deriv = (r, P, m) => {
    if (P <= 0) return [0, 0];
    const eps = eos.eps(P), rho = eps / (C * C);
    const denom = r * (r - 2 * G * m / (C * C));
    if (denom <= 0) return [0, 4 * Math.PI * r * r * rho];
    return [
      -(G / (r * r)) * (rho + P / (C * C)) * (m + 4 * Math.PI * r ** 3 * P / (C * C)) * r * r / denom,
      4 * Math.PI * r * r * rho,
    ];
  };
  let r = 1.0, P = Pc, m = (4 / 3) * Math.PI * r ** 3 * (epsc / (C * C)), steps = 0;
  while (P > 1e-8 * Pc && r < 1e6 && steps < 200000) {
    if (steps % 12 === 0) { out.r.push(r); out.P.push(P); out.eps.push(eos.eps(P)); out.m.push(m); }
    const [k1P, k1m] = deriv(r, P, m);
    const [k2P, k2m] = deriv(r + dr / 2, P + dr / 2 * k1P, m + dr / 2 * k1m);
    const [k3P, k3m] = deriv(r + dr / 2, P + dr / 2 * k2P, m + dr / 2 * k2m);
    const [k4P, k4m] = deriv(r + dr, P + dr * k3P, m + dr * k3m);
    const Pn = P + (dr / 6) * (k1P + 2 * k2P + 2 * k3P + k4P);
    const mn = m + (dr / 6) * (k1m + 2 * k2m + 2 * k3m + k4m);
    if (Pn <= 0) break;
    P = Pn; m = mn; r += dr; steps += 1;
  }
  out.r.push(r); out.P.push(0); out.eps.push(0); out.m.push(m);
  out.R = r; out.M = m;
  return out;
}

// Mass-radius sequence: sweep the central rest-mass density.
export function massRadiusCurve(eosKey, rhoMin, rhoMax, n = 60) {
  const rho = [], R = [], M = [];
  for (let i = 0; i <= n; i += 1) {
    const lr = Math.log10(rhoMin) + (Math.log10(rhoMax) - Math.log10(rhoMin)) * i / n;
    const rc = Math.pow(10, lr);
    const s = tovStar(eosKey, rc, 30);
    rho.push(rc); R.push(s.R / KM); M.push(s.M / MSUN);
  }
  return { rho, R, M };
}
export function maxMass(eosKey, rhoMin, rhoMax, n = 80) {
  const c = massRadiusCurve(eosKey, rhoMin, rhoMax, n);
  let im = 0;
  for (let i = 1; i < c.M.length; i += 1) if (c.M[i] > c.M[im]) im = i;
  return { Mmax: c.M[im], Rat: c.R[im], rhoc: c.rho[im], curve: c };
}
