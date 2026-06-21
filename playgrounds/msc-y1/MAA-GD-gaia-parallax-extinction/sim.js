// sim.js
// Gaia parallaxes, distances, and the inversion bias. A measured parallax pi is
// a noisy estimate, pi ~ Normal(1/d, sigma). Naively inverting it, d = 1/pi, is
// biased and skewed once the fractional error f = sigma/pi is not small, because
// the transformation is nonlinear and the noise can even push pi negative. The
// Bayesian cure is a posterior
//   p(d | pi, sigma) proportional to prior(d) * Normal(pi; 1/d, sigma),
// with a sensible distance prior. We use the exponentially-decreasing
// space-density (EDSD) prior of Bailer-Jones (2015), prior(d) ~ d^2 exp(-d/L),
// which is normalisable and tames the high-error tail; a flat prior is offered
// for comparison. Distances are in kpc, parallaxes in mas (d_kpc = 1/pi_mas).
//
// Extinction: dust dims a star by A_G magnitudes, so the absolute magnitude is
//   M_G = G - 5 log10(d_pc) + 5 - A_G,
// and an error in the distance (or a neglected A_G) misplaces the star on the HR
// diagram.
//
// References: Bailer-Jones 2015, PASP 127, 994; Luri et al. 2018, A&A 616, A9;
// Gaia Collaboration 2023, A&A 674, A1.

const SQRT2PI = Math.sqrt(2 * Math.PI);

export function naiveDistanceKpc(plxMas) { return 1 / plxMas; }            // d = 1/pi (kpc, pi in mas)
export function fractionalError(plxMas, sigmaMas) { return sigmaMas / plxMas; }

// Gaussian parallax likelihood at true distance d (kpc): pi_model = 1/d.
export function likelihood(plxObs, sigma, dKpc) {
  const piModel = 1 / dKpc;
  const z = (plxObs - piModel) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * SQRT2PI);
}

export function priorFlat() { return 1; }
export function priorEDSD(dKpc, L) { return dKpc > 0 ? dKpc * dKpc * Math.exp(-dKpc / L) : 0; }

// Numerical posterior on a distance grid. Returns {d[], p[] (normalised density),
// mode, median, lo, hi (16th/84th percentiles), dMax}.
export function posterior(plxObs, sigma, { mode = 'edsd', L = 1.35, n = 700 } = {}) {
  // Grid adapted to where the posterior has support, so a razor-sharp likelihood
  // (a well-measured nearby star) is resolved as well as a broad one. The
  // likelihood lives near d in [1/(pi+5s), 1/(pi-5s)]; when the noise crosses
  // zero (pi <= 5s) the upper distance is set by the prior instead.
  const piHi = plxObs + 5 * sigma, piLo = plxObs - 5 * sigma;
  const dMin = Math.max(1e-4, 1 / piHi);
  let dMax;
  if (piLo > 1e-4) dMax = 1 / piLo;                       // likelihood bounds the upper distance
  else dMax = mode === 'flat' ? Math.min(60, 30 / plxObs) : 9 * L;   // prior bounds it
  dMax = Math.min(60, Math.max(dMax, dMin * 1.5));
  const dd = (dMax - dMin) / (n - 1);
  const d = new Array(n), praw = new Array(n);
  let norm = 0;
  for (let i = 0; i < n; i += 1) {
    const di = dMin + i * dd;
    const pr = mode === 'flat' ? priorFlat() : priorEDSD(di, L);
    const v = pr * likelihood(plxObs, sigma, di);
    d[i] = di; praw[i] = v; norm += v * dd;
  }
  if (norm <= 0) norm = 1;
  const p = praw.map((v) => v / norm);
  // mode
  let mi = 0; for (let i = 1; i < n; i += 1) if (p[i] > p[mi]) mi = i;
  // cumulative for percentiles
  let cum = 0, median = d[n - 1], lo = d[0], hi = d[n - 1];
  let gotLo = false, gotMed = false, gotHi = false;
  for (let i = 0; i < n; i += 1) {
    cum += p[i] * dd;
    if (!gotLo && cum >= 0.16) { lo = d[i]; gotLo = true; }
    if (!gotMed && cum >= 0.5) { median = d[i]; gotMed = true; }
    if (!gotHi && cum >= 0.84) { hi = d[i]; gotHi = true; }
  }
  return { d, p, mode: d[mi], median, lo, hi, dMax, dMin };
}

// One Monte Carlo draw of the naive estimator: pi ~ Normal(pi_obs, sigma),
// d = 1/pi (kpc). Returns null when the draw is non-positive (the parallax noise
// pushed it through zero, where 1/pi is meaningless), which is itself the lesson.
export function sampleNaive(plxObs, sigma, u1, u2) {
  const piSample = plxObs + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  if (piSample <= 0) return null;
  return 1 / piSample;
}

export function distanceModulus(dKpc) { return 5 * Math.log10(dKpc * 1000) - 5; }
export function absMagG(G, dKpc, aG) { return G - distanceModulus(dKpc) - (aG || 0); }
