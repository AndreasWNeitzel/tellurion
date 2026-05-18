---
title: Kepler Equation Newton Iteration
slug: kepler-equation-newton-iteration
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3015
supporting_ucs: [AST2004]
curriculum_year: bsc-y3s1
primary_citation: carroll-ostlie
primary_chapter: 2
hook: 'To find where a planet is at a given time you must solve M = E - e sin E, which has no closed form; Newton''s method nails it in a handful of steps.'
one_paragraph: 'Kepler''s equation, M = E - e sin E, links the uniformly ticking mean anomaly M to the eccentric anomaly E that fixes the planet''s position on its ellipse. It is transcendental, so there is no formula for E; you iterate. The playground solves it by Newton''s method from the seed E_0 = M + e sin M and shows the iteration converging quadratically, the error roughly squaring each step, in 4-6 iterations for mild eccentricity and slowing only as e approaches 1. It is the workhorse calculation behind every ephemeris and transit prediction. Reference: Murray and Dermott, Solar System Dynamics, Ch. 2.'
tags: [exoplanets, numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Kepler equation: Newton iteration converges quadratically

## Explainer

### What you are looking at

To say where a planet is at a given time you must solve one equation
that has no closed-form answer. Newton's method finds it in a handful
of steps, and the playground shows the error squaring at each
iteration: the textbook picture of quadratic convergence.

### Kepler's equation

Time enters the orbit through the mean anomaly $M$ (it ticks
uniformly, $2\pi$ per period). The geometry enters through the
eccentric anomaly $E$ (the planet's angle on the auxiliary circle).
They are linked by

$$M = E - e\,\sin E,$$

with $e$ the eccentricity. Once $E$ is known the position follows
directly: $\big(a(\cos E - e),\ a\sqrt{1-e^2}\,\sin E\big)$. The
equation is transcendental, $E$ cannot be isolated, so it is solved
numerically every time an ephemeris is computed.

### Newton iteration and quadratic convergence

Define $f(E) = E - e\sin E - M$ and apply Newton's method:

$$E_{n+1} = E_n - \frac{E_n - e\sin E_n - M}{1 - e\cos E_n},$$

from the robust seed $E_0 = M + e\sin M$. Near the root the error obeys

$$|E_{n+1} - E_\infty| \sim |E_n - E_\infty|^2,$$

so the number of correct digits roughly doubles every step: 4-6
iterations suffice for $e \le 0.9$, growing to 10-15 only as
$e \to 0.99$ (the cosine in the denominator gets small near
perihelion of a near-parabolic orbit). The playground plots the
shrinking residual so the squaring is visible as a steepening
straight line on a log axis.

### Things to try

- Set a modest eccentricity and watch the residual drop by orders of
  magnitude per step (quadratic).
- Push $e$ toward 0.99 and watch convergence slow, more steps needed
  near perihelion.
- Note the seed $E_0 = M + e\sin M$ already lands close: a good
  initial guess is half the battle.

### Where this comes from

Kepler's equation, the orbit position, and the Newton iteration with
quadratic convergence follow Carroll and Ostlie, *An Introduction to
Modern Astrophysics*, 2nd ed., Chapter 2, and Curtis, *Orbital
Mechanics for Engineering Students*, Chapter 3.

## Physical setup

The Kepler equation $M = E - e \sin E$ relates the mean anomaly $M$ (the linear angular coordinate that ticks at $2\pi$ per orbital period) to the eccentric anomaly $E$ (the angle of the planet on the auxiliary circle of the ellipse). Position on the orbit follows from $(a(\cos E - e), \, a\sqrt{1-e^2} \sin E)$. The equation is transcendental, so we solve it numerically.

## Numerical method

Newton iteration with initial guess $E_0 = M + e \sin M$ (a robust first-order seed). Iteration: $E_{n+1} = E_n - (E_n - e \sin E_n - M) / (1 - e \cos E_n)$.

Quadratic local convergence: $|E_{n+1} - E_\infty| \sim |E_n - E_\infty|^2$. The solver converges in 4-6 iterations for $e \le 0.9$ and 10-15 iterations near $e = 0.99$.

## Controls

- Eccentricity $e$ (0 to 0.99).
- Playback speed (0.1 to 3).

## Expected qualitative features

1. Planet moves around the ellipse with one focus (sun) at the origin; perihelion at $M = 0$, aphelion at $M = \pi$.
2. At high $e$ the planet visibly slows at aphelion and accelerates at perihelion (Kepler's second law).
3. Convergence plot is a series of dots dropping each by a factor that squares the previous remainder.
4. Higher $e$ needs more iterations; the readout shows the count.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $e = 0$ gives $E = M$ trivially | within $10^{-12}$ | invariants test |
| residual $M = E - e \sin E$ satisfied | within $10^{-10}$ | invariants test |
| Newton converges in fewer than 15 iterations at $e = 0.99$ | strict | invariants test |
| residual drops by $10^3$ from iter 0 to iter 3 | strict | invariants test |
| orbit closure at $M + 2\pi$ returns to same $(x, y)$ | within $10^{-10}$ | invariants test |
| perihelion at $M = 0$: $(a(1-e), 0)$ | within $10^{-12}$ | invariants test |
| aphelion at $M = \pi$: $(-a(1+e), 0)$ | within $10^{-12}$ | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $e = 0$: circular orbit, $E = M$ exactly.
- $e \to 1$: near-parabolic, convergence slows; the playground caps at $e = 0.99$.
- $M = 0$: perihelion, planet at $(a(1-e), 0)$.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 2 (`carroll-ostlie`).
- Curtis, *Orbital Mechanics for Engineering Students*, Ch. 3, for the numerical methods (laguerre iteration is faster but Newton is the textbook intro).

## Stretch goals

- Switch to Laguerre iteration for $e > 0.95$ where Newton stalls.
- Add hyperbolic Kepler equation $M = e \sinh F - F$ for $e > 1$.
- Show the true-anomaly $\theta$ alongside $E$.

## Risk register

- Near $e = 1$ the initial guess $E_0 = M$ is poor; the engine uses $E_0 = M + e \sin M$ as a safer seed.
