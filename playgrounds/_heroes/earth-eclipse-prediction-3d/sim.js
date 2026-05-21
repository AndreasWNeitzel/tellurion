// Headless data for the Earth eclipse-prediction playground.
//
// This playground draws upcoming solar eclipses on a 2D world map and
// animates the umbra moving along the central path. The data backbone is
// a curated table of upcoming eclipses with their key Besselian-derived
// parameters (date, type, greatest-eclipse coordinates, gamma, magnitude,
// duration of totality, and a polyline of central-path points) extracted
// from NASA's Five-Millennium Canon of Solar Eclipses (Espenak and
// Meeus, NASA Technical Publication 2006-214141; eclipse.gsfc.nasa.gov).
//
// References:
//   Meeus, Astronomical Algorithms, 2nd ed., Willmann-Bell 1998
//     (`meeus1998`), Ch. 7 (Julian Day), Ch. 22 (Sidereal Time),
//     Ch. 25 (Solar coordinates), Ch. 47 (Moon position), Ch. 49
//     (Phases of the Moon), Ch. 54 (Solar eclipses).
//   Espenak and Meeus, Five Millennium Canon of Solar Eclipses,
//     NASA TP-2006-214141. Paths transcribed below.
//   IERS Conventions 2010. GMST formula.

// =========================================================================
// JULIAN DATE UTILITIES (Meeus Ch. 7)
// =========================================================================
export function dateToJD(year, month, day, hour = 0, min = 0, sec = 0) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  const D_frac = day + (hour + min / 60 + sec / 3600) / 24;
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + D_frac + B - 1524.5;
}

export function jdToDate(jd) {
  const Z = Math.floor(jd + 0.5);
  const F = (jd + 0.5) - Z;
  let A;
  if (Z < 2299161) { A = Z; }
  else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const dayWithFrac = B - D - Math.floor(30.6001 * E) + F;
  const month = E < 14 ? E - 1 : E - 13;
  const year = month > 2 ? C - 4716 : C - 4715;
  const day = Math.floor(dayWithFrac);
  const dayFrac = dayWithFrac - day;
  const totalSec = dayFrac * 86400;
  let hour = Math.floor(totalSec / 3600);
  let min = Math.floor((totalSec - hour * 3600) / 60);
  let sec = Math.floor(totalSec - hour * 3600 - min * 60);
  return { year, month, day, hour, min, sec };
}

// Format YYYY-MM-DD.
export function formatDate(d) {
  const m = String(d.month).padStart(2, '0');
  const dd = String(d.day).padStart(2, '0');
  return `${d.year}-${m}-${dd}`;
}
export function formatUT(d) {
  const h = String(d.hour).padStart(2, '0');
  const m = String(d.min).padStart(2, '0');
  return `${h}:${m} UT`;
}

// =========================================================================
// NEW-MOON PREDICTION (Meeus Ch. 49 Eq. 49.1). Returns JDE in TT.
// k = 0 is the new moon on 2000-01-06 18:14 TT.
// =========================================================================
export function newMoonJDE(k) {
  const T = k / 1236.85;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  let JDE = 2451550.09766 + 29.530588861 * k
    + 0.00015437 * T2 - 0.000000150 * T3 + 0.00000000073 * T4;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const TO_RAD = Math.PI / 180;
  const M = ((2.5534 + 29.10535670 * k - 0.0000014 * T2 - 0.00000011 * T3) % 360 + 360) % 360;
  const Mp = ((201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4) % 360 + 360) % 360;
  const F = ((160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4) % 360 + 360) % 360;
  const Omega = ((124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3) % 360 + 360) % 360;
  const Mr = M * TO_RAD, Mpr = Mp * TO_RAD, Fr = F * TO_RAD, Or = Omega * TO_RAD;
  // Meeus Table 49.A for new moon corrections (main terms).
  let dt = 0;
  dt += -0.40720 * Math.sin(Mpr);
  dt += +0.17241 * E * Math.sin(Mr);
  dt += +0.01608 * Math.sin(2 * Mpr);
  dt += +0.01039 * Math.sin(2 * Fr);
  dt += +0.00739 * E * Math.sin(Mpr - Mr);
  dt += -0.00514 * E * Math.sin(Mpr + Mr);
  dt += +0.00208 * E * E * Math.sin(2 * Mr);
  dt += -0.00111 * Math.sin(Mpr - 2 * Fr);
  dt += -0.00057 * Math.sin(Mpr + 2 * Fr);
  dt += +0.00056 * E * Math.sin(2 * Mpr + Mr);
  dt += -0.00042 * Math.sin(3 * Mpr);
  dt += +0.00042 * E * Math.sin(Mr + 2 * Fr);
  dt += +0.00038 * E * Math.sin(Mr - 2 * Fr);
  dt += -0.00024 * E * Math.sin(2 * Mpr - Mr);
  dt += -0.00017 * Math.sin(Or);
  JDE += dt;
  return { JDE, E, M: Mr, Mp: Mpr, F: Fr, Omega: Or, F_deg: F };
}

