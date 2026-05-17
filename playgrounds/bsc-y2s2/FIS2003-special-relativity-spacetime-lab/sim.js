// Special relativity in natural units (c = 1). The Lorentz boost
//   t' = gamma (t - beta x),  x' = gamma (x - beta t),
// leaves the interval s^2 = t^2 - x^2 invariant. A rod of rest length
// L0 measures L0/gamma; a moving clock runs slow by 1/gamma; the
// travelling twin on a round trip of coordinate length L at speed
// beta ages 2 L / (gamma beta) against the stay-home 2 L / beta.
// Velocities compose as (u + v)/(1 + u v) and never exceed c. Headless
// and deterministic. Reference: Taylor and Wheeler, Spacetime Physics
// (2nd ed.), Ch. 3-4; Eisberg and Resnick, Quantum Physics, Ch. 1.

export function gamma(beta) { return 1 / Math.sqrt(1 - beta * beta); }

// Boost an event [t, x] to a frame moving at beta.
export function boost(t, x, beta) {
  const g = gamma(beta);
  return [g * (t - beta * x), g * (x - beta * t)];
}

export function interval(t, x) { return t * t - x * x; }

export function contractedLength(L0, beta) { return L0 / gamma(beta); }

export function dilatedTime(properTau, beta) { return properTau * gamma(beta); }

// Relativistic velocity addition.
export function addVelocity(u, v) { return (u + v) / (1 + u * v); }

// Twin paradox: a round trip out to coordinate distance L and back at
// speed beta. Returns the stay-home elapsed time, the traveller proper
// time, and the age gap.
export function twinTrip(L, beta) {
  const home = 2 * L / beta;                 // coordinate time for the round trip
  const travel = home / gamma(beta);         // traveller proper time
  return { home, travel, gap: home - travel };
}

// Relativistic Doppler factor for a source approaching (sign +1) or
// receding (sign -1) at speed beta: f_obs / f_src.
export function dopplerFactor(beta, approaching = true) {
  return approaching
    ? Math.sqrt((1 + beta) / (1 - beta))
    : Math.sqrt((1 - beta) / (1 + beta));
}

// Worldline of a uniformly moving particle: x(t) = x0 + beta t, sampled
// for the Minkowski panel.
export function worldline(x0, beta, tMax, n = 64) {
  const pts = [];
  for (let i = 0; i <= n; i += 1) { const t = (i / n) * tMax; pts.push([t, x0 + beta * t]); }
  return pts;
}

// Lines of simultaneity (constant t') and constant x' in the unprimed
// frame, for the boost-grid panel: a t'=const line has slope beta in
// the (x, t) plane; an x'=const line has slope 1/beta.
export function simultaneityLine(beta, tPrime, xRange) {
  // t = beta x + tPrime / gamma  (from t' = gamma(t - beta x) = const)
  const g = gamma(beta);
  return xRange.map(x => [x, beta * x + tPrime / g]);
}
