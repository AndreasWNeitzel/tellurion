// The Galton board and the central limit theorem. A ball dropped through R rows of pegs
// makes R independent left/right choices (right with probability p), so the bin it lands
// in, the number of rights, follows the binomial distribution Binomial(R, p). For large R
// the binomial approaches a Gaussian of mean Rp and variance Rp(1-p), the central limit
// theorem in its simplest concrete form. Reference: Press et al., Numerical Recipes, 3rd
// ed., Ch. 7 (random numbers and the central limit theorem).

// Binomial coefficient C(R,k) by a stable product (no large factorials).
export function binomialCoeff(R, k) {
  if (k < 0 || k > R) return 0;
  k = Math.min(k, R - k);
  let c = 1;
  for (let i = 0; i < k; i += 1) c = (c * (R - i)) / (i + 1);
  return c;
}

// Binomial probability mass P(k rights in R rows) = C(R,k) p^k (1-p)^(R-k).
export function binomialPMF(k, R, p) {
  if (k < 0 || k > R) return 0;
  return binomialCoeff(R, k) * Math.pow(p, k) * Math.pow(1 - p, R - k);
}

export function binomialMean(R, p) { return R * p; }
export function binomialVariance(R, p) { return R * p * (1 - p); }

// Gaussian (normal) density, the large-R limit of the binomial.
export function gaussianPDF(x, mean, variance) { return Math.exp(-((x - mean) * (x - mean)) / (2 * variance)) / Math.sqrt(2 * Math.PI * variance); }

// Drop one ball: R independent Bernoulli(p) choices, returns the landing bin (number of rights).
export function dropBall(R, p, rng) { let k = 0; for (let i = 0; i < R; i += 1) if (rng() < p) k += 1; return k; }

// Total-variation distance between an empirical histogram (counts) and the binomial PMF.
export function totalVariation(counts, R, p) {
  let total = 0; for (let k = 0; k <= R; k += 1) total += counts[k] || 0;
  if (total === 0) return 1;
  let tv = 0;
  for (let k = 0; k <= R; k += 1) tv += Math.abs((counts[k] || 0) / total - binomialPMF(k, R, p));
  return 0.5 * tv;
}
