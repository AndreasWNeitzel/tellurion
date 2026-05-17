// Ideal quantum gas statistics in 3D. A single-particle state of
// energy eps has mean occupation
//   MB: exp(-(eps-mu)/tau)
//   FD: 1 / (exp((eps-mu)/tau) + 1)
//   BE: 1 / (exp((eps-mu)/tau) - 1),  mu < 0
// with tau = kT. The density of states is g(eps) = C sqrt(eps)
// (free gas, spin folded into C). The chemical potential mu(tau) is
// fixed by N = integral g(eps) n(eps) d eps. Fermi energy
// E_F = (3N/2C)^{2/3}; Bose condensation at
// tau_c = (N / (C Gamma(3/2) zeta(3/2)))^{2/3}, below which mu = 0
// and the condensate fraction is 1 - (tau/tau_c)^{3/2}. Headless and
// deterministic. Reference: Pathria and Beale, Statistical Mechanics
// (3rd ed.), Ch. 7-8; Reif, Fundamentals of Statistical and Thermal
// Physics, Ch. 9.

export const ZETA32 = 2.6123753486854883;       // zeta(3/2)
export const GAMMA32 = Math.sqrt(Math.PI) / 2;   // Gamma(3/2)
export const C = 1;                              // density-of-states constant
export const NTOT = 1;                           // fixed particle number

export function gDOS(e) { return e <= 0 ? 0 : C * Math.sqrt(e); }

// Single-state mean occupation. stat in {'MB','FD','BE'}.
export function occ(stat, e, mu, tau) {
  const a = (e - mu) / tau;
  if (stat === 'MB') return Math.exp(-a);
  if (stat === 'FD') return 1 / (Math.exp(a) + 1);
  // BE: guard the eps -> mu pole; physical only for a > 0.
  const d = Math.exp(a) - 1;
  return d <= 1e-12 ? Infinity : 1 / d;
}

export function fermiEnergy() { return Math.pow((3 * NTOT) / (2 * C), 2 / 3); }
export function tauC() { return Math.pow(NTOT / (C * GAMMA32 * ZETA32), 2 / 3); }

// Number integral N(mu, tau) = C tau^{3/2} * 2 * int_0^U u^2 / (e^{u^2-eta} -+ 1) du,
// eta = mu/tau, with eps = tau u^2 removing the sqrt singularity so
// Simpson converges fast even as eta -> 0 for BE. MB is closed form.
export function numberIntegral(stat, mu, tau) {
  if (tau <= 0) return 0;
  if (stat === 'MB') return C * Math.pow(tau, 1.5) * GAMMA32 * Math.exp(mu / tau);
  const eta = mu / tau;
  const U = Math.sqrt(Math.max(60, 60 + eta));
  const n = 4000, h = U / n;
  const sgn = stat === 'FD' ? 1 : -1;
  const fu = (u) => {
    const a = u * u - eta;
    let den;
    if (sgn === 1) den = Math.exp(a) + 1;
    else { den = Math.exp(a) - 1; if (den <= 1e-14) return 0; }
    return (u * u) / den;
  };
  let s = fu(0) + fu(U);
  for (let i = 1; i < n; i += 1) s += (i % 2 ? 4 : 2) * fu(i * h);
  return C * Math.pow(tau, 1.5) * 2 * (h / 3) * s;
}

// Energy integral int eps g(eps) n d eps, same substitution with an
// extra eps = tau u^2 factor.
export function energyIntegral(stat, mu, tau) {
  if (tau <= 0) return 0;
  if (stat === 'MB') return C * Math.pow(tau, 2.5) * (1.5 * GAMMA32) * Math.exp(mu / tau);
  const eta = mu / tau;
  const U = Math.sqrt(Math.max(60, 60 + eta));
  const n = 4000, h = U / n;
  const sgn = stat === 'FD' ? 1 : -1;
  const fu = (u) => {
    const a = u * u - eta;
    let den;
    if (sgn === 1) den = Math.exp(a) + 1;
    else { den = Math.exp(a) - 1; if (den <= 1e-14) return 0; }
    return (u * u * u * u) / den;
  };
  let s = fu(0) + fu(U);
  for (let i = 1; i < n; i += 1) s += (i % 2 ? 4 : 2) * fu(i * h);
  return C * Math.pow(tau, 2.5) * 2 * (h / 3) * s;
}

// Chemical potential mu(tau) at fixed N. MB closed form; FD bisection
// on the monotone N(mu); BE bisection on mu in [-inf, 0], detecting
// condensation when even mu = 0 cannot hold all N in excited states.
export function solveMu(stat, tau, Nt = NTOT) {
  if (stat === 'MB') return tau * Math.log(Nt / (C * GAMMA32 * Math.pow(tau, 1.5)));
  if (stat === 'BE') {
    const nMax = numberIntegral('BE', 0, tau);
    if (nMax <= Nt) return 0;                       // condensed: mu pinned at 0
  }
  let lo = -80 * tau, hi = stat === 'FD' ? fermiEnergy() + 60 * tau + 5 : -1e-9 * tau;
  for (let it = 0; it < 200; it += 1) {
    const mid = 0.5 * (lo + hi);
    if (numberIntegral(stat, mid, tau) < Nt) lo = mid; else hi = mid;
  }
  return 0.5 * (lo + hi);
}

// Bose condensate fraction N0/N (0 above tau_c).
export function condensateFraction(tau) {
  const tc = tauC();
  return tau < tc ? 1 - Math.pow(tau / tc, 1.5) : 0;
}

// Low-temperature Sommerfeld expansion of the Fermi gas mu(tau).
export function sommerfeldMu(tau) {
  const EF = fermiEnergy();
  return EF * (1 - (Math.PI * Math.PI / 12) * (tau / EF) * (tau / EF));
}

// Mean energy per particle for the chosen statistics at (mu, tau).
export function meanEnergy(stat, mu, tau) {
  const N = numberIntegral(stat, mu, tau);
  return N > 0 ? energyIntegral(stat, mu, tau) / N : 0;
}
