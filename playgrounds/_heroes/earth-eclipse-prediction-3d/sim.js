// Headless physics for the Earth-Sun-Moon eclipse predictor. Computes
// the geometry of the Sun, Earth, and Moon in heliocentric coordinates,
// determines whether a solar or lunar eclipse occurs at any given time,
// and reports the configuration. Distances are normalized so 1 AU = 1.
// Reference: Meeus, Astronomical Algorithms, 2nd ed., Willmann-Bell
// 1998, Ch. 47 and 54 (`meeus1998`).

// Astronomical unit set to 1, geometry tuned so the Moon distance and
// inclination are exaggerated for visualization (real numbers below).
//
// Real numbers (relative to 1 AU):
//   Earth-Moon distance     = 384,400 km  / 1 AU   = 2.57e-3
//   Earth radius            = 6,378 km    / 1 AU   = 4.26e-5
//   Sun radius              = 696,000 km  / 1 AU   = 4.65e-3
//   Moon radius             = 1,737 km    / 1 AU   = 1.16e-5
//   Moon orbital inclination i_moon       = 5.145 deg
//
// For the renderer we scale up Moon distance ~ 100x and bodies ~ 5x
// so the visualization reads. The shadow-cone test uses the *actual*
// angular sizes so eclipse prediction stays physically correct.

export const REAL = {
  R_sun: 696000,                          // km
  R_earth: 6378,                          // km
  R_moon: 1737,                           // km
  d_em: 384400,                           // Earth-Moon (km)
  d_se: 149.6e6,                          // Sun-Earth (km)
  i_moon_rad: 5.145 * Math.PI / 180,      // Moon orbit incl. to ecliptic
  T_moon: 29.53,                          // synodic month, days
  T_earth: 365.25,                        // year, days
};

// Heliocentric positions in AU. Earth orbits in the xy plane; the Moon
// orbits Earth in a plane inclined by i_moon to the ecliptic, with the
// ascending node of the lunar orbit precessing slowly. For
// visualization simplicity we treat the lunar node as fixed and the
// Earth as on a circular orbit.
export function ephemeris(t_days) {
  const phi_earth = 2 * Math.PI * t_days / REAL.T_earth;
  const xE = Math.cos(phi_earth);          // 1 AU
  const yE = Math.sin(phi_earth);
  const zE = 0;
  // Moon: orbit around Earth at radius d_em/d_se AU, period T_moon, in
  // plane tilted by i_moon.
  const phi_moon = 2 * Math.PI * t_days / REAL.T_moon;
  const a_moon = REAL.d_em / REAL.d_se;
  // In Moon's orbital plane.
  const xMl = a_moon * Math.cos(phi_moon);
  const yMl = a_moon * Math.sin(phi_moon);
  // Tilt by i_moon about the x axis (lunar node along x); we also rotate
  // by the Earth-Sun angle so the Moon's node moves with Earth.
  const i = REAL.i_moon_rad;
  const xMt = xMl;
  const yMt = yMl * Math.cos(i);
  const zMt = yMl * Math.sin(i);
  // Place relative to Earth in heliocentric coords.
  const xM = xE + xMt;
  const yM = yE + yMt;
  const zM = zE + zMt;
  return { xE, yE, zE, xM, yM, zM, phi_earth, phi_moon };
}

// Eclipse detection: angular separations.
// Solar eclipse: the Sun-Earth and Moon-Earth vectors point in the
// same direction (Moon between Earth and Sun) with angular separation
// smaller than the Sun's angular radius from Earth + Moon's angular
// radius from Earth. The geometry is symmetric in the Moon's position
// crossing the ecliptic plane (z_M ~ 0).
// Lunar eclipse: Earth between Sun and Moon, similar condition but
// using Earth's shadow cone (umbra) projected to Moon's distance.
export function eclipseState(t_days) {
  const e = ephemeris(t_days);
  // Earth-Sun unit vector (from Earth, pointing to Sun = origin).
  const rES = Math.sqrt(e.xE * e.xE + e.yE * e.yE + e.zE * e.zE);
  const uxES = -e.xE / rES, uyES = -e.yE / rES, uzES = -e.zE / rES;
  // Earth-Moon unit vector.
  const dxEM = e.xM - e.xE, dyEM = e.yM - e.yE, dzEM = e.zM - e.zE;
  const rEM = Math.sqrt(dxEM * dxEM + dyEM * dyEM + dzEM * dzEM);
  const uxEM = dxEM / rEM, uyEM = dyEM / rEM, uzEM = dzEM / rEM;
  // Angle between (Earth -> Sun) and (Earth -> Moon).
  let cosTheta = uxES * uxEM + uyES * uyEM + uzES * uzEM;
  cosTheta = Math.max(-1, Math.min(1, cosTheta));
  const theta = Math.acos(cosTheta);
  // Angular radii from Earth.
  const r_sun_au = REAL.R_sun / REAL.d_se;
  const r_moon_au = REAL.R_moon / REAL.d_se;
  const r_earth_au = REAL.R_earth / REAL.d_se;
  const angSun = Math.asin(r_sun_au / rES);
  const angMoon = Math.asin(r_moon_au / rEM);
  // Solar eclipse: Moon close to Sun direction. Threshold = angSun + angMoon.
  const isSolar = theta < (angSun + angMoon) * 1.5;   // x1.5 catches near-misses
  // Lunar eclipse: Moon opposite the Sun (theta near pi).
  // Earth's umbra at the Moon: angular radius (R_earth - R_sun * d_em / d_se) / d_em.
  // Numerically: at full moon if angle Earth-Sun vs Earth-Moon ~ pi within
  // small angle.
  const isLunar = (Math.PI - theta) < (angMoon + 2 * r_earth_au / rEM) * 1.5;
  return { e, theta, angSun, angMoon, isSolar, isLunar, rES, rEM };
}

// Convenience: time march by step days, return a series of states.
export function predictNext(t0, kind = 'solar', maxDays = 1000, step = 0.5) {
  for (let t = t0 + step; t < t0 + maxDays; t += step) {
    const s = eclipseState(t);
    if (kind === 'solar' && s.isSolar) return { t, state: s };
    if (kind === 'lunar' && s.isLunar) return { t, state: s };
  }
  return null;
}
