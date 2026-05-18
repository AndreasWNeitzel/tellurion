// Resonant Jaynes-Cummings model: a two-level atom in a single
// quantised cavity mode, rotating-wave approximation, exact resonance
// (detuning zero). With the atom initially excited and the field in a
// state of photon-number distribution P(n), the {|e,n>, |g,n+1>}
// subspace oscillates at the quantum Rabi frequency Omega_n =
// 2 g sqrt(n+1). The atomic inversion is the closed-form sum
//   W(t) = sum_n P(n) cos(2 g t sqrt(n+1)),
// and P_e + P_g = 1 exactly (cos^2 + sin^2). For a coherent field
// (Poissonian P(n), mean nbar) the spread of Rabi frequencies makes
// the Rabi oscillation collapse on t_c = sqrt(2)/g and revive on
// t_r = 2 pi sqrt(nbar) / g (Eberly, Narozhny and Sanchez-Mondragon,
// Phys. Rev. Lett. 44, 1323, 1980; Shore and Knight, J. Mod. Opt. 40,
// 1195, 1993; Gerry and Knight, Introductory Quantum Optics, CUP 2005,
// Ch. 4). Everything here is a closed-form special-function sum:
// deterministic, no integration, no RNG.

// Quantum Rabi frequency of the |e,n>/|g,n+1> doublet.
export function rabiFreq(n, g) { return 2 * g * Math.sqrt(n + 1); }

export function collapseTime(g) { return Math.SQRT2 / g; }
export function revivalTime(nbar, g) { return 2 * Math.PI * Math.sqrt(nbar) / g; }

// Poissonian photon-number distribution of a coherent state |alpha>,
// nbar = |alpha|^2. Stable log-space recurrence; truncated where the
// tail is negligible.
export function photonDist(nbar, nMax) {
  const N = nMax ?? Math.ceil(nbar + 8 * Math.sqrt(nbar + 1) + 20);
  const P = new Float64Array(N + 1);
  if (nbar <= 0) { P[0] = 1; return P; }            // vacuum -> delta at n=0
  let logp = -nbar;                                  // log P(0) = -nbar
  P[0] = Math.exp(logp);
  for (let n = 1; n <= N; n += 1) {
    logp += Math.log(nbar) - Math.log(n);            // log P(n) = log P(n-1) + log(nbar/n)
    P[n] = Math.exp(logp);
  }
  return P;
}

// Atomic inversion W(t) = <sigma_z> for the atom initially excited and
// the field with distribution P(n):
//   W(t) = sum_n P(n) cos(2 g t sqrt(n+1)).
// P_e = (1 + W)/2, P_g = (1 - W)/2, so P_e + P_g = 1 by construction.
export function inversionAt(t, nbar, g, P) {
  const dist = P ?? photonDist(nbar);
  let w = 0;
  for (let n = 0; n < dist.length; n += 1) {
    if (dist[n] === 0) continue;
    w += dist[n] * Math.cos(rabiFreq(n, g) * t);
  }
  return w;
}

export function excitedProb(t, nbar, g, P) { return 0.5 * (1 + inversionAt(t, nbar, g, P)); }
export function groundProb(t, nbar, g, P) { return 0.5 * (1 - inversionAt(t, nbar, g, P)); }

// Sample the inversion on a uniform time grid (one Poisson evaluation
// reused for every sample).
export function inversionSeries(tEnd, steps, nbar, g) {
  const P = photonDist(nbar);
  const tArr = new Float64Array(steps + 1);
  const wArr = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const t = tEnd * i / steps;
    tArr[i] = t;
    wArr[i] = inversionAt(t, nbar, g, P);
  }
  return { t: tArr, w: wArr };
}

// Wigner function of the initial coherent field |alpha> (alpha real,
// alpha = sqrt(nbar)): an exact Gaussian, W(x,p) = (2/pi)
// exp(-2[(x-x0)^2 + p^2]) with x0 = sqrt(2 nbar) in the
// x = sqrt(2) Re(beta), p = sqrt(2) Im(beta) quadrature convention.
export function coherentWigner(x, p, nbar) {
  const x0 = Math.sqrt(2 * nbar);
  return (2 / Math.PI) * Math.exp(-2 * ((x - x0) * (x - x0) + p * p));
}

// Moments of P(n): used by the invariants (norm 1, mean nbar,
// variance nbar for a Poisson/coherent field).
export function distMoments(P) {
  let s0 = 0, s1 = 0, s2 = 0;
  for (let n = 0; n < P.length; n += 1) { s0 += P[n]; s1 += n * P[n]; s2 += n * n * P[n]; }
  const mean = s1 / s0;
  return { norm: s0, mean, variance: s2 / s0 - mean * mean };
}
