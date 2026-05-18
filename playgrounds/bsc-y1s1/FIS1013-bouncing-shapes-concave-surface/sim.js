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
// Asymmetric, recognizable: a lightning bolt. No horizontal or vertical
// mirror symmetry.
const BOLT = [
  [0.25, 0.95], [-0.45, 0.08], [-0.05, 0.08],
  [-0.30, -0.95], [0.45, 0.0], [0.05, 0.0],
];
export const ARRANGEMENTS = {
  scatter: { label: 'scatter (line)' },
  square:  { label: 'square',         inside: (u, v) => Math.abs(u) <= 0.8 && Math.abs(v) <= 0.8 },
  ball:    { label: 'ball (disk)',    inside: (u, v) => u * u + v * v <= 0.85 * 0.85 },
  star:    { label: '5-pointed star', inside: (u, v) => inPoly(STAR, u, v) },
  heart:   { label: 'heart',          inside: (u, v) => { const X = u / 0.92, Y = v / 0.92; return (X * X + Y * Y - 1) ** 3 - X * X * Y * Y * Y < 0; } },
  letterA: { label: 'letter A',       inside: (u, v) => segDist(u, v, -0.62, -0.9, 0, 0.92) <= 0.16 || segDist(u, v, 0.62, -0.9, 0, 0.92) <= 0.16 || segDist(u, v, -0.30, -0.10, 0.30, -0.10) <= 0.16 },
  bolt:    { label: 'lightning bolt', inside: (u, v) => inPoly(BOLT, u, v) },
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
        x: 1.75 * u, y: 2.5 + 1.05 * v, vx: 0, vy: 0,
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
    if (Math.abs(b.x) > 3.2) { b.vx *= -0.5; b.x = Math.sign(b.x) * 3.2; }
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