// Eclipse possibility test (Meeus Eq. 54.1 simplified):
// An eclipse can occur at this new moon if F is near 0 or 180.
export function newMoonHasEclipse(k) {
  const nm = newMoonJDE(k);
  const F_deg_centered = nm.F_deg > 180 ? nm.F_deg - 360 : nm.F_deg;
  // |F| < 13.9 degrees is the upper limit for any solar eclipse.
  return Math.abs(F_deg_centered) < 13.9 || Math.abs(F_deg_centered - 180) < 13.9
       || Math.abs(F_deg_centered + 180) < 13.9;
}

// Estimate k for a given JD.
export function kForJD(jd) {
  return Math.round((jd - 2451550.09766) / 29.530588861);
}

// =========================================================================
// HARDCODED UPCOMING ECLIPSES (NASA / Espenak-Meeus catalogue).
//
// Each entry: id (date), label, type (total/annular/hybrid/partial/penumbral),
// max_jd (Julian date of greatest eclipse), max_ut ("HH:MM"), max_lat,
// max_lon (deg), duration_s, magnitude, gamma, path: list of [t_frac, lat, lon]
// triplets sampled along the central path (t_frac=0 at first contact P1,
// 0.5 at greatest, 1.0 at last contact P4); path_width_km, region.
//
// Coordinates are transcribed from NASA TP-2006-214141 (Espenak-Meeus
// Five-Millennium Canon). Path samples are coarsely interpolated to keep
// the data tractable.
// =========================================================================

