// sim.js
// Point balls bouncing under gravity inside a concave bowl whose
// profile y = f(x) is selectable. On contact the velocity is reflected
// about the local tangent: the normal component is scaled by -e
// (restitution) and the tangential component by (1 - mu).
//
// Parabola gives near-SHM small oscillations (period independent of
// amplitude only in the small-angle limit); the V-bowl gives
// piecewise-constant acceleration; the quartic gives a strongly
// amplitude-dependent period; the circular arc behaves like a
// pendulum. With e = 1 and mu = 0 the total energy is conserved.
//
// Reference: Kleppner and Kolenkow, An Introduction to Mechanics 2e,
// ch. 4 (collisions, restitution) (`kleppner`).

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

export const SHAPES = {
  parabola: { label: 'parabola  y = a x^2', f: (x, a) => a * x * x, df: (x, a) => 2 * a * x },
  vbowl:    { label: 'V-bowl  y = a|x|',     f: (x, a) => a * Math.abs(x), df: (x, a) => a * Math.sign(x) },
  quartic:  { label: 'quartic  y = a x^4',   f: (x, a) => a * x * x * x * x, df: (x, a) => 4 * a * x * x * x },
  arc:      { label: 'circular arc',         f: (x, a) => { const R = 1 / (2 * a); return R - Math.sqrt(Math.max(0, R * R - x * x)); }, df: (x, a) => { const R = 1 / (2 * a); return x / Math.sqrt(Math.max(1e-6, R * R - x * x)); } },
  cosine:   { label: 'cosine well',          f: (x, a) => a * 6 * (1 - Math.cos(x / 1.4)), df: (x, a) => a * 6 * Math.sin(x / 1.4) / 1.4 },
};

export const G = 9.81;

