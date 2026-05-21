// Exoplanet transit (DOM-free). A planet of radius R_p on a circular
// Keplerian orbit of semi-major axis a, period P, inclination i,
// crosses a limb-darkened stellar disc of radius R_s. The light
// curve is the unblocked, intensity-weighted integral over the
// stellar disc. Limb darkening uses the standard quadratic law
//
//   I(mu) / I(1) = 1 - u1 (1 - mu) - u2 (1 - mu)^2,
//
// with mu = cos(angle from disc centre) = sqrt(1 - (r/R_s)^2). The
// transit depth at central transit (no limb darkening) is exactly
// (R_p / R_s)^2; Kepler's third law T^2 = (4 pi^2 / G M_star) a^3
// is the orbital invariant. Engine, not a renderer: no DOM.
//
// References: Mandel and Agol, ApJ 580 (2002) L171; Seager and
// Mallen-Ornelas, ApJ 585 (2003) 1038; Kepler III, any mechanics
// textbook (Goldstein, Classical Mechanics, Ch. 3).

const G = 4 * Math.PI * Math.PI;    // a in AU, T in yr, M in Msun -> G=4pi^2

// Semi-major axis from Kepler's third law (a in AU, period in years,
// stellar mass in solar masses).
export function semiMajorAxis(period, Mstar = 1) {
  return Math.cbrt(G * Mstar * period * period / (4 * Math.PI * Math.PI));
}
export function periodFromAxis(a, Mstar = 1) {
  return Math.sqrt(4 * Math.PI * Math.PI * a * a * a / (G * Mstar));
}

// Quadratic limb-darkening intensity at r in [0, 1] (r = projected
// distance from disc centre, in units of R_s); returns I(mu)/I(1).
export function intensity(r, u1 = 0.4, u2 = 0.2) {
  if (r >= 1) return 0;
  const mu = Math.sqrt(1 - r * r);
  return 1 - u1 * (1 - mu) - u2 * (1 - mu) * (1 - mu);
}

// Build a polar integration grid for the stellar disc, with the
// limb-darkened intensity * area weight precomputed. Returns the
// arrays needed by transitFlux() so per-frame cost is just the mask.
export function makeTransit(opts = {}) {
  const Rs = opts.Rs ?? 1;
  const Rp = opts.Rp ?? 0.1;          // in units of Rs
  const a = opts.a ?? 0.1;            // in units of Rs
  const inc = opts.inc ?? Math.PI / 2; // edge-on
  const period = opts.period ?? 3.0;  // arbitrary time units
  const u1 = opts.u1 ?? 0.4, u2 = opts.u2 ?? 0.2;
  const Nr = opts.Nr ?? 160, Nphi = opts.Nphi ?? 220;
  const dr = 1 / Nr, dphi = 2 * Math.PI / Nphi;
  const Ipx = new Float64Array(Nr * Nphi);
  const xpx = new Float64Array(Nr * Nphi), ypx = new Float64Array(Nr * Nphi);
  let total = 0;
  for (let i = 0; i < Nr; i += 1) {
    const r = (i + 0.5) * dr;
    const I = intensity(r, u1, u2);
    const w = I * r * dr * dphi;          // area-weighted intensity
    for (let j = 0; j < Nphi; j += 1) {
      const phi = (j + 0.5) * dphi;
      const k = i * Nphi + j;
      Ipx[k] = w; xpx[k] = r * Math.cos(phi); ypx[k] = r * Math.sin(phi);
      total += w;
    }
  }
  return { Rs, Rp, a, inc, period, u1, u2, Nr, Nphi, Ipx, xpx, ypx, total, t: 0 };
}

// Planet sky-position at orbital phase t (in the same time units as
// period). Circular orbit; the orbit plane is tilted by (pi/2 - inc)
// from the line of sight; the line of sight is +z, so the sky
// coordinates are (x_orbit, y_orbit * sin inc) and the "in front"
// flag is true when the planet is on the near side of its orbit.
export function planetSkyPos(s, t) {
  const theta = 2 * Math.PI * (t % s.period) / s.period;
  const xo = s.a * Math.cos(theta), yo = s.a * Math.sin(theta);
  const sky_x = xo;
  const sky_y = yo * Math.cos(s.inc);   // foreshortening along the line of sight
  const z_los = yo * Math.sin(s.inc);   // depth toward the observer
  return { x: sky_x, y: sky_y, infront: z_los > 0, theta };
}

// Observed flux from the (star + planet) system at time t, in units of
// the unobscured stellar flux. Includes the standard primary transit
// (planet in front of star, blocked stellar light) AND the secondary
// eclipse (planet behind star, reflected planet light vanishes).
//
// Reflected-light model: Lambertian sphere with geometric albedo A_g
// (default 0.4, Jupiter-like). At phase angle alpha (star-planet-observer),
//   p(alpha) = (sin alpha + (pi - alpha) cos alpha) / pi
// is the Lambertian phase function, peaking at alpha = 0 (full phase,
// planet behind the star). Planet/star flux ratio:
//   F_p / F_s = A_g (R_p / a)^2 p(alpha).
// When the planet passes BEHIND the stellar disc (secondary eclipse),
// the reflected light is fully occulted and the flux drops back to 1.
export function transitFlux(s, t) {
  const P = planetSkyPos(s, t);
  const albedo = s.albedo ?? 0.4;
  // Phase angle: 0 at superior conjunction (planet farthest = full),
  // pi at inferior conjunction (planet closest = new). Using theta:
  // theta = 0 places planet at +x; observer is at +z. The line-of-sight
  // depth z_los = a sin theta sin inc. With sin inc > 0, far-side
  // corresponds to sin theta < 0 i.e. theta in (pi, 2 pi) (matches
  // !P.infront from planetSkyPos).
  // We use a phase angle defined by the cosine of the angle between
  // the planet-to-star vector and the planet-to-observer vector.
  // For an inclined orbit, this is cos alpha = -sin theta * sin inc,
  // mod foreshortening.
  const cosAlpha = -Math.sin(P.theta) * Math.sin(s.inc);
  const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));
  const phaseFn = (Math.sin(alpha) + (Math.PI - alpha) * Math.cos(alpha)) / Math.PI;
  const reflectMax = albedo * (s.Rp / Math.max(0.05, s.a)) * (s.Rp / Math.max(0.05, s.a));
  const reflectFlux = reflectMax * Math.max(0, phaseFn);
  // Distance of planet from the star centre on the sky plane.
  const d2 = P.x * P.x + P.y * P.y;
  if (!P.infront) {
    // Planet on far side. Secondary eclipse: planet sits behind the
    // stellar disc (d < 1 - R_p) so its reflected light is hidden.
    const occulted = d2 < (1 - s.Rp) * (1 - s.Rp);
    return 1 + (occulted ? 0 : reflectFlux);
  }
  // Near side. Primary transit if sky distance < 1 + R_p.
  if (d2 > (1 + s.Rp) * (1 + s.Rp)) return 1 + reflectFlux;
  let kept = 0;
  for (let k = 0; k < s.Ipx.length; k += 1) {
    const dx = s.xpx[k] - P.x, dy = s.ypx[k] - P.y;
    if (dx * dx + dy * dy >= s.Rp * s.Rp) kept += s.Ipx[k];
  }
  return kept / s.total + reflectFlux;
}