export const SOLAR_ECLIPSES = [
  {
    id: '2025-09-21', label: 'Partial Solar (2025 Sep 21)',
    type: 'partial', max_ut: '19:43',
    max_jd: 2461040.32, max_lat: -60.9, max_lon: -153.5,
    magnitude: 0.855, gamma: -1.066,
    duration_s: 0, path_width_km: 0,
    region: 'New Zealand, Antarctica, South Pacific',
    path: [],   // partial: no central path on Earth's surface.
  },
  {
    id: '2026-02-17', label: 'Annular Solar (2026 Feb 17)',
    type: 'annular', max_ut: '12:13',
    max_jd: 2461189.01, max_lat: -64.7, max_lon: 86.8,
    magnitude: 0.963, gamma: -0.974,
    duration_s: 145, path_width_km: 612,
    region: 'Antarctica',
    path: [
      [0.10, -68.0,  53.0], [0.25, -66.5,  67.0], [0.40, -65.5,  78.0],
      [0.50, -64.7,  86.8], [0.60, -63.5,  95.0], [0.75, -61.0, 106.0],
      [0.90, -57.0, 117.0],
    ],
  },
  {
    id: '2026-08-12', label: 'Total Solar (2026 Aug 12)',
    type: 'total', max_ut: '17:46',
    max_jd: 2461365.24, max_lat: 65.2, max_lon: -25.2,
    magnitude: 1.039, gamma: 0.898,
    duration_s: 132, path_width_km: 294,
    region: 'Greenland, Iceland, Spain',
    path: [
      [0.10,  82.0, -180.0], [0.22,  80.0, -130.0], [0.30,  76.0,  -90.0],
      [0.38,  72.0,  -60.0], [0.45,  68.0,  -40.0], [0.50,  65.2,  -25.2],
      [0.58,  60.0,  -15.0], [0.66,  52.0,   -8.0], [0.74,  44.0,   -3.0],
      [0.82,  38.0,   -0.5], [0.90,  33.0,    1.0],
    ],
  },
  {
    id: '2027-02-06', label: 'Annular Solar (2027 Feb 06)',
    type: 'annular', max_ut: '16:00',
    max_jd: 2461543.17, max_lat: -31.2, max_lon: -48.5,
    magnitude: 0.928, gamma: -0.295,
    duration_s: 469, path_width_km: 184,
    region: 'Chile, Argentina, Atlantic, Cote d\'Ivoire',
    path: [
      [0.10, -36.0,  -90.0], [0.22, -34.0,  -75.0], [0.30, -33.0,  -65.0],
      [0.40, -32.0,  -56.0], [0.50, -31.2,  -48.5], [0.58, -29.0,  -39.0],
      [0.66, -25.0,  -27.0], [0.74, -20.0,  -15.0], [0.82, -12.0,   -3.0],
      [0.90,  -2.0,    8.0], [0.95,   5.0,   13.0],
    ],
  },
  {
    id: '2027-08-02', label: 'Total Solar (2027 Aug 02)',
    type: 'total', max_ut: '10:07',
    max_jd: 2461720.92, max_lat: 25.5, max_lon: 33.2,
    magnitude: 1.079, gamma: 0.142,
    duration_s: 383, path_width_km: 258,
    region: 'Spain, Morocco, Egypt, Saudi Arabia, Yemen, Somalia',
    path: [
      [0.10,  43.0, -16.0], [0.18,  39.0,  -8.0], [0.26,  36.0,   0.0],
      [0.34,  32.0,   9.0], [0.42,  29.0,  20.0], [0.50,  25.5,  33.2],
      [0.58,  22.0,  43.0], [0.66,  17.0,  52.0], [0.74,  12.0,  58.0],
      [0.82,   6.0,  62.0], [0.90,   0.0,  65.0],
    ],
  },
  {
    id: '2028-01-26', label: 'Annular Solar (2028 Jan 26)',
    type: 'annular', max_ut: '15:08',
    max_jd: 2461897.13, max_lat: -2.1, max_lon: -51.8,
    magnitude: 0.921, gamma: 0.391,
    duration_s: 612, path_width_km: 323,
    region: 'Ecuador, Brazil, Atlantic, Spain, Portugal',
    path: [
      [0.10, -10.0, -100.0], [0.20, -6.0, -85.0], [0.30, -4.0, -70.0],
      [0.40, -3.0, -60.0], [0.50, -2.1, -51.8], [0.60, 1.0, -42.0],
      [0.70, 8.0, -32.0], [0.80, 20.0, -18.0], [0.90, 32.0, -8.0],
    ],
  },
  {
    id: '2028-07-22', label: 'Total Solar (2028 Jul 22)',
    type: 'total', max_ut: '02:56',
    max_jd: 2462074.62, max_lat: -15.6, max_lon: 126.7,
    magnitude: 1.056, gamma: -0.392,
    duration_s: 310, path_width_km: 230,
    region: 'Australia, New Zealand',
    path: [
      [0.10,  -3.0, 105.0], [0.20,  -7.0, 113.0], [0.30, -10.0, 118.0],
      [0.40, -13.0, 122.0], [0.50, -15.6, 126.7], [0.60, -19.0, 132.0],
      [0.70, -25.0, 138.0], [0.80, -33.0, 145.0], [0.90, -42.0, 156.0],
    ],
  },
  {
    id: '2030-06-01', label: 'Annular Solar (2030 Jun 01)',
    type: 'annular', max_ut: '06:29',
    max_jd: 2462754.77, max_lat: 56.5, max_lon: 80.1,
    magnitude: 0.944, gamma: 0.566,
    duration_s: 322, path_width_km: 247,
    region: 'Algeria, Tunisia, Greece, Turkey, Russia, China, Japan',
    path: [
      [0.10, 30.0, -8.0], [0.18, 36.0, 5.0], [0.26, 40.0, 18.0],
      [0.34, 45.0, 32.0], [0.42, 50.0, 50.0], [0.50, 56.5, 80.1],
      [0.58, 58.0, 105.0], [0.66, 56.0, 130.0], [0.74, 50.0, 152.0],
      [0.82, 40.0, 168.0],
    ],
  },
  {
    id: '2030-11-25', label: 'Total Solar (2030 Nov 25)',
    type: 'total', max_ut: '06:51',
    max_jd: 2462931.79, max_lat: -28.6, max_lon: 71.1,
    magnitude: 1.047, gamma: -0.342,
    duration_s: 217, path_width_km: 174,
    region: 'Botswana, S Africa, Madagascar, Indian Ocean, Australia',
    path: [
      [0.10, -19.0, 18.0], [0.20, -22.0, 28.0], [0.30, -25.0, 40.0],
      [0.40, -27.0, 55.0], [0.50, -28.6, 71.1], [0.60, -29.0, 90.0],
      [0.70, -28.0, 110.0], [0.80, -26.0, 128.0], [0.90, -22.0, 142.0],
    ],
  },
  {
    id: '2033-03-30', label: 'Total Solar (2033 Mar 30)',
    type: 'total', max_ut: '18:02',
    max_jd: 2463786.25, max_lat: 70.6, max_lon: -158.7,
    magnitude: 1.046, gamma: 0.967,
    duration_s: 162, path_width_km: 781,
    region: 'Russia (Chukotka), Alaska, Arctic Ocean',
    path: [
      [0.20, 68.0, 160.0], [0.30, 70.0, 175.0], [0.40, 71.0, -175.0],
      [0.50, 70.6, -158.7], [0.60, 69.0, -140.0], [0.70, 66.0, -122.0],
    ],
  },
  {
    id: '2034-03-20', label: 'Total Solar (2034 Mar 20)',
    type: 'total', max_ut: '10:18',
    max_jd: 2464141.93, max_lat: 16.1, max_lon: 22.2,
    magnitude: 1.046, gamma: 0.292,
    duration_s: 248, path_width_km: 159,
    region: 'Nigeria, Chad, Sudan, Egypt, Saudi Arabia, Iran',
    path: [
      [0.10,   5.0, -10.0], [0.18,   7.0,  -2.0], [0.26,   9.0,   6.0],
      [0.34,  11.0,  12.0], [0.42,  13.5,  17.0], [0.50,  16.1,  22.2],
      [0.58,  19.0,  28.0], [0.66,  22.0,  36.0], [0.74,  26.0,  45.0],
      [0.82,  30.0,  55.0], [0.90,  34.0,  66.0],
    ],
  },
  {
    id: '2035-09-02', label: 'Total Solar (2035 Sep 02)',
    type: 'total', max_ut: '01:55',
    max_jd: 2464672.58, max_lat: 38.5, max_lon: 109.9,
    magnitude: 1.032, gamma: 0.347,
    duration_s: 165, path_width_km: 134,
    region: 'China, Korea, Japan, Pacific',
    path: [
      [0.10,  46.0,  80.0], [0.20,  44.0,  88.0], [0.30,  42.0,  96.0],
      [0.40,  40.0, 103.0], [0.50,  38.5, 109.9], [0.60,  36.0, 119.0],
      [0.70,  33.0, 130.0], [0.80,  28.0, 144.0], [0.90,  22.0, 162.0],
    ],
  },
  {
    id: '2037-07-13', label: 'Total Solar (2037 Jul 13)',
    type: 'total', max_ut: '02:40',
    max_jd: 2465320.61, max_lat: -25.9, max_lon: 138.0,
    magnitude: 1.041, gamma: -0.119,
    duration_s: 234, path_width_km: 199,
    region: 'Australia, New Zealand',
    path: [
      [0.10, -8.0, 116.0], [0.20, -13.0, 122.0], [0.30, -18.0, 128.0],
      [0.40, -22.0, 133.0], [0.50, -25.9, 138.0], [0.60, -30.0, 145.0],
      [0.70, -36.0, 153.0], [0.80, -42.0, 165.0], [0.90, -48.0, 180.0],
    ],
  },
];

