// sim.js
// Monte Carlo integration by hit-or-miss sampling. A shape lives in
// the unit square [0,1]^2; uniform random darts are thrown and the
// fraction landing inside the shape estimates its area, which is the
// integral of the shape's indicator function. The estimate is a
// Binomial proportion, so its standard error shrinks as 1/sqrt(N).
//
// Reference: MacKay, Information Theory, Inference, and Learning
// Algorithms, Ch. 29 (`mackay`); Press et al., Numerical Recipes,
// Ch. 7.6, hit-or-miss Monte Carlo (`press-nr`).

import { makeRng, DEFAULT_SEED } from '../../../shared/js/render/rng.js';

// Each shape: a predicate inside(x, y) on the unit square and its
// exact area, used as the convergence target the estimate must
// approach. The unit square has area 1, so the hit fraction is a
// direct estimate of the area.
export const SHAPES = [
  {
    key: 'quarter-disk',
    name: 'quarter disk',
    inside: (x, y) => x * x + y * y <= 1,
    area: Math.PI / 4,
    note: 'area = pi/4; 4x the hit fraction gives pi',
  },
  {
    key: 'ellipse',
    name: 'ellipse',
    inside: (x, y) => {
      const u = (x - 0.5) / 0.44;
      const v = (y - 0.5) / 0.30;
      return u * u + v * v <= 1;
    },
    area: Math.PI * 0.44 * 0.30,
    note: 'area = pi a b',
  },
  {
    key: 'annulus',
    name: 'annulus (ring)',
    inside: (x, y) => {
      const r2 = (x - 0.5) ** 2 + (y - 0.5) ** 2;
      return r2 >= 0.19 * 0.19 && r2 <= 0.44 * 0.44;
    },
    area: Math.PI * (0.44 * 0.44 - 0.19 * 0.19),
    note: 'area = pi (R^2 - r^2)',
  },
  {
    key: 'rose',
    name: 'four-petal rose',
    inside: (x, y) => {
      const dx = x - 0.5;
      const dy = y - 0.5;
      const r = Math.hypot(dx, dy);
      return r <= 0.46 * Math.abs(Math.cos(2 * Math.atan2(dy, dx)));
    },
    // The region r <= a|cos 2theta| is four petals; the rose
    // r = a cos 2theta encloses area pi a^2 / 2.
    area: Math.PI * 0.46 * 0.46 / 2,
    note: 'area = pi a^2 / 2 for r = a |cos 2 theta|',
  },
];

export function shapeByKey(key) {
  return SHAPES.find((s) => s.key === key) || SHAPES[0];
}

// A running hit-or-miss estimator: a seeded RNG plus the running
// tallies. Darts are never stored here; the caller keeps whatever it
// wants to render.
export function makeEstimator(seed = DEFAULT_SEED) {
  return { rng: makeRng(seed), nTotal: 0, nHit: 0 };
}

// Throw n darts against the shape. Returns the dart list (each
// {x, y, hit}) for rendering and advances the running tallies.
export function throwDarts(est, shape, n) {
  const darts = [];
  for (let i = 0; i < n; i += 1) {
    const x = est.rng();
    const y = est.rng();
    const hit = shape.inside(x, y);
    darts.push({ x, y, hit });
    est.nTotal += 1;
    if (hit) est.nHit += 1;
  }
  return darts;
}

// Current area estimate and its 1-sigma standard error. The hit
// count is Binomial(N, p) with p the true area (the box has unit
// area), so the hit fraction has standard error sqrt(p(1-p)/N).
export function areaEstimate(est) {
  const N = Math.max(1, est.nTotal);
  const p = est.nHit / N;
  return { area: p, se: Math.sqrt(Math.max(0, p * (1 - p) / N)), n: est.nTotal };
}
