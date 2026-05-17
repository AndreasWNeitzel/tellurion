// Exact real-space decimation renormalization group for the 1D Ising
// chain in a field. Decimating every other spin (rescale factor
// b = 2) gives the exact recursion (K = beta J, h = beta H):
//   K' = 1/4 ln[ cosh(2K+h) cosh(2K-h) / cosh^2 h ]
//   h' = h + 1/2 ln[ cosh(2K+h) / cosh(2K-h) ]
// with the per-spin free-energy constant
//   lnC = ln2 + 1/4 ln[cosh(2K+h)cosh(2K-h)] + 1/2 ln cosh h,
// so the free energy per spin obeys phi(K,h) = 1/2 lnC + 1/2 phi(K',h').
// The only fixed points are (0,0) (stable, high-T sink) and the
// zero-temperature (K -> infinity, h = 0) unstable point: 1D has no
// finite-T transition. Reconstructing phi by iterating the recursion
// reproduces the exact transfer-matrix free energy
//   phi(K,h) = K + ln[ cosh h + sqrt(sinh^2 h + e^{-4K}) ].
// Headless and deterministic. Reference: Goldenfeld, Lectures on
// Phase Transitions and the RG, Ch. 9 (`goldenfeld`); Nelson and
// Fisher, Ann. Phys. 91, 226 (1975) (`nelson-fisher1975`).

// Numerically stable ln cosh.
export function logcosh(x) {
  const a = Math.abs(x);
  return a + Math.log1p(Math.exp(-2 * a)) - Math.LN2;
}

// One decimation step. Returns the renormalized couplings and the
// per-spin free-energy constant lnC.
export function rgStep(K, h) {
  const lp = logcosh(2 * K + h);
  const lm = logcosh(2 * K - h);
  const lh = logcosh(h);
  return {
    K: 0.25 * (lp + lm - 2 * lh),
    h: h + 0.5 * (lp - lm),
    lnC: Math.LN2 + 0.25 * (lp + lm) + 0.5 * lh,
  };
}

// RG trajectory: N decimation steps from (K0, h0).
export function rgFlow(K0, h0, N) {
  const pts = [{ K: K0, h: h0 }];
  let K = K0, h = h0;
  for (let n = 0; n < N; n += 1) {
    const r = rgStep(K, h);
    K = r.K; h = r.h;
    pts.push({ K, h });
  }
  return pts;
}

// Exact transfer-matrix free energy per spin, phi = ln(lambda_max),
// written so it does not overflow at large K.
export function exactFreeEnergy(K, h) {
  const sh = Math.sinh(h);
  return K + Math.log(Math.cosh(h) + Math.sqrt(sh * sh + Math.exp(-4 * K)));
}

// Free energy per spin reconstructed from the RG recursion:
// phi = sum_{n>=0} (1/2)^{n+1} lnC(K_n,h_n), iterating until the
// couplings reach the (0,0) sink where lnC -> ln2 and the remaining
// geometric tail sums exactly.
export function rgFreeEnergy(K0, h0, maxSteps = 200) {
  // phi(K0,h0) = sum w_n lnC(K_n,h_n) + w_last phi(K_last,h_last).
  // Once K ~ 0 the spins decouple and the remaining free energy is
  // exactly the independent-spin-in-field value phi = ln(2 cosh h),
  // which is also a fixed point of the recursion.
  let K = K0, h = h0, phi = 0, w = 1;
  for (let n = 0; n < maxSteps; n += 1) {
    if (K < 1e-13) { phi += w * (Math.LN2 + logcosh(h)); return phi; }
    const r = rgStep(K, h);
    w *= 0.5;
    phi += w * r.lnC;
    K = r.K; h = r.h;
  }
  phi += w * (Math.LN2 + logcosh(h));
  return phi;
}

// 1D Ising correlation length (lattice units): xi = -1 / ln tanh K.
export function correlationLength(K) {
  if (K <= 0) return 0;
  const t = Math.tanh(K);
  return t >= 1 ? Infinity : -1 / Math.log(t);
}

// Compactified coupling for plotting: u = tanh K maps [0, inf) -> [0, 1).
export function uOfK(K) { return Math.tanh(K); }
export function kOfU(u) { return u >= 1 ? Infinity : 0.5 * Math.log((1 + u) / (1 - u)); }