export const LUNAR_ECLIPSES = [
  {
    id: '2025-09-07', label: 'Total Lunar (2025 Sep 07)', type: 'total',
    max_ut: '18:11', magnitude: 1.367, duration_totality_min: 82,
    region: 'Visible: Asia, Australia, Indian Ocean, E Africa',
  },
  {
    id: '2026-03-03', label: 'Total Lunar (2026 Mar 03)', type: 'total',
    max_ut: '11:34', magnitude: 1.151, duration_totality_min: 58,
    region: 'Visible: Pacific, North America, E Asia, Australia',
  },
  {
    id: '2026-08-28', label: 'Partial Lunar (2026 Aug 28)', type: 'partial',
    max_ut: '04:13', magnitude: 0.927, duration_totality_min: 0,
    region: 'Visible: Americas, Pacific, Australasia',
  },
  {
    id: '2028-12-31', label: 'Total Lunar (2028 Dec 31)', type: 'total',
    max_ut: '16:53', magnitude: 1.244, duration_totality_min: 71,
    region: 'Visible: Europe, Africa, W Asia',
  },
  {
    id: '2029-06-26', label: 'Total Lunar (2029 Jun 26)', type: 'total',
    max_ut: '03:23', magnitude: 1.844, duration_totality_min: 102,
    region: 'Visible: Americas, Africa, W Europe',
  },
  {
    id: '2032-04-25', label: 'Total Lunar (2032 Apr 25)', type: 'total',
    max_ut: '15:14', magnitude: 1.193, duration_totality_min: 65,
    region: 'Visible: Asia, Australia, E Africa',
  },
];

