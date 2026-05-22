// sim.js
// Conjugate Beta-Binomial update.
//   prior: Beta(alpha0, beta0)
//   data:  k heads in n flips
//   posterior: Beta(alpha0 + k, beta0 + n - k)

// log Beta function via log gamma (Stirling-corrected). We only need it for
// PDF normalization with moderate (alpha, beta) up to a few hundred.

function logGamma(x) {
  // Lanczos approximation (Numerical Recipes 6.1.1). Good to 1e-10 for x > 0.5.
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = c[0];
  for (let i = 1; i < g + 2; i += 1) a += c[i] / (x + i);
  const t = x + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

export function logBeta(a, b) {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

export function betaPdf(theta, a, b) {
  if (theta <= 0 || theta >= 1) return 0;
  return Math.exp((a - 1) * Math.log(theta) + (b - 1) * Math.log(1 - theta) - logBeta(a, b));
}

export function betaMean(a, b)     { return a / (a + b); }
export function betaVariance(a, b) { return a * b / ((a + b) * (a + b) * (a + b + 1)); }

// Given prior Beta(a0, b0) and data (k heads in n flips), return posterior Beta(a, b).
export function posteriorParams({ a0, b0, k, n }) {
  return { a: a0 + k, b: b0 + (n - k) };
}

// 95 percent equal-tailed credible interval via Beta-CDF inverse (Newton iter).
// betaCdf is computed via the regularized incomplete beta function; we use a
// numerical integration fallback for simplicity.
function betaCdf(theta, a, b) {
  if (theta <= 0) return 0;
  if (theta >= 1) return 1;
  // Simpson's rule on log-domain to avoid overflow at extreme parameters.
  const N = 2000;
  const dt = theta / N;
  let sum = 0;
  for (let i = 0; i <= N; i += 1) {
    const t = i * dt;
    const w = (i === 0 || i === N) ? 1 : (i % 2 === 0 ? 2 : 4);
    sum += w * betaPdf(t, a, b);
  }
  return sum * dt / 3;
}

export function credibleInterval(a, b, mass = 0.95) {
  const tailMass = (1 - mass) / 2;
  function invCdf(target) {
    let lo = 0, hi = 1;
    for (let it = 0; it < 60; it += 1) {
      const mid = 0.5 * (lo + hi);
      if (betaCdf(mid, a, b) < target) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
  }
  return { lo: invCdf(tailMass), hi: invCdf(1 - tailMass) };
}

export function credibleInterval95(a, b) {
  return credibleInterval(a, b, 0.95);
}
