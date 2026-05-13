// Effective sample size and integrated autocorrelation time for MCMC traces.
// Reference: Geyer (1992) "Practical Markov Chain Monte Carlo" via Gelman BDA3 Ch. 11.5.

// Returns { tau, ess } for a 1D trace using initial monotone sequence estimator.
export function autocorrelation(trace) {
  const n = trace.length;
  if (n < 4) throw new Error('Need at least 4 samples for autocorrelation.');
  const mean = trace.reduce((a, b) => a + b, 0) / n;
  const dev = trace.map(x => x - mean);
  const c0 = dev.reduce((a, b) => a + b * b, 0) / n;
  if (c0 === 0) return { tau: 1, ess: n };

  const maxLag = Math.min(n - 1, Math.floor(n / 4));
  const rho = new Float64Array(maxLag + 1);
  rho[0] = 1;
  for (let k = 1; k <= maxLag; k += 1) {
    let s = 0;
    for (let i = 0; i < n - k; i += 1) s += dev[i] * dev[i + k];
    rho[k] = s / ((n - k) * c0);
  }

  // Initial monotone sequence: sum pairs (rho[2k] + rho[2k+1]) while still positive and decreasing
  let tau = 1;
  let prevPair = Infinity;
  for (let k = 0; k + 1 <= maxLag; k += 2) {
    const pair = rho[k] + rho[k + 1];
    if (pair <= 0) break;
    if (pair > prevPair) break;
    tau += 2 * pair;
    prevPair = pair;
  }
  // Subtract the k=0 self-pair counted above
  tau -= 1;
  if (tau < 1) tau = 1;
  const ess = n / tau;
  return { tau, ess };
}
