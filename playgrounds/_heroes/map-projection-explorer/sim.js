// Headless map-projection mathematics for the map-projection-explorer
// hero. Every projection is a forward map from geographic coordinates
// (longitude, latitude) in radians to planar (x, y) in projection
// units, or null where the point is not representable (the far
// hemisphere of an azimuthal projection, the poles of Mercator).
//
// Distortion is measured with Tissot's indicatrix, derived from the
// numerical Jacobian of the forward map expressed in an orthonormal
// basis on the sphere. This is general: it works for any projection
// without a hand-derived metric.
//
// References:
//   Snyder, Map Projections: A Working Manual, USGS PP 1395, 1987
//     (`snyder1987`) for every forward formula and the Robinson table.
//   Tissot, Memoire sur la representation des surfaces, 1881, for the
//     indicatrix; see Snyder Ch. 4 for the working equations.

const HALF_PI = Math.PI / 2;
const SQRT2 = Math.SQRT2;

function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

// ---- Spherical rotation -------------------------------------------------
// Recentre the sphere so that geographic (lambda0, phi0) moves to the
// projection origin (0, 0). Used both to spin the globe under the
// pointer and to give the azimuthal projections their viewpoint.
export function rotate(lon, lat, lambda0, phi0) {
  // Cartesian unit vector for the geographic point.
  const cl = Math.cos(lat);
  let x = cl * Math.cos(lon);
  let y = cl * Math.sin(lon);
  let z = Math.sin(lat);
  // Rotate by -lambda0 about the z axis, then by -phi0 about the y axis.
  const cL = Math.cos(-lambda0), sL = Math.sin(-lambda0);
  let x1 = x * cL - y * sL;
  let y1 = x * sL + y * cL;
  const cP = Math.cos(phi0), sP = Math.sin(phi0);
  let x2 = x1 * cP + z * sP;
  let z2 = -x1 * sP + z * cP;
  x = x2; y = y1; z = z2;
  const lon2 = Math.atan2(y, x);
  const lat2 = Math.asin(clamp(z, -1, 1));
  return [lon2, lat2];
}

// ---- Forward projections ------------------------------------------------
// Each takes (lon, lat) in radians, already recentred via rotate().

function equirectangular(lon, lat) { return { x: lon, y: lat }; }

function mercator(lon, lat) {
  if (Math.abs(lat) > 1.4835) return null;        // ~85 deg cut
  return { x: lon, y: Math.log(Math.tan(Math.PI / 4 + lat / 2)) };
}

function sinusoidal(lon, lat) {
  return { x: lon * Math.cos(lat), y: lat };
}

function mollweide(lon, lat) {
  // Auxiliary angle theta solves 2*theta + sin(2*theta) = pi*sin(lat).
  let theta = lat;
  for (let i = 0; i < 12; i += 1) {
    const dt = (2 * theta + Math.sin(2 * theta) - Math.PI * Math.sin(lat))
      / (2 + 2 * Math.cos(2 * theta));
    theta -= dt;
    if (Math.abs(dt) < 1e-10) break;
  }
  return { x: (2 * SQRT2 / Math.PI) * lon * Math.cos(theta), y: SQRT2 * Math.sin(theta) };
}

function hammer(lon, lat) {
  const d = Math.sqrt(1 + Math.cos(lat) * Math.cos(lon / 2));
  return {
    x: 2 * SQRT2 * Math.cos(lat) * Math.sin(lon / 2) / d,
    y: SQRT2 * Math.sin(lat) / d,
  };
}

function aitoff(lon, lat) {
  const alpha = Math.acos(clamp(Math.cos(lat) * Math.cos(lon / 2), -1, 1));
  const sinc = alpha === 0 ? 1 : Math.sin(alpha) / alpha;
  return {
    x: 2 * Math.cos(lat) * Math.sin(lon / 2) / sinc,
    y: Math.sin(lat) / sinc,
  };
}

const WINKEL_PHI1 = Math.acos(2 / Math.PI);
function winkelTripel(lon, lat) {
  const a = aitoff(lon, lat);
  return {
    x: (lon * Math.cos(WINKEL_PHI1) + a.x) / 2,
    y: (lat + a.y) / 2,
  };
}

function orthographic(lon, lat) {
  if (Math.cos(lat) * Math.cos(lon) < 0) return null;   // far hemisphere
  return { x: Math.cos(lat) * Math.sin(lon), y: Math.sin(lat) };
}

function stereographic(lon, lat) {
  const denom = 1 + Math.cos(lat) * Math.cos(lon);
  // Clip well before the antipode: there the projection diverges to
  // infinity, which would blow up the auto-fit and collapse the map
  // to a dot. denom < 0.4 is roughly 127 degrees from the centre.
  if (denom < 0.4) return null;
  const k = 2 / denom;
  return { x: k * Math.cos(lat) * Math.sin(lon), y: k * Math.sin(lat) };
}

function gnomonic(lon, lat) {
  const cc = Math.cos(lat) * Math.cos(lon);
  // Gnomonic diverges at 90 degrees from the centre and is only
  // useful well inside that. Clip at cc = 0.45 (about 63 degrees):
  // beyond it the magnification explodes into a radial fringe.
  if (cc <= 0.45) return null;
  return { x: Math.cos(lat) * Math.sin(lon) / cc, y: Math.sin(lat) / cc };
}

function azimuthalEquidistant(lon, lat) {
  const cosc = clamp(Math.cos(lat) * Math.cos(lon), -1, 1);
  const c = Math.acos(cosc);
  const k = c < 1e-7 ? 1 : c / Math.sin(c);
  return { x: k * Math.cos(lat) * Math.sin(lon), y: k * Math.sin(lat) };
}

