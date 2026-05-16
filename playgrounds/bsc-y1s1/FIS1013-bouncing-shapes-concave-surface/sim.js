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

export function createSystem({
  shape = 'parabola', a = 0.55, e = 0.85, mu = 0.02, n = 6, seed = DEFAULT_SEED,
} = {}) {
  const rng = makeRng(seed);
  const balls = [];
  for (let i = 0; i < n; i += 1) {
    const x = -2.4 + 4.8 * (i + 0.5) / n + (rng() - 0.5) * 0.2;
    balls.push({ x, y: 3.0 + rng() * 0.6, vx: (rng() - 0.5) * 0.4, vy: 0, alive: true });
  }
  return { shape, a, e, mu, balls, t: 0, E0: null };
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
