---
title: Henon Strange Attractor
slug: henon-strange-attractor
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
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
---

# Henon Strange Attractor

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