// Robinson is defined by a table at 5-degree latitude steps; the values
// are the cylindrical length (X) and the parallel spacing (Y), from
// Snyder PP 1395 Table 27.
const ROBINSON_X = [1, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427,
  0.9216, 0.8962, 0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213,
  0.5722, 0.5322];
const ROBINSON_Y = [0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434,
  0.4958, 0.5571, 0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394,
  0.9761, 1];
function robinson(lon, lat) {
  const t = Math.abs(lat) / (HALF_PI) * 18;             // table index, 0..18
  const i = Math.min(17, Math.floor(t));
  const f = t - i;
  const X = ROBINSON_X[i] + (ROBINSON_X[i + 1] - ROBINSON_X[i]) * f;
  const Y = ROBINSON_Y[i] + (ROBINSON_Y[i + 1] - ROBINSON_Y[i]) * f;
  return { x: 0.8487 * X * lon, y: 1.3523 * Y * Math.sign(lat) };
}

// ---- Registry -----------------------------------------------------------
// family: cylindrical | pseudocylindrical | azimuthal | modified-azimuthal
// property: conformal | equal-area | equidistant | compromise | perspective

export const PROJECTIONS = {
  equirectangular: { name: 'Equirectangular', family: 'cylindrical', property: 'equidistant', fn: equirectangular },
  mercator: { name: 'Mercator', family: 'cylindrical', property: 'conformal', fn: mercator },
  sinusoidal: { name: 'Sinusoidal', family: 'pseudocylindrical', property: 'equal-area', fn: sinusoidal },
  mollweide: { name: 'Mollweide', family: 'pseudocylindrical', property: 'equal-area', fn: mollweide },
  hammer: { name: 'Hammer', family: 'modified-azimuthal', property: 'equal-area', fn: hammer },
  aitoff: { name: 'Aitoff', family: 'modified-azimuthal', property: 'compromise', fn: aitoff },
  winkelTripel: { name: 'Winkel tripel', family: 'modified-azimuthal', property: 'compromise', fn: winkelTripel },
  robinson: { name: 'Robinson', family: 'pseudocylindrical', property: 'compromise', fn: robinson },
  orthographic: { name: 'Orthographic', family: 'azimuthal', property: 'perspective', fn: orthographic },
  stereographic: { name: 'Stereographic', family: 'azimuthal', property: 'conformal', fn: stereographic },
  gnomonic: { name: 'Gnomonic', family: 'azimuthal', property: 'perspective', fn: gnomonic },
  azimuthalEquidistant: { name: 'Azimuthal equidistant', family: 'azimuthal', property: 'equidistant', fn: azimuthalEquidistant },
};

export const PROJECTION_KEYS = Object.keys(PROJECTIONS);

// ---- Tissot indicatrix --------------------------------------------------

// Numerical Jacobian of a forward map at (lon, lat), expressed in an
// orthonormal basis on the sphere: the longitude column is divided by
// cos(lat) so that a unit step east and a unit step north are compared
// on an equal footing. Returns the 2x2 matrix [[a,b],[c,d]] or null.
export function jacobian(fn, lon, lat) {
  const h = 1e-5;
  const p0 = fn(lon, lat);
  const pE = fn(lon + h, lat);
  const pN = fn(lon, lat + h);
  if (!p0 || !pE || !pN) return null;
  const cosLat = Math.max(1e-6, Math.cos(lat));
  return [
    [(pE.x - p0.x) / h / cosLat, (pN.x - p0.x) / h],
    [(pE.y - p0.y) / h / cosLat, (pN.y - p0.y) / h],
  ];
}

// Singular values of a 2x2 matrix, descending. These are the Tissot
// semi-axes h and k: the local scale factors along the principal
// directions of distortion.
export function singularValues(m) {
  const [[a, b], [c, d]] = m;
  const e = (a + d) / 2;
  const f = (a - d) / 2;
  const g = (c + b) / 2;
  const hh = (c - b) / 2;
  const q = Math.hypot(e, hh);
  const r = Math.hypot(f, g);
  return [q + r, Math.abs(q - r)];
}

// Tissot summary at a point: principal scale factors a >= b, the area
// scale a*b (1 everywhere for an equal-area projection), and the
// maximum angular distortion in degrees (0 for a conformal projection).
export function tissot(fn, lon, lat) {
  const J = jacobian(fn, lon, lat);
  if (!J) return null;
  const [a, b] = singularValues(J);
  const area = a * b;
  const angular = (a + b) > 1e-9
    ? 2 * Math.asin(clamp((a - b) / (a + b), 0, 1)) * 180 / Math.PI
    : 0;
  // Orientation of the indicatrix major axis: principal axis of J Jt.
  const [[j00, j01], [j10, j11]] = J;
  const p = j00 * j00 + j01 * j01;
  const r = j10 * j10 + j11 * j11;
  const q = j00 * j10 + j01 * j11;
  const angle = 0.5 * Math.atan2(2 * q, p - r);
  return { a, b, area, angular, angle };
}

// =========================================================================
// SIMPLIFIED COASTLINE OUTLINES. Each entry is a closed polygon of
// (longitude, latitude) points in degrees for a major landmass. The
// resolution is a coarse approximation, sufficient for reading a world
// map at a glance under any projection.
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
  // Europe (rough outline).
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
  // Antarctica (stylised).
  [
    [-180, -78], [-150, -76], [-120, -75], [-90, -74], [-60, -72], [-30, -73], [0, -72],
    [30, -69], [60, -68], [90, -66], [120, -67], [150, -73], [180, -78],
  ],
];
