// Headless physics for the Bell-inequality hero. Two photons in a
// polarization singlet are emitted from a common source toward two
// distant detectors. Alice (left) and Bob (right) each measure with
// a linear polarizer at chosen angle. Quantum mechanics predicts
// the correlation
//
//   E_QM(a, b) = -cos(2 (a - b)),
//
// while any local hidden-variable theory is constrained by the CHSH
// inequality (Clauser, Horne, Shimony, Holt 1969):
//
//   S = | E(a, b) - E(a, b') + E(a', b) + E(a', b') |  <=  2
//
// (Bell 1964, Physics 1, 195). Quantum mechanics can give
// |S| = 2 sqrt(2) ~ 2.828 at the optimal angle set (a=0, a'=45,
// b=22.5, b'=67.5 deg). Aspect et al. 1982 verified
// experimentally; modern loophole-free tests (Hensen+ 2015,
// Giustina+ 2015, Shalm+ 2015) cement violation.
//
// References:
//   Bell, Physics 1 (1964) 195. `bell-1964`.
//   Clauser, Horne, Shimony, Holt, Phys. Rev. Lett. 23 (1969) 880.
//     `chsh-1969`.
//   Aspect et al., Phys. Rev. Lett. 49 (1982) 91. `aspect-1982`.

export const DEG = Math.PI / 180;

// Quantum-mechanical correlation function for a polarization
// singlet state with linear polarizers at angles a, b (radians).
export function correlation_QM(a, b) {
  return -Math.cos(2 * (a - b));
}

// Probability of joint outcomes (++, --) and (+-, -+) for the
// singlet state under projective measurement.
//   P(++) = P(--) = (1 - cos(2(a-b))) / 4
//   P(+-) = P(-+) = (1 + cos(2(a-b))) / 4
export function jointProbabilities(a, b) {
  const c = Math.cos(2 * (a - b));
  return {
    pp: (1 - c) / 4,
    mm: (1 - c) / 4,
    pm: (1 + c) / 4,
    mp: (1 + c) / 4,
  };
}

// Marginal probability of a single measurement at angle a (always 0.5).
export function marginalProbability() { return 0.5; }

// CHSH S statistic: S = E(a, b) - E(a, b') + E(a', b) + E(a', b').
// Classical bound: |S| <= 2. Tsirelson bound (quantum): |S| <= 2 sqrt 2.
export function chshS(a, ap, b, bp) {
  return (
    correlation_QM(a, b) -
    correlation_QM(a, bp) +
    correlation_QM(ap, b) +
    correlation_QM(ap, bp)
  );
}

// Optimal CHSH angle set (chooses settings that maximize |S| for QM).
//   a = 0, a' = pi/4, b = pi/8, b' = 3 pi/8.
// At these settings S = 2 sqrt 2.
export const OPTIMAL_ANGLES = {
  a: 0, ap: Math.PI / 4, b: Math.PI / 8, bp: 3 * Math.PI / 8,
};

export const TSIRELSON_BOUND = 2 * Math.sqrt(2);
export const CLASSICAL_BOUND = 2;

// Classical (local hidden variable) correlation. The exact LHV bound
// depends on the model; the linear "v(a) = sign(a - lambda)" model
// gives E(a, b) = (8 / pi^2) * (|a - b| - pi/2 floor stuff). The
// envelope |E_LHV| = 1 - 2 |a - b| / pi (zigzag).
export function correlation_LHV_envelope(a, b) {
  let d = (a - b);
  // Reduce to [0, pi]:
  while (d < 0) d += Math.PI;
  while (d > Math.PI) d -= Math.PI;
  return 1 - 2 * d / Math.PI;
}

// Sample N pairs at one (a, b) angle and return measured correlation.
// Uses the deterministic Mulberry32 RNG.
export function sampleCorrelation(N, a, b, rng) {
  // For each pair: outcomes (+1, +1) with prob (1-cos)/4 each pair sign,
  // (+1, -1) with prob (1+cos)/4 etc. Total correlation = sum(x_i * y_i) / N.
  const c = Math.cos(2 * (a - b));
  const probSame = (1 - c) / 2;     // P(x = y) summing across signs
  let s = 0;
  for (let i = 0; i < N; i++) {
    const same = rng() < probSame;
    s += same ? 1 : -1;
  }
  return s / N;
}

export function makeRng(seed = 0xC0FFEE) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
