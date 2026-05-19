// Morris-Thorne traversable wormhole (DOM-free engine), the Ellis /
// Bronnikov drainhole special case with zero tidal forces:
//
//   ds^2 = -dt^2 + d l^2 + (b0^2 + l^2) dOmega^2 ,
//
// where l is the proper radial distance (l in (-inf, inf), the two
// universes are l > 0 and l < 0), b0 is the throat radius and the
// circumferential radius is r(l) = sqrt(b0^2 + l^2) with a minimum
// r = b0 at the throat l = 0. The equatorial slice embeds in 3D as
//
//   r(l) = sqrt(b0^2 + l^2),   z(l) = b0 * asinh(l / b0),
//
// the classic two-funnel surface. A null geodesic with energy E and
// angular momentum L has
//
//   (dl/dlam)^2 = E^2 - L^2 / (b0^2 + l^2),
//   dphi/dlam   = L / (b0^2 + l^2),
//
// so a photon traverses to the other universe iff it has no turning
// point, i.e. |L/E| < b0 (impact parameter below the throat radius);
// otherwise it scatters back. The null norm
// -E^2 + (dl/dlam)^2 + (b0^2+l^2)(dphi/dlam)^2 is exactly zero and is
// the invariant gate. Pedagogically this is a GEOMETRY explorer:
// a real traversable wormhole would need exotic (negative-energy)
// matter that may not exist; the engine makes no claim it does.
//
// References: Morris & Thorne, Am. J. Phys. 56 (1988) 395; Ellis,
// J. Math. Phys. 14 (1973) 104; Misner, Thorne & Wheeler,
// Gravitation, Box 13.

export function circumferentialR(ell, b0 = 1) {
  return Math.sqrt(b0 * b0 + ell * ell);
}

// Embedding height of the equatorial slice (each sign of l is one
// universe; z is antisymmetric, the two funnels).
export function embedZ(ell, b0 = 1) {
  return b0 * Math.asinh(ell / b0);
}

// Flare-out condition at the throat: d^2 r / d z^2 > 0 there. With
// r(z) parametrised by l, at l = 0 the circumferential radius has a
// strict minimum, so the surface flares out. Returns the numeric
// second derivative (must be > 0).
export function flareOut(b0 = 1) {
  const h = 1e-4 * b0;
  const rOf = (ll) => circumferentialR(ll, b0);
  const zOf = (ll) => embedZ(ll, b0);
  // central differences in l, then chain to d^2r/dz^2 at l = 0
  const rp = (rOf(h) - rOf(-h)) / (2 * h);             // dr/dl ~ 0 at throat
  const rpp = (rOf(h) - 2 * rOf(0) + rOf(-h)) / (h * h);
  const zp = (zOf(h) - zOf(-h)) / (2 * h);             // dz/dl = 1 at throat
  const zpp = (zOf(h) - 2 * zOf(0) + zOf(-h)) / (h * h);
  // d2r/dz2 = (r'' z' - r' z'') / z'^3
  return (rpp * zp - rp * zpp) / (zp * zp * zp);
}

// Impact parameter at the throat below which a photon traverses.
export function criticalImpact(b0 = 1) { return b0; }

export function nullNorm(ell, ldot, phidot, E, b0 = 1) {
  return -E * E + ldot * ldot + (b0 * b0 + ell * ell) * phidot * phidot;
}

// Integrate a null geodesic from l0 (on the +universe, l0 > 0) inward.
// b is the impact parameter (L = b, E = 1). Returns the (l, phi) path,
// the outcome ('traverse' to the other universe, or 'scatter' back),
// the closest approach radius, and the max drift of the null norm.
export function tracePhoton(opts) {
  const b0 = opts.b0 ?? 1;
  const E = 1;
  const b = opts.b;                      // impact parameter, L = b * E
  const L = b * E;
  const dlam = opts.dlam ?? 0.01;
  const maxLam = opts.maxLam ?? 400;
  let ell = opts.ell0 ?? 30 * b0;
  let phi = 0;
  // start moving inward: dl/dlam < 0
  let ldot = -Math.sqrt(Math.max(0, E * E - L * L / (b0 * b0 + ell * ell)));
  const r2 = (l) => b0 * b0 + l * l;
  const lacc = (l) => L * L * l / (r2(l) * r2(l));     // d^2 l / dlam^2
  let outcome = 'scatter', minR = circumferentialR(ell, b0), maxDrift = 0;
  const ls = [], ps = [];
  for (let n = 0; n < maxLam / dlam; n += 1) {
    ls.push(ell); ps.push(phi);
    minR = Math.min(minR, circumferentialR(ell, b0));
    const phidot = L / r2(ell);
    maxDrift = Math.max(maxDrift, Math.abs(nullNorm(ell, ldot, phidot, E, b0)));
    // RK4 on (ell, ldot); phi integrated from L/r^2
    const k1l = ldot, k1v = lacc(ell);
    const k2l = ldot + 0.5 * dlam * k1v, k2v = lacc(ell + 0.5 * dlam * k1l);
    const k3l = ldot + 0.5 * dlam * k2v, k3v = lacc(ell + 0.5 * dlam * k2l);
    const k4l = ldot + dlam * k3v, k4v = lacc(ell + dlam * k3l);
    ell += (dlam / 6) * (k1l + 2 * k2l + 2 * k3l + k4l);
    ldot += (dlam / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    phi += dlam * (L / r2(ell));
    if (ell < -20 * b0) { outcome = 'traverse'; break; }   // reached the far universe
    if (ell > 31 * b0 && ldot > 0) { outcome = 'scatter'; break; } // came back
  }
  return { ls, ps, outcome, minR, maxDrift, b0, b };
}

// Proper radial distance from the throat is just |l| (by the metric).
export function properDistance(ell) { return Math.abs(ell); }

// A simple tidal-stretch proxy a traveller feels: the radial tidal
// scale ~ |d^2 r / d l^2| = b0^2 / (b0^2 + l^2)^{3/2}, peaking at the
// throat. (Ellis is tidal-free along the worldline; this is the
// geometric curvature scale used for the readout.)
export function tidalScale(ell, b0 = 1) {
  return (b0 * b0) / Math.pow(b0 * b0 + ell * ell, 1.5);
}