// Initial-arrangement presets. Each is an inside-test on normalized
// (u, v) in [-1, 1]^2 (v up). createSystem rejection-samples n points
// inside the figure, drops them above the bowl at rest, and gravity
// shatters the shape into the chosen profile. 'scatter' is the original
// sparse line of balls (small-n single-ball pedagogy preserved).
function inPoly(poly, u, v) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > v) !== (yj > v)) && (u < ((xj - xi) * (v - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}
function segDist(u, v, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((u - ax) * dx + (v - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(u - (ax + t * dx), v - (ay + t * dy));
}
const STAR = (() => {
  const p = [];
  for (let k = 0; k < 10; k += 1) {
    const ang = Math.PI / 2 + (k * Math.PI) / 5;
    const rad = k % 2 === 0 ? 1.0 : 0.40;
    p.push([rad * Math.cos(ang), rad * Math.sin(ang)]);
  }
  return p;
})();
// Heart polygon, built from the classic parametric heart curve
//   x = 16 sin^3 t,  y = 13 cos t - 5 cos 2t - 2 cos 3t - cos 4t
// normalised into [-1, 1]^2. A polygon is far more robust than the
// implicit (x^2+y^2-1)^3 - x^2 y^3 form, which clipped the bottom
// cusp at the [-1,1] box and read as a broken blob.
const HEART = (() => {
  const p = [];
  for (let i = 0; i < 80; i += 1) {
    const t = (i / 80) * 2 * Math.PI;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    // x in [-16, 16], y in [-17, 12]. Centre y and scale to [-0.95, 0.95].
    p.push([x / 17, (y + 2.5) / 16]);
  }
  return p;
})();
// Asymmetric, recognizable, connotation-free: a tilted crescent moon.
// The crescent is the lune between two circles: the moon disc A
// (centre origin, radius R) minus the shadow disc B (centre +dx,
// radius r). Both circles are chosen so they genuinely overlap, then
// the whole shape is rotated 35 deg to break both mirror symmetries.
// (Replaces the former lightning-bolt shape.)
const CRESCENT = (() => {
  const R = 0.95, r = 0.82, dx = 0.62;
  // Intersection points of circle A (x^2+y^2=R^2) and circle B
  // ((x-dx)^2+y^2=r^2): x* = (R^2 - r^2 + dx^2) / (2 dx).
  const xStar = (R * R - r * r + dx * dx) / (2 * dx);
  const yStar = Math.sqrt(Math.max(0, R * R - xStar * xStar));
  const aA = Math.atan2(yStar, xStar);              // angle on circle A
  const aB = Math.atan2(yStar, xStar - dx);         // angle on circle B
  const p = [];
  // Outer (moon) arc: from +intersection round the LEFT to -intersection.
  for (let i = 0; i <= 70; i += 1) {
    const a = aA + (2 * Math.PI - 2 * aA) * i / 70;
    p.push([R * Math.cos(a), R * Math.sin(a)]);
  }
  // Inner (shadow) arc: the part of circle B that lies INSIDE circle A, i.e.
  // B's LEFT arc (through angle pi), traced from the lower intersection back to
  // the upper one. Tracing B's right side instead (through angle 0) enclosed
  // B's outward bulge and gave a blob, not a lune.
  for (let i = 0; i <= 70; i += 1) {
    const a = (2 * Math.PI - aB) - (2 * Math.PI - 2 * aB) * i / 70;
    p.push([dx + r * Math.cos(a), r * Math.sin(a)]);
  }
  const tilt = 35 * Math.PI / 180;
  const ct = Math.cos(tilt), stl = Math.sin(tilt);
  return p.map(([x, y]) => [ct * x - stl * y, stl * x + ct * y]);
})();
export const ARRANGEMENTS = {
  scatter: { label: 'scatter (line)' },
  square:  { label: 'square',         inside: (u, v) => Math.abs(u) <= 0.8 && Math.abs(v) <= 0.8 },
  ball:    { label: 'ball (disk)',    inside: (u, v) => u * u + v * v <= 0.85 * 0.85 },
  star:    { label: '5-pointed star', inside: (u, v) => inPoly(STAR, u, v) },
  heart:   { label: 'heart',          inside: (u, v) => inPoly(HEART, u, v) },
  letterA: { label: 'letter A',       inside: (u, v) => segDist(u, v, -0.62, -0.9, 0, 0.92) <= 0.16 || segDist(u, v, 0.62, -0.9, 0, 0.92) <= 0.16 || segDist(u, v, -0.30, -0.10, 0.30, -0.10) <= 0.16 },
  crescent: { label: 'crescent moon', inside: (u, v) => inPoly(CRESCENT, u, v) },
};

export function createSystem({
  shape = 'parabola', a = 0.55, e = 0.85, mu = 0.02, n = 6,
  seed = DEFAULT_SEED, arrangement = 'scatter',
} = {}) {
  const rng = makeRng(seed);
  const balls = [];
  const arr = ARRANGEMENTS[arrangement];
  if (arrangement === 'scatter' || !arr || !arr.inside) {
    for (let i = 0; i < n; i += 1) {
      const x = -2.4 + 4.8 * (i + 0.5) / n + (rng() - 0.5) * 0.2;
      balls.push({ x, y: 3.0 + rng() * 0.6, vx: (rng() - 0.5) * 0.4, vy: 0, ci: i, alive: true });
    }
  } else {
    const test = arr.inside;
    let made = 0, guard = 0;
    while (made < n && guard < n * 400) {
      guard += 1;
      const u = 2 * rng() - 1, v = 2 * rng() - 1;
      if (!test(u, v)) continue;
      balls.push({
        x: 1.55 * u, y: 3.2 + 0.95 * v, vx: 0, vy: 0,
        ci: Math.max(0, Math.min(5, Math.floor((u + 1) * 3))), alive: true,
      });
      made += 1;
    }
  }
  return { shape, a, e, mu, arrangement, balls, t: 0, E0: null };
}

function surfaceY(s, x) { return SHAPES[s.shape].f(x, s.a); }
function surfaceSlope(s, x) { return SHAPES[s.shape].df(x, s.a); }

export function step(s, dt = 1 / 240) {
  const elastic = (s.e >= 0.999 && s.mu <= 1e-9);
  for (const b of s.balls) {
    b.vy -= G * dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    const ys = surfaceY(s, b.x);
    if (b.y <= ys) {
      // Local outward normal from the slope m = f'(x): n ~ (-m, 1).
      const m = surfaceSlope(s, b.x);
      const inv = 1 / Math.hypot(m, 1);
      const nx = -m * inv, ny = 1 * inv;
      const tx = 1 * inv, ty = m * inv;             // unit tangent
      const vn = b.vx * nx + b.vy * ny;
      const vt = b.vx * tx + b.vy * ty;
      const vnp = -s.e * vn;
      const vtp = (1 - s.mu) * vt;
      b.vx = vnp * nx + vtp * tx;
      b.vy = vnp * ny + vtp * ty;
      b.y = ys + 1e-4;
    }
    // Outer walls: perfectly elastic in the ideal case so e = 1 stays e = 1.
    if (Math.abs(b.x) > 3.2) { b.vx *= (elastic ? -1 : -0.5); b.x = Math.sign(b.x) * 3.2; }
  }
  s.t += dt;
}

export function totalEnergy(s) {
  let E = 0;
  for (const b of s.balls) E += 0.5 * (b.vx * b.vx + b.vy * b.vy) + G * (b.y - surfaceY(s, 0));
  return E;
}

export function diagnostics(s) {
  if (s.E0 === null) s.E0 = totalEnergy(s);
  const E = totalEnergy(s);
  let maxSpeed = 0, maxPen = 0;
  for (const b of s.balls) {
    maxSpeed = Math.max(maxSpeed, Math.hypot(b.vx, b.vy));
    maxPen = Math.max(maxPen, surfaceY(s, b.x) - b.y);
  }
  return { E, energyDrift: (E - s.E0) / (Math.abs(s.E0) || 1), maxSpeed, maxPen, t: s.t };
}

// Small-amplitude oscillation period of a single ball in the parabola
// y = a x^2 (harmonic: x'' = -2 a g x  ->  T = 2 pi / sqrt(2 a g)).
export function parabolaPeriod(a) { return 2 * Math.PI / Math.sqrt(2 * a * G); }
