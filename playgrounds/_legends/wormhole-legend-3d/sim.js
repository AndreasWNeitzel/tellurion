// Headless physics for the Wormhole Legend. Four modes:
//   Overview, Traversal, Embedding, Exotic.
// Wraps the shared Ellis / Morris-Thorne CPU engine.
//
// References:
//   Morris and Thorne, Am. J. Phys. 56 (1988) 395.
//   Ellis, J. Math. Phys. 14 (1973) 104.
//   Misner, Thorne, Wheeler, Gravitation, Box 13.

export {
  circumferentialR, embedZ, flareOut, criticalImpact,
  nullNorm, tracePhoton, properDistance, tidalScale,
} from '../../../shared/js/engine/wormhole-cpu.js';

// =========================================================================
// EXOTIC matter (Morris-Thorne stress-energy). For the Ellis drainhole
// at l = 0 (the throat), the energy density required is
//   rho_throat = -1 / (8 pi G b_0^2)   (c = 1, geometric units).
// Away from the throat the density falls off; we use the closed form
//   rho(l) = -b_0^2 / (8 pi G (b_0^2 + l^2)^2).
// =========================================================================
export function exoticDensity(l, b0 = 1) {
  const r2 = b0 * b0 + l * l;
  return -b0 * b0 / (8 * Math.PI * r2 * r2);   // in units G = c = 1
}

// Cumulative ANEC integral along a null ray through the throat (z = 0):
//   I(l) = integral from -|l| to l of T_ab k^a k^b d lambda.
// For Ellis, T_ab k^a k^b along a radial null ray equals rho(l)
// (after the null tangent normalisation), so the running ANEC is
// the cumulative integral of rho(l) dl. This is NEGATIVE (NEC
// violation) and approaches a finite limit as l -> infty.
export function anecIntegral(l, b0 = 1, N = 200) {
  // Integrate from -L to l using Simpson; pick L = max(|l|, 5 b0).
  const L = Math.max(Math.abs(l), 5 * b0);
  const a = -L, b = l;
  const h = (b - a) / N;
  let s = exoticDensity(a, b0) + exoticDensity(b, b0);
  for (let i = 1; i < N; i++) {
    const x = a + i * h;
    s += (i % 2 ? 4 : 2) * exoticDensity(x, b0);
  }
  return s * h / 3;
}

// Energy in Planck-scale units required at the throat, scaled to a
// 1-metre throat: |rho| * V ~ 1 / (8 pi G b_0^2) * (4/3 pi b_0^3)
// = b_0 / (6 G). With G = 6.67e-11, b_0 = 1 m, this is ~ 2.5e9 J/m
// (a few GJ per metre of throat). Real Casimir plates yield ~ 1e-15
// of this per m^2; clearly impractical.
export function exoticEnergyDensity_SI(b0_m) {
  const G = 6.6743e-11;
  return -1 / (8 * Math.PI * G * b0_m * b0_m);   // J / m^3
}

// =========================================================================
// TRAVERSAL animation. Smooth ease-in-out l(t) from +L to -L.
// =========================================================================
export function traversalEll(t_norm, b0 = 1, L = 3) {
  // t_norm in [0, 1]; ease in-out.
  const u = t_norm * t_norm * (3 - 2 * t_norm);
  return L * b0 * (1 - 2 * u);
}

// =========================================================================
// DETERMINISTIC RNG.
// =========================================================================
export function makeRng(seed = 0xC0FFEE) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
