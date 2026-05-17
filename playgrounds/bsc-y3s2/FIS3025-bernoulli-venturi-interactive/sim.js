// Closed-form steady incompressible flow in a horizontal variable-area
// pipe (a Venturi). Continuity Q = A(x) v(x) = const and Bernoulli
// p(x) + 1/2 rho v(x)^2 = const are exact algebra, not a simulation,
// so the invariants hold to round-off and the run is deterministic.
// No DOM. Reference: Tritton, Physical Fluid Dynamics, 2nd ed., ch. 5
// (`tritton`); Batchelor, An Introduction to Fluid Dynamics, sec. 3.5
// (`batchelor1967`).

// Normalised pipe of unit length. Area profile: a smooth cosine
// constriction. A(0) = A(1) = 1 (inlet area), minimum A = throat at
// x = 1/2 with A_throat = ratio (0 < ratio <= 1).
export function pipeArea(x, ratio) {
  const dip = (1 - ratio) * 0.5 * (1 + Math.cos(2 * Math.PI * (x - 0.5)));
  return 1 - dip;                                  // 1 at the ends, `ratio` at the throat
}

// Continuity: v = Q / A. Q is the volumetric flow rate (A_inlet = 1,
// so Q equals the inlet speed v0).
export function velocity(Q, A) { return Q / A; }

// Bernoulli (horizontal pipe, no gravity term): p = p_total - 1/2 rho v^2.
export function pressure(pTotal, rho, v) { return pTotal - 0.5 * rho * v * v; }

// The Bernoulli constant B = p + 1/2 rho v^2 (= p_total everywhere
// for an inviscid steady flow). Sampling it anywhere must give the
// same value; the relative spread is the headline invariant.
export function bernoulliConstant(pTotal, rho, Q, x, ratio) {
  const A = pipeArea(x, ratio);
  const v = velocity(Q, A);
  const p = pressure(pTotal, rho, v);
  return p + 0.5 * rho * v * v;
}

// Sample n stations and return the relative spread of the Bernoulli
// constant and of the flux A*v (both must be ~0).
export function diagnostics(pTotal, rho, Q, ratio, n = 200) {
  let bMin = Infinity, bMax = -Infinity, fMin = Infinity, fMax = -Infinity;
  for (let i = 0; i < n; i += 1) {
    const x = i / (n - 1);
    const A = pipeArea(x, ratio);
    const v = velocity(Q, A);
    const B = pressure(pTotal, rho, v) + 0.5 * rho * v * v;
    const F = A * v;
    if (B < bMin) bMin = B; if (B > bMax) bMax = B;
    if (F < fMin) fMin = F; if (F > fMax) fMax = F;
  }
  const bMean = 0.5 * (bMin + bMax), fMean = 0.5 * (fMin + fMax);
  return {
    bernoulliSpread: bMean !== 0 ? (bMax - bMin) / Math.abs(bMean) : bMax - bMin,
    fluxSpread: fMean !== 0 ? (fMax - fMin) / Math.abs(fMean) : fMax - fMin,
  };
}

// Thin-airfoil Bernoulli lift cartoon: a speed ratio r = v_top/v_bottom
// over a chord gives a pressure difference Dp = 1/2 rho (v_top^2 -
// v_bottom^2) and lift per unit span L = Dp * chord (sign: faster top
// => lower pressure => upward lift).
export function airfoilLift(rho, vBottom, speedRatio, chord) {
  const vTop = vBottom * speedRatio;
  const dp = 0.5 * rho * (vTop * vTop - vBottom * vBottom);
  return dp * chord;                                // > 0 = upward
}
