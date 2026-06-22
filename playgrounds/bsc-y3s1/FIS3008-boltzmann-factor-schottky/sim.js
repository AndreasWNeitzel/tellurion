// A two-level system in thermal equilibrium: a ground level (energy 0, degeneracy g0)
// and an excited level (energy Delta, degeneracy g1). The Boltzmann factor sets the
// populations, p_i proportional to g_i e^{-E_i/kT}, and the temperature dependence of
// the mean energy gives the Schottky heat-capacity anomaly: a peak near kT ~ Delta
// that rises from zero and falls back to zero. Units k = 1, so T is kT.
// Reference: Reif, Fundamentals of Statistical and Thermal Physics, Ch. 6.

export function partitionZ(T, Delta, g0, g1) { return g0 + g1 * Math.exp(-Delta / T); }

// Population of the excited level, p1 = g1 e^{-Delta/T} / Z.
export function popExcited(T, Delta, g0, g1) {
  if (T <= 0) return 0;
  const e = Math.exp(-Delta / T);
  return (g1 * e) / (g0 + g1 * e);
}
export function popGround(T, Delta, g0, g1) { return 1 - popExcited(T, Delta, g0, g1); }

// Mean energy per particle, <E> = Delta p1, from 0 at T -> 0 to Delta g1/(g0+g1) at T -> infinity.
export function meanEnergy(T, Delta, g0, g1) { return Delta * popExcited(T, Delta, g0, g1); }

// Heat capacity C/k = d<E>/dT = (Delta/T)^2 g0 g1 e^{-Delta/T} / (g0 + g1 e^{-Delta/T})^2.
export function heatCapacity(T, Delta, g0, g1) {
  if (T <= 0) return 0;
  const x = Delta / T, e = Math.exp(-x), d = g0 + g1 * e;
  return x * x * (g0 * g1 * e) / (d * d);
}

// Temperature kT/Delta at which the heat capacity peaks, found by a coarse-then-fine scan.
export function schottkyPeak(Delta, g0, g1) {
  let best = 0, bt = 0.4 * Delta;
  for (let i = 1; i <= 2000; i += 1) { const T = i / 2000 * 3 * Delta; const c = heatCapacity(T, Delta, g0, g1); if (c > best) { best = c; bt = T; } }
  return { Tpeak: bt, ratio: bt / Delta, Cmax: best };
}
