---
title: Henon Strange Attractor
slug: henon-strange-attractor
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
primary_citation: strogatz2015
supporting_ucs: []
curriculum_year: bsc-y2s2
hook: 'Two lines of arithmetic, iterated, fold a square of points onto an object that is neither a curve nor an area: a fractal with structure at every zoom.'
one_paragraph: 'The Henon map is the simplest system that builds a strange attractor you can draw by hand: each step stretches and folds the plane via x'' = 1 - a x^2 + y, y'' = b x. At the canonical a = 1.4, b = 0.3 the iterates settle onto the famous banana-shaped set whose cross-section is a Cantor-like dust, fractal dimension about 1.26, and whose nearby points separate exponentially (maximal Lyapunov exponent about 0.42). The playground iterates the map, scatters the attractor, and reports the live Lyapunov estimate; dragging (a, b) morphs and ultimately destroys the attractor. It is the discrete-time companion to the Lorenz attractor and the cleanest place to see stretch-and-fold chaos. Reference: Henon 1976.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "Strogatz, Nonlinear Dynamics and Chaos."

---

# Henon Strange Attractor

## Explainer

### What you are looking at

Iterate one of the simplest possible nonlinear maps and the points do
not fill an area or settle to a cycle: they pile up on a delicate,
infinitely-layered curve, a strange attractor. The playground iterates
the Henon map and lets you zoom in to see the self-similar fractal
structure that captures the essence of dissipative chaos.

### The map

The Henon (1976) map is a 2D quadratic recurrence:

$$x_{n+1} = 1 - a\,x_n^2 + y_n,
  \qquad
  y_{n+1} = b\,x_n.$$

At the classic parameters $a=1.4$, $b=0.3$ almost every starting
point is drawn onto the same attractor. It is the cleanest model of
the stretch-and-fold mechanism behind chaos.

### Why it is "strange"

Two properties make the attractor strange:

- Sensitive dependence: nearby points separate exponentially (a
  positive Lyapunov exponent $\approx 0.42$), so long-term prediction
  is impossible even though the map is deterministic.
- Fractal geometry with area contraction. The Jacobian determinant is
  constant, $|J| = b$, so each iteration shrinks any area by the
  factor $b$ (here $0.3$): the attractor has zero area. Yet the
  stretching keeps the dynamics from collapsing to a point, so the
  set has a non-integer (fractal) dimension $\approx 1.26$. Zooming
  in reveals the same striated layering at every scale, the visual
  signature of the stretch-fold (a baker's map with dissipation).

This combination, contracting volume but exponentially diverging
trajectories on a fractal set, is exactly what defines a dissipative
chaotic attractor (the Lorenz system is the continuous-time cousin).
The playground iterates millions of points, lets you change $a,b$,
and zooms to expose the self-similar leaves.

### Things to try

- Iterate and watch points scatter, then converge onto the same thin
  boomerang attractor regardless of start.
- Zoom into a "thick" band and find it is really many finer bands
  (self-similarity, fractal dimension ~1.26).
- Lower $b$ (more contraction) and watch the attractor thin toward a
  curve; raise $a$ and watch it lose stability (period-doubling to
  chaos).

### Where this comes from

The Henon map, its strange attractor, fractal dimension and Lyapunov
exponent follow Henon, Commun. Math. Phys. 50, 69 (1976), and
Strogatz, *Nonlinear Dynamics and Chaos*, Chapter 12.

## Physical setup

The Henon map is a 2D quadratic recurrence, introduced by Michel Henon
in 1976 as a minimal model with the same stretch-and-fold mechanism as
the Lorenz flow but simple enough to iterate by hand. Starting from
almost any initial point, the orbit is attracted onto a bounded set
that is self-similar under magnification: a strange attractor. The
playground scatters tens of thousands of iterates to reveal the set
and tracks a tangent vector to estimate its sensitivity to initial
conditions.

## Governing equations

$$x_{n+1} = 1 - a\,x_n^{2} + y_n, \qquad y_{n+1} = b\,x_n.$$

The Jacobian is

$$J = \begin{pmatrix} -2 a x & 1 \\ b & 0 \end{pmatrix}, \qquad \det J = -b,$$

so each step contracts areas by the constant factor $|b|$ (here
$0.3$). Canonical parameters $a = 1.4$, $b = 0.3$ give a maximal
Lyapunov exponent $\lambda_1 \approx 0.419$ and a box-counting
dimension $\approx 1.26$. Because $\det J$ is constant, the two
Lyapunov exponents satisfy $\lambda_1 + \lambda_2 = \ln|b|$ exactly.

## Numerical method

Direct iteration of the map in double precision (no integrator is
needed; the system is already discrete and exact). The maximal
Lyapunov exponent uses tangent-vector linearization: iterate
$(\delta x, \delta y)$ through the Jacobian, renormalize every 100
steps, and accumulate the log stretch after a 1000-step warmup so the
transient onto the attractor is discarded.

## Controls

- `a`, `b` parameter handles: drag to morph the attractor and watch it
  period-double, become chaotic, or escape to infinity.

## Expected qualitative features

1. At $a = 1.4$, $b = 0.3$: the canonical banana-shaped attractor with
   visible fine sub-structure (a Cantor set across the fold).
2. Lowering $a$ collapses the attractor to a periodic cycle, then a
   fixed point.
3. Raising $a$ past about $1.42$ sends most orbits to infinity (no
   attractor).
4. The live Lyapunov readout is positive (about $0.42$) on the chaotic
   attractor and non-positive on periodic windows.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $\det J = -b$ everywhere | exact | invariants test |
| $\lambda_1 + \lambda_2 = \ln|b|$ | within $10^{-2}$ | invariants test |
| canonical $\lambda_1 \approx 0.419$ | within $5\%$ | invariants test |
| orbit stays bounded at canonical params | $|x| < 2$ | invariants test |

## Limiting cases for verification

- $b = 0$: the map degenerates to the 1D quadratic (logistic-like)
  map; the attractor collapses onto a curve.
- Small $a$: stable fixed point at the analytic
  $x^\* = \tfrac{1}{2a}\big(b - 1 + \sqrt{(1-b)^2 + 4a}\big)$.

## Visual fallback

If Canvas2D is unavailable the readout still reports the live Lyapunov
estimate and parameter values.

## Citations

- Henon, M. 1976, "A two-dimensional mapping with a strange
  attractor", Commun. Math. Phys. 50, 69.
- Strogatz, S. H., *Nonlinear Dynamics and Chaos*, 2e, Ch. 12.

## Stretch goals

- Overlay the unstable manifold of the fixed point.
- Box-counting dimension readout.

## Risk register

- For parameters where orbits diverge, the scatter must clamp or skip
  non-finite iterates (handled in playground.js).
