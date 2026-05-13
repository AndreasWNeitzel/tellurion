// sim.js
// Binary Symmetric Channel (BSC) capacity:
//
//   C(p) = 1 - H(p),
//
// where p is the bit-flip probability and H(p) = -p log2(p) - (1-p) log2(1-p)
// is the binary entropy. C(p) = 0 at p = 0.5 (channel is useless when bit
// flips are random); C(p) = 1 at p = 0 and p = 1.
//
// Reference: Cover and Thomas, Elements of Information Theory Ch. 7
// (`cover-thomas`).
//
// We also include a Monte Carlo BSC simulation that transmits N bits with
// flip probability p and measures empirical bit error rate, plus the
// repetition-code BER for codes of length n (decoded by majority vote).

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

export function binaryEntropy(p) {
  if (p <= 0 || p >= 1) return 0;
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
}

export function capacityBSC(p) {
  return 1 - binaryEntropy(p);
}

// Repetition code of length n with majority-vote decoding error probability:
// P_e(n, p) = sum_{k > n/2} C(n, k) p^k (1-p)^(n-k)
function comb(n, k) {
  let r = 1;
  for (let i = 1; i <= k; i += 1) r = r * (n - i + 1) / i;
  return r;
}
export function repetitionCodeError(n, p) {
  let s = 0;
  for (let k = Math.ceil((n + 1) / 2); k <= n; k += 1) s += comb(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  return s;
}

// Simulate the BSC: send N bits, count flips.
export function simulateBSC({ N = 10_000, p = 0.1, seed = DEFAULT_SEED } = {}) {
  const rng = makeRng(seed);
  let flips = 0;
  for (let i = 0; i < N; i += 1) if (rng() < p) flips += 1;
  return { N, flips, ber: flips / N };
}
