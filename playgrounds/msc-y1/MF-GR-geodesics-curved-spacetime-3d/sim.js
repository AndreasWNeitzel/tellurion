// Geodesics in curved spacetime: Schwarzschild and Kerr black-hole
// geometry (reusing the gate-tested shared CPU engine) plus FLRW
// cosmology. Units G = c = M = 1 for the black-hole sector; H0 and
// c explicit for the cosmology sector.
// Carroll, Spacetime and Geometry; Hartle, Gravity; Shapiro and
// Teukolsky Ch. 12; Hubble 1929; Friedmann 1922.

export {
  schwarzschildRadius, photonSphereSchwarzschild, bCritSchwarzschild,
  iscoKerr, ergosphereOuter, horizonOuter, deflectionWeakField,
  deflectionAngleSchwarzschild,
} from '../../../shared/js/engine/schwarzschild-kerr-cpu.js';

import { bCritSchwarzschild } from '../../../shared/js/engine/schwarzschild-kerr-cpu.js';

// Schwarzschild equatorial null geodesic via the orbit equation
// u'' + u = 3 u^2 (u = M/r, M = 1). The first integral
//   I = (u')^2 + u^2 - 2 u^3
// is conserved and equals 1/b^2 (b the impact parameter); this is the
// "E, L conserved" check (b = L/E). Returns the trajectory and the
// maximum relative drift of I along it.
export function nullGeodesic(b, { dphi = 1e-3, maxSteps = 60000 } = {}) {
  const I0 = 1 / (b * b);
  let u = 1e-6;                                          // start far away
  let du = Math.sqrt(Math.max(0, I0 - u * u + 2 * u * u * u)); // inbound (u increasing)
  let phi = 0;
  const pts = [];
  let maxDrift = 0, captured = false;
  const acc = (uu) => 3 * uu * uu - uu;                  // u'' = 3u^2 - u
  for (let i = 0; i < maxSteps; i += 1) {
    pts.push({ phi, u, r: 1 / u });
    // RK4 on (u, du)
    const k1u = du, k1d = acc(u);
    const k2u = du + 0.5 * dphi * k1d, k2d = acc(u + 0.5 * dphi * k1u);
    const k3u = du + 0.5 * dphi * k2d, k3d = acc(u + 0.5 * dphi * k2u);
    const k4u = du + dphi * k3d, k4d = acc(u + dphi * k3u);
    u += dphi / 6 * (k1u + 2 * k2u + 2 * k3u + k4u);
    du += dphi / 6 * (k1d + 2 * k2d + 2 * k3d + k4d);
    phi += dphi;
    const I = du * du + u * u - 2 * u * u * u;
    maxDrift = Math.max(maxDrift, Math.abs(I - I0) / I0);
    if (u >= 0.5) { captured = true; break; }            // r <= 2 M: horizon crossed
    if (u <= 0 && du < 0) break;                          // escaped back to infinity
    if (phi > 8 * Math.PI) break;
  }
  return { pts, captured, maxDrift, I0, b };
}

// Is a photon with impact parameter b captured by the Schwarzschild
// black hole? Captured iff b < b_crit = 3 sqrt(3) M.
export function isCaptured(b) { return b < bCritSchwarzschild(); }

// Timelike circular-orbit specific energy and angular momentum
// (Schwarzschild, units M): E = (1-2/r)/sqrt(1-3/r),
// L = sqrt(r)/sqrt(1-3/r). Stable for r > 6 (ISCO).
export function circularOrbit(r) {
  const f = 1 - 3 / r;
  return { E: (1 - 2 / r) / Math.sqrt(f), L: Math.sqrt(r) / Math.sqrt(f), stable: r > 6 };
}

// FLRW cosmology (flat, matter + Lambda; Om + OL = 1). c and H0 in
// consistent units (default c = 1).
export const C_LIGHT = 1;
export function hubbleParameter(a, H0, Om, OL) {
  return H0 * Math.sqrt(Om / (a * a * a) + OL);
}
// Hubble law: proper recession velocity v = H0 * d (exact in FLRW for
// the instantaneous expansion rate).
export function hubbleLaw(d, H0) { return H0 * d; }
export function hubbleRadius(H0, c = C_LIGHT) { return c / H0; }      // where v = c
export function redshiftToScale(z) { return 1 / (1 + z); }
export function scaleToRedshift(a) { return 1 / a - 1; }

// Particle horizon: comoving distance light has travelled since a=0,
// d_p = c integral_0^1 da / (a^2 H(a)). Finite for matter+Lambda.
export function particleHorizon(H0, Om, OL, c = C_LIGHT, N = 20000) {
  let s = 0;
  const aMin = 1e-7;
  for (let i = 0; i <= N; i += 1) {
    const a = aMin + (1 - aMin) * i / N;
    const f = 1 / (a * a * hubbleParameter(a, H0, Om, OL));
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    s += w * f;
  }
  return c * s * ((1 - aMin) / N) / 3;
}

// Scale factor a(t): integrate da/dt = a H(a) from a tiny a. Returns
// arrays {t, a} up to a = aMax.
export function scaleFactorHistory(H0, Om, OL, aMax = 3, steps = 4000) {
  const a = [], t = [];
  let aa = 1e-3, tt = 0;
  const dt = 1 / (H0 * steps) * 30;
  for (let i = 0; i < steps && aa < aMax; i += 1) {
    a.push(aa); t.push(tt);
    const da = aa * hubbleParameter(aa, H0, Om, OL) * dt;
    aa += da; tt += dt;
  }
  a.push(aa); t.push(tt);
  return { t, a };
}

// Comoving distance to redshift z: c/H0 integral_0^z dz'/E(z'),
// E = sqrt(Om(1+z)^3 + OL).
export function comovingDistance(z, H0, Om, OL, c = C_LIGHT, N = 4000) {
  let s = 0;
  for (let i = 0; i <= N; i += 1) {
    const zz = z * i / N;
    const E = Math.sqrt(Om * (1 + zz) ** 3 + OL);
    const w = (i === 0 || i === N) ? 1 : (i % 2 ? 4 : 2);
    s += w / E;
  }
  return (c / H0) * z * (s / N) / 3;
}
