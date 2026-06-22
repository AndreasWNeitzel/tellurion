// sim.js
// Fraunhofer diffraction from a grating of N slits of width a and spacing d. The
// intensity is the single-slit envelope times the N-slit interference factor,
//   I(theta) = [sin(beta)/beta]^2 [sin(N alpha)/(N sin alpha)]^2,
//   beta = pi a sin(theta)/lambda,  alpha = pi d sin(theta)/lambda,
// normalized so the central principal maximum is 1. Principal maxima sit at the
// grating equation d sin(theta) = m lambda; between each adjacent pair there are
// N-1 zeros and N-2 weak secondary maxima, and the principal peaks sharpen as 1/N,
// giving the resolving power R = m N.
//
// Reference: Hecht, Optics, 5th ed., Sec. 10.2.7; Born and Wolf, Principles of
// Optics, 7th ed., Sec. 8.6.

export function envelope(beta) { if (Math.abs(beta) < 1e-9) return 1; const s = Math.sin(beta) / beta; return s * s; }

// the normalized N-slit factor in [0,1], = 1 at the principal maxima (alpha = m pi).
export function gratingFactor(alpha, N) {
  const sa = Math.sin(alpha);
  if (Math.abs(sa) < 1e-9) return 1; // principal maximum limit
  const s = Math.sin(N * alpha) / (N * sa); return s * s;
}

// intensity vs s = sin(theta), normalized to 1 at s = 0.
export function intensity(s, N, d, a, lambda) {
  const alpha = Math.PI * d * s / lambda, beta = Math.PI * a * s / lambda;
  return envelope(beta) * gratingFactor(alpha, N);
}

// the orders m with a principal maximum on the screen (|m lambda / d| <= 1).
export function orders(d, lambda) { const out = []; const mmax = Math.floor(d / lambda); for (let m = -mmax; m <= mmax; m += 1) out.push({ m, s: m * lambda / d }); return out; }

export function resolvingPower(m, N) { return Math.abs(m) * N; }

// approximate map from wavelength (micrometres) to an sRGB colour for display.
export function wavelengthRGB(lamUm) {
  const w = lamUm * 1000; let r = 0, g = 0, b = 0;
  if (w < 440) { r = -(w - 440) / (440 - 380); b = 1; } else if (w < 490) { g = (w - 440) / (490 - 440); b = 1; }
  else if (w < 510) { g = 1; b = -(w - 510) / (510 - 490); } else if (w < 580) { r = (w - 510) / (580 - 510); g = 1; }
  else if (w < 645) { r = 1; g = -(w - 645) / (645 - 580); } else { r = 1; }
  return [Math.round(255 * Math.max(0, Math.min(1, r))), Math.round(255 * Math.max(0, Math.min(1, g))), Math.round(255 * Math.max(0, Math.min(1, b)))];
}
