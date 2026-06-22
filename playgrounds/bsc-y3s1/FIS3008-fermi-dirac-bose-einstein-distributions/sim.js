// The three occupation-number distributions of statistical mechanics: the mean number
// of particles in a single-particle state of energy E at temperature T and chemical
// potential mu. Writing x = (E - mu)/kT,
//   Fermi-Dirac:      n = 1/(e^x + 1)      (fermions, at most one per state)
//   Bose-Einstein:    n = 1/(e^x - 1)      (bosons, only for E > mu)
//   Maxwell-Boltzmann: n = e^{-x}          (classical limit)
// All three coincide in the dilute limit x >> 1. Reference: Pathria and Beale,
// Statistical Mechanics, 3rd ed., Ch. 6.

export function fermiDirac(E, mu, kT) {
  return 1 / (Math.exp((E - mu) / kT) + 1);
}

// Bose-Einstein occupation. Defined only for E > mu; it diverges as E -> mu+ and is
// unphysical (negative) for E < mu, so we return Infinity there.
export function boseEinstein(E, mu, kT) {
  const x = (E - mu) / kT;
  if (x <= 0) return Infinity;
  return 1 / (Math.exp(x) - 1);
}

export function maxwellBoltzmann(E, mu, kT) {
  return Math.exp(-(E - mu) / kT);
}

// Fractional departure of a quantum distribution from the classical (MB) value,
// |n_q - n_MB| / n_MB. Goes to zero in the dilute limit E - mu >> kT.
export function classicalDeparture(which, E, mu, kT) {
  const mb = maxwellBoltzmann(E, mu, kT);
  const q = which === 'fd' ? fermiDirac(E, mu, kT) : boseEinstein(E, mu, kT);
  if (!isFinite(q)) return Infinity;
  return Math.abs(q - mb) / mb;
}
