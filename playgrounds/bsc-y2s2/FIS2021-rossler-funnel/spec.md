---
title: Rossler Funnel Attractor
slug: rossler-funnel
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
hook: 'Three equations with a single quadratic term spiral out flat then fold once into the third dimension; raise one knob and the spiral period-doubles into a strange attractor.'
one_paragraph: 'Rossler''s 1976 system is the minimal continuous-time chaos: dx/dt = -y - z, dy/dt = x + a y, dz/dt = b + z(x - c), with only one nonlinear term. Trajectories spiral outward in a near-plane, then the z-equation lifts and reinjects them, giving a single-fold attractor cleaner than Lorenz. As c rises the system runs a period-doubling cascade into a strange attractor, and past c around 5.7 it grows the vertical lobe that names the funnel. The playground integrates it and shows the attractor alongside a bifurcation view. It is the cleanest minimal route to continuous chaos. Reference: Rossler 1976; Strogatz, Nonlinear Dynamics and Chaos, Ch. 12.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Rossler funnel attractor

## Explainer

### What you are looking at

The Rossler system is the minimal recipe for chaos: a flat spiral
plus a single fold. It strips chaos down to its essence so you can
literally watch the stretch-and-fold mechanism, and watch it arrive
through a clean period-doubling cascade as you turn one knob.

### The equations

Three first-order ODEs with a single quadratic term:

$$\dot x = -y - z,
  \qquad
  \dot y = x + a y,
  \qquad
  \dot z = b + z(x - c).$$

The first two equations spiral the trajectory outward in the
near-planar $(x,y)$ disc; the $z$ equation is dormant until $x$
exceeds $c$, at which point $z$ shoots up, yanks the trajectory out
of the plane, and drops it back near the centre. Spiral out, fold up
and back: that single fold is the entire chaos engine.

### Period doubling to a strange attractor

The control parameter $c$ tunes the fold. As $c$ increases the closed
orbit period-doubles: a 1-loop cycle becomes 2, then 4, 8, ...,
accumulating (at a rate governed by the universal Feigenbaum constant
$\delta\approx4.669$) onto a chaotic strange attractor. Past
$c\approx5.7$ the attractor grows a tall vertical lobe, the "funnel".
Because the dynamics is essentially a 1D stretch-and-fold return map
lifted into 3D, Rossler is the cleanest demonstration that the
logistic-map period-doubling route to chaos also governs continuous
flows: same Feigenbaum universality, same fractal attractor, with the
geometry simple enough to see by eye. The playground sweeps $c$ and
shows the orbit period-double and then fill the funnel.

### Things to try

- Set $c$ small and see a simple closed loop; raise it and watch the
  loop split to period 2, 4, 8 (the cascade).
- Push past the accumulation point and watch the orbit fill a
  strange attractor that never repeats.
- Increase $c$ further to grow the vertical "funnel" lobe.

### Where this comes from

The Rossler system, the single-fold mechanism and the
period-doubling route to chaos follow Rossler, Phys. Lett. A 57, 397
(1976), and Strogatz, *Nonlinear Dynamics and Chaos*, Chapters 10
and 12.

## Physical setup

Otto Rossler's 1976 minimal continuous-time chaotic system. Three coupled first-order ODEs in (x, y, z) with one quadratic nonlinearity (z times x). Compared to Lorenz, the geometry is simpler: a near-planar spiral on the (x, y) plane with a single fold that lifts trajectories in z and drops them back near the origin. As the control parameter c increases, the system undergoes a period-doubling cascade culminating in a strange attractor; past c ~ 5.7 the attractor develops a vertical lobe that gives it the "funnel" name.

## Governing equations

Phase-space variables y = (x, y, z).

  dx/dt = -y - z
  dy/dt = x + a y
  dz/dt = b + z (x - c)

Tangent equation (linearization) for the Lyapunov estimator:

  d(delta)/dt = J(y) * delta

with Jacobian

  J = [[  0,  -1,  -1  ],
       [  1,   a,   0  ],
       [  z,   0, x-c  ]]

The simulation integrates a 6-vector [x, y, z, dx, dy, dz] so the tangent vector is advanced consistently.

## Numerical method

Classical fourth-order Runge-Kutta, fixed dt = 0.02, from `shared/js/engine/ode-rk.js`. Tangent renormalized every 50 steps (Benettin et al. 1980) to keep the magnitude near unity and to accumulate log(|delta|) for the largest Lyapunov exponent.

## Controls

- a: weak spiral feedback, slider 0.05 - 0.4, default 0.2
- b: vertical-fold offset, slider 0.05 - 0.4, default 0.2
- c: spiral radius and onset of folding, slider 3.0 - 10.0, default 5.7
- speed: integration steps per render frame, 0.05 - 1.0, default 0.2

## Expected qualitative features

1. The trajectory winds outward as a near-planar spiral in (x, y), reaches a critical radius, and a single fold lifts it up the z axis before dropping it back near the origin.
2. The default parameters yield a chaotic (funnel-shaped) attractor with positive Lyapunov exponent (~ 0.07).
3. As c drops below ~ 4.2 the attractor collapses to a period-2 limit cycle; Lyapunov exponent approaches zero.

## Invariants and acceptance thresholds

- Bounded: max |x|, |y| < 20, max |z| < 40 over 30k steps with default parameters. Confirmed in `invariants.test.mjs`.
- Chaotic regime at c = 5.7: largest Lyapunov exponent in [0.04, 0.15] after 50k steps. Confirmed.
- Periodic regime at c = 3.5: |lambda_1| < 0.05 after 50k steps. Confirmed.

## Limiting cases for verification

- Linearization near origin for a = b = 0: zero is a fixed point; eigenvalues of J(0) = ((0, -1, -1), (1, 0, 0), (0, 0, -c)) have real parts (0, 0, -c); the trajectory is neutral on the (x, y) circle when a = 0.
- Period-1 limit cycle at c = 2.5 (visible by inspection in the playground at c set low).

## Visual fallback

If WebGL is unavailable: the playground uses only Canvas2D and SVG, so this is not an issue.

## Citations

- Rossler 1976, Phys. Lett. A 57, 397 (`rossler1976`).
- Strogatz 2024, Nonlinear Dynamics and Chaos, 2e, Section 12.4 (`strogatz2024`).
- Ott 2002, Chaos in Dynamical Systems, 2e, Section 3.5 (`ott2002`).
- Benettin et al. 1980, Meccanica 15, 9 - 30, for the tangent-renormalization Lyapunov estimator.

## Stretch goals

- Add a (x, y, z) "frequency" indicator that shifts when the period-doubling cascade kicks in.
- Add a small return-map inset over the Poincare section x = 0.

## Risk register

- Stiffness at large c: RK4 fixed-step starts to lose accuracy near c = 12. Slider capped at 10.
- Initial transient: 1500-step warmup discards the spiral-out approach from the (0.1, 0, 0) seed.
