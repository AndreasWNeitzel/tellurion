// Reusable invariant checkers. Used by playground-level invariants.test.mjs files
// to avoid copy-pasting the same drift / autocorrelation / ESS code per playground.

// Track an energy time series and report relative drift, monotonic vs oscillatory pattern,
// and the maximum excursion. Returns a structured result for assertion against thresholds.
export function trackEnergyDrift(samples) {
  if (!Array.isArray(samples) || samples.length < 2) {
    throw new Error('trackEnergyDrift needs at least 2 samples.');
  }
  const e0 = samples[0];
  if (e0 === 0) throw new Error('Initial energy is zero; relative drift undefined.');
  let maxAbsDrift = 0;
  let monotonicSign = 0;       // +1 increasing, -1 decreasing, 0 oscillatory
  let prev = samples[0];
  let increasing = true, decreasing = true;
  for (let i = 1; i < samples.length; i += 1) {
    const drift = (samples[i] - e0) / e0;
    if (Math.abs(drift) > maxAbsDrift) maxAbsDrift = Math.abs(drift);
    if (samples[i] < prev) increasing = false;
    if (samples[i] > prev) decreasing = false;
    prev = samples[i];
  }
  if (increasing && !decreasing) monotonicSign = +1;
  else if (decreasing && !increasing) monotonicSign = -1;
  else monotonicSign = 0;

  return { maxAbsRelDrift: maxAbsDrift, monotonicSign, samples: samples.length };
}

// Bound check helper: returns {pass, observed, threshold, margin}.
export function assertWithin(observed, threshold, label = 'invariant') {
  const pass = Math.abs(observed) <= threshold;
  return { pass, observed, threshold, margin: threshold - Math.abs(observed), label };
}