// =========================================================================
// PATH INTERPOLATION. Given a path of (t_frac, lat, lon) points, return
// the (lat, lon) at any t_frac in [0, 1] using piecewise-linear interp.
// Returns null if outside the path bounds.
// =========================================================================
export function pathPositionAt(path, t_frac) {
  if (!path || path.length === 0) return null;
  if (t_frac <= path[0][0]) return { lat: path[0][1], lon: path[0][2] };
  if (t_frac >= path[path.length - 1][0]) {
    return { lat: path[path.length - 1][1], lon: path[path.length - 1][2] };
  }
  for (let i = 0; i < path.length - 1; i++) {
    if (t_frac >= path[i][0] && t_frac <= path[i + 1][0]) {
      const f = (t_frac - path[i][0]) / (path[i + 1][0] - path[i][0]);
      return {
        lat: path[i][1] * (1 - f) + path[i + 1][1] * f,
        lon: path[i][2] * (1 - f) + path[i + 1][2] * f,
      };
    }
  }
  return null;
}

// =========================================================================
// EQUIRECTANGULAR PROJECTION. Map (lat, lon) to (x, y) on a canvas of
// given dimensions, with (0,0) at top-left, lon=-180 at x=0 and
// lon=+180 at x=W, lat=+90 at y=0 and lat=-90 at y=H.
// =========================================================================
export function projectEquirect(lat, lon, W, H) {
  return {
    x: ((lon + 180) / 360) * W,
    y: ((90 - lat) / 180) * H,
  };
}

// Visibility-region helper: does the given (lat, lon) lie within
// `radius_deg` of any path point? Used for "click on map → was it visible?".
export function visibilityAtPoint(eclipse, lat, lon) {
  if (!eclipse.path || eclipse.path.length === 0) return { visible: false, dist: Infinity, magnitude: 0 };
  let minDist = Infinity;
  for (const p of eclipse.path) {
    const dlat = lat - p[1];
    let dlon = lon - p[2];
    dlon = ((dlon % 360) + 540) % 360 - 180;   // O(1) wrap; never spins
    const d = Math.sqrt(dlat * dlat + dlon * dlon * Math.cos(lat * Math.PI / 180) ** 2);
    if (d < minDist) minDist = d;
  }
  // path_width_km / (Earth radius * deg-per-rad) gives angular half-width.
  const pathHalfDeg = (eclipse.path_width_km || 0) * 0.5 / 111.32;
  const totalityWindow = minDist < pathHalfDeg;
  // Penumbra zone: roughly 3000-6000 km wide centered on the path.
  const penumbraHalfDeg = 30;       // rough; partial eclipse visible within ~30 deg.
  const partial = minDist < penumbraHalfDeg;
  let magnitude = 0;
  if (totalityWindow) magnitude = eclipse.magnitude;
  else if (partial) magnitude = Math.max(0, eclipse.magnitude * (1 - (minDist - pathHalfDeg) / (penumbraHalfDeg - pathHalfDeg)));
  return { visible: partial, totality: totalityWindow, dist: minDist, magnitude };
}

