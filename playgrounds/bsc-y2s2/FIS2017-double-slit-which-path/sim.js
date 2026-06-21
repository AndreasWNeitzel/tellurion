// sim.js
// The double-slit experiment and complementarity. Particles pass two slits of
// separation d and width a (wavelength lambda) and land on a screen one at a
// time, building up the pattern. The intensity at angle theta is the single-slit
// envelope times the two-slit fringes,
//   I(theta) = env(theta) * (1 + V cos(2 alpha)) / 2,
//   alpha = pi d sin(theta) / lambda,   env = (sin(beta)/beta)^2,  beta = pi a sin(theta)/lambda,
// where V is the fringe visibility. Acquiring which-path information of
// distinguishability D washes the fringes out: by the complementarity relation
// (Englert 1996) V = sqrt(1 - D^2), so D = 0 gives full fringes (V = 1, the
// usual cos^2 pattern) and D = 1 gives the bare single-slit envelope (V = 0).
//
// Reference: Feynman Lectures on Physics, Vol. III, Ch. 1; Englert 1996, PRL 77,
// 2154 (the duality relation).

export function alphaPhase(d, lam, theta) { return Math.PI * d * Math.sin(theta) / lam; }
export function betaPhase(a, lam, theta) { return Math.PI * a * Math.sin(theta) / lam; }
export function envelope(a, lam, theta) { const b = betaPhase(a, lam, theta); return Math.abs(b) < 1e-9 ? 1 : Math.pow(Math.sin(b) / b, 2); }

export function visibility(D) { return Math.sqrt(Math.max(0, 1 - D * D)); }

// Normalised intensity (0..1) at angle theta for which-path distinguishability D.
export function intensity(d, a, lam, theta, D) {
  return envelope(a, lam, theta) * (1 + visibility(D) * Math.cos(2 * alphaPhase(d, lam, theta))) / 2;
}

// Central fringe spacing on a screen at distance L (small angle): dy = lam L / d.
export function fringeSpacing(d, lam, L) { return lam * L / d; }

// Rejection-sample a detection angle from I(theta) over [-thetaMax, thetaMax].
export function sampleDetection(d, a, lam, D, thetaMax, rng) {
  for (let k = 0; k < 400; k += 1) {
    const th = (rng() * 2 - 1) * thetaMax;
    if (rng() < intensity(d, a, lam, th, D)) return th;
  }
  return 0;
}
