// Second-harmonic generation in a chi(2) crystal, plane-wave slowly
// varying envelope (Armstrong, Bloembergen, Ducuing and Pershan 1962;
// Boyd, Nonlinear Optics, 3rd ed., Academic Press 2008, Ch. 2).
//
// Undepleted pump (small conversion), arbitrary phase mismatch
// dk = k_2w - 2 k_w:
//   I_2w(z) = (gamma z)^2 sinc^2(dk z / 2),   sinc(x) = sin x / x,
// so at perfect phase matching (dk = 0) it grows as z^2, and for
// dk != 0 it oscillates with coherence length L_c = pi / |dk| (period
// 2 L_c, never exceeding (gamma / (dk/2))^2 = (2 gamma / dk)^2).
//
// Perfect phase matching with pump depletion has the exact closed
// form (normalised total power 1):
//   I_w(z)  = sech^2(z / L_NL),   I_2w(z) = tanh^2(z / L_NL),
// L_NL = 1 / gamma, so I_w + I_2w = 1 identically (energy /
// Manley-Rowe conservation) and the conversion efficiency
// eta = tanh^2(z / L_NL) < 1 for all z, approaching 1 monotonically.
//
// Dispersion / phase matching uses the beta-BBO Sellmeier equations
// (Eimerl, Davis, Velsko, Graham and Zalkin, J. Appl. Phys. 62, 1968,
// 1987). Closed-form, deterministic, no RNG.

export function sinc(x) { return Math.abs(x) < 1e-12 ? 1 : Math.sin(x) / x; }

// Undepleted-pump second-harmonic intensity (pump intensity 1).
export function shgUndepleted(z, dk, gamma) {
  const s = sinc(dk * z / 2);
  return (gamma * z) * (gamma * z) * s * s;
}

// Coherence length L_c = pi / |dk| (infinite at perfect matching).
export function coherenceLength(dk) {
  return Math.abs(dk) < 1e-12 ? Infinity : Math.PI / Math.abs(dk);
}

// Perfect-phase-match depleted solution, normalised so I_w + I_2w = 1.
const sech = (x) => 1 / Math.cosh(x);
export function nonlinearLength(gamma) { return 1 / gamma; }
export function pumpIntensity(z, gamma) { const s = sech(z / nonlinearLength(gamma)); return s * s; }
export function shgDepleted(z, gamma) { const t = Math.tanh(z / nonlinearLength(gamma)); return t * t; }
export function conversionEfficiency(z, gamma) { return shgDepleted(z, gamma); }

// beta-BBO Sellmeier (Eimerl et al. 1987), wavelength lambda in micron.
export function nO(lambda) {
  const l2 = lambda * lambda;
  return Math.sqrt(2.7359 + 0.01878 / (l2 - 0.01822) - 0.01354 * l2);
}
export function nE(lambda) {
  const l2 = lambda * lambda;
  return Math.sqrt(2.3753 + 0.01224 / (l2 - 0.01667) - 0.01516 * l2);
}
// Extraordinary index at propagation angle theta (rad) to the optic axis.
export function nETheta(theta, lambda) {
  const c = Math.cos(theta), s = Math.sin(theta);
  const no = nO(lambda), ne = nE(lambda);
  return 1 / Math.sqrt(c * c / (no * no) + s * s / (ne * ne));
}

// Collinear wave-vector mismatch (rad per micron) for type-I (ooe)
// SHG at angle theta: dk = (4 pi / lambdaFW) [ n_e(theta, lambdaFW/2)
// - n_o(lambdaFW) ].
export function deltaK(lambdaFW, theta) {
  return (4 * Math.PI / lambdaFW) * (nETheta(theta, lambdaFW / 2) - nO(lambdaFW));
}

// Type-I phase-matching angle: solve n_e(theta, lambdaFW/2) =
// n_o(lambdaFW). Returns radians, or NaN if no solution exists.
export function phaseMatchAngleTypeI(lambdaFW) {
  const noFW = nO(lambdaFW);
  const noSH = nO(lambdaFW / 2), neSH = nE(lambdaFW / 2);
  const num = 1 / (noFW * noFW) - 1 / (noSH * noSH);
  const den = 1 / (neSH * neSH) - 1 / (noSH * noSH);
  const s2 = num / den;
  if (s2 < 0 || s2 > 1) return NaN;
  return Math.asin(Math.sqrt(s2));
}

// Sample I_2w(z) / I_w(z) over [0, zEnd] for the sweep. depleted=true
// uses the exact phase-matched tanh^2/sech^2 pair; otherwise the
// undepleted sinc^2 form at mismatch dk.
export function shgSeries(zEnd, steps, { dk = 0, gamma = 1, depleted = false } = {}) {
  const z = new Float64Array(steps + 1);
  const i2 = new Float64Array(steps + 1);
  const i1 = new Float64Array(steps + 1);
  for (let i = 0; i <= steps; i += 1) {
    const zz = zEnd * i / steps;
    z[i] = zz;
    if (depleted) { i2[i] = shgDepleted(zz, gamma); i1[i] = pumpIntensity(zz, gamma); }
    else { i2[i] = shgUndepleted(zz, dk, gamma); i1[i] = 1; }
  }
  return { z, i1, i2 };
}