// =========================================================================
// SIMPLIFIED COASTLINE OUTLINES. Each entry is a list of (lon, lat)
// points forming a closed polygon for a major landmass. Coordinates are
// approximations sufficient for an at-a-glance world map.
// =========================================================================
export const COASTLINES = [
  // North America (Alaska through Central America).
  [
    [-165, 67], [-155, 71], [-141, 70], [-128, 70], [-110, 73], [-95, 72], [-80, 72], [-70, 80],
    [-60, 83], [-50, 83], [-40, 80], [-30, 73], [-50, 70], [-65, 60], [-65, 50], [-55, 48],
    [-60, 45], [-66, 44], [-70, 42], [-75, 38], [-77, 34], [-81, 31], [-82, 27], [-80, 25],
    [-85, 30], [-90, 29], [-95, 28], [-97, 27], [-94, 18], [-90, 16], [-87, 13], [-79, 9],
    [-77, 8], [-83, 14], [-95, 18], [-105, 22], [-110, 28], [-117, 32], [-122, 37], [-125, 45],
    [-124, 48], [-130, 52], [-135, 57], [-150, 60], [-163, 60], [-167, 64], [-165, 67],
  ],
  // South America.
  [
    [-78, 12], [-72, 12], [-60, 8], [-52, 5], [-50, 0], [-46, -2], [-38, -8], [-35, -8],
    [-39, -16], [-42, -22], [-48, -27], [-58, -36], [-62, -39], [-65, -44], [-70, -55],
    [-67, -54], [-72, -50], [-73, -45], [-75, -42], [-72, -38], [-72, -30], [-71, -25],
    [-71, -18], [-75, -14], [-80, -8], [-80, 0], [-78, 8], [-78, 12],
  ],
  // Africa.
  [
    [-17, 21], [-15, 17], [-12, 14], [-9, 12], [-5, 5], [3, 6], [6, 4], [9, 4], [12, 2],
    [10, -3], [13, -7], [13, -16], [18, -19], [25, -34], [32, -29], [35, -25], [40, -20],
    [40, -16], [42, -12], [43, -4], [48, 2], [51, 11], [49, 12], [44, 11], [42, 14],
    [39, 17], [37, 20], [33, 22], [25, 22], [19, 30], [10, 33], [0, 34], [-8, 32], [-12, 28],
    [-15, 23], [-17, 21],
  ],
  // Europe (excluding Russia east of Urals; rough outline).
  [
    [-9, 36], [-9, 42], [-5, 43], [-2, 48], [2, 50], [6, 52], [8, 56], [3, 59], [-3, 58],
    [-5, 56], [-8, 55], [-6, 50], [-3, 51], [-1, 60], [10, 63], [20, 70], [30, 70],
    [33, 67], [40, 65], [50, 65], [55, 60], [55, 51], [42, 50], [37, 47], [35, 42],
    [28, 41], [22, 40], [18, 40], [15, 38], [12, 38], [8, 39], [3, 42], [-2, 39], [-9, 36],
  ],
  // Asia.
  [
    [55, 51], [60, 55], [70, 60], [80, 62], [90, 60], [100, 55], [110, 50], [120, 50],
    [130, 50], [135, 50], [142, 55], [148, 60], [152, 65], [160, 70], [170, 70], [180, 68],
    [170, 60], [165, 56], [155, 55], [142, 45], [142, 38], [136, 35], [128, 32], [120, 22],
    [108, 21], [100, 14], [97, 10], [102, 4], [108, 2], [110, -8], [120, -8], [113, 0],
    [105, 5], [98, 18], [88, 22], [78, 18], [75, 8], [78, 5], [73, 15], [70, 22],
    [60, 25], [50, 27], [44, 30], [40, 37], [44, 42], [50, 45], [55, 51],
  ],
  // Australia.
  [
    [113, -22], [114, -26], [115, -33], [118, -35], [128, -32], [136, -35], [140, -38],
    [148, -38], [153, -28], [146, -20], [142, -10], [136, -12], [128, -15], [122, -16],
    [114, -22], [113, -22],
  ],
  // Greenland.
  [
    [-45, 60], [-50, 62], [-50, 70], [-55, 76], [-46, 82], [-20, 83], [-13, 78], [-20, 70],
    [-30, 65], [-40, 62], [-45, 60],
  ],
  // Antarctica (very stylized).
  [
    [-180, -78], [-150, -76], [-120, -75], [-90, -74], [-60, -72], [-30, -73], [0, -72],
    [30, -69], [60, -68], [90, -66], [120, -67], [150, -73], [180, -78],
  ],
];
