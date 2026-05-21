---
title: "ODE Solvers: Euler vs RK4 vs RK45"
slug: ode-solver-euler-rk4-rk45
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2018
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: villate-vpython
primary_chapter: 5
hook: 'Integrate a frictionless oscillator three ways: Euler pumps energy in until it spirals out, RK4 holds, RK45 watches its own error and adjusts.'
one_paragraph: 'On the simple harmonic oscillator, where the exact orbit is a closed ellipse in phase space, the integrator choice is laid bare. Forward Euler is only first order and systematically injects energy, so its orbit spirals outward; classical RK4 is fourth order and tracks the true ellipse for a long time; RK45 carries two solutions of different order, uses their difference to estimate the local error, and adapts its step size. The playground runs all three and shows the phase-space orbits and the energy drift. It is the cleanest argument for why order and adaptivity matter. Reference: Villate, Numerical Methods (VPython), Ch. 5.'
tags: [numerics, animation, live-readout]
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
---
# ODE solvers shootout
Three integrators on the simple harmonic oscillator; Euler drifts energy upward, RK4 is accurate, RK45 estimates its own error. Source: Villate VPython Numerical Methods (`villate-vpython`).

## Explainer

### What you are looking at

The same physics integrated three ways gives three different answers,
and the differences are the whole subject of numerical analysis. On a
simple harmonic oscillator (which should trace a perfect ellipse in
phase space forever) the playground shows forward Euler spiral
outward, RK4 stay tight, and RK45 adapt its own step.

### One ODE, three schemes

The test problem is $\ddot x = -\omega^2 x$, rewritten as the
first-order system $\dot{\mathbf y}=\mathbf f(\mathbf y)$. Each
method advances $\mathbf y$ by a step $h$:

- Forward Euler: $\mathbf y_{n+1}=\mathbf y_n+h\,\mathbf f(\mathbf
  y_n)$. First-order accurate (local error $O(h^2)$, global $O(h)$)
  and not symplectic, so it systematically injects energy: the phase
  orbit spirals outward and the amplitude grows without bound. Right
  shape, wrong long-term behaviour.
- Classic RK4: four stages per step, global error $O(h^4)$. For the
  same $h$ the orbit stays visually closed for a very long time; the
  energy drifts only slowly. The cost is four force evaluations per
  step.
- RK45 (Dormand-Prince): computes a 5th- and an embedded 4th-order
  estimate, takes their difference as a local error estimate, and
  shrinks or grows $h$ to keep that error near a tolerance. It spends
  small steps where the solution is changing fast and large steps
  where it is smooth.

### The lesson

Accuracy is about the order ($p$ in error $\propto h^p$); long-term
qualitative correctness is a separate question (Euler's instability
is not fixed by a smaller $h$, only delayed); and adaptivity buys
efficiency by putting work where it is needed. The playground plots
all three phase orbits and their energy error versus time so the
order, the Euler blow-up, and the RK45 step-size adaptation are all
visible at once.

### Things to try

- Watch the Euler orbit spiral outward (energy injected) while RK4
  stays a tight ellipse at the same step size.
- Shrink the step and watch every error fall by the method's order
  (Euler ~h, RK4 ~h^4).
- Make the problem stiffer or add fast transients and watch RK45
  automatically take tiny steps there and large steps elsewhere.

### Where this comes from

Runge-Kutta methods, order of accuracy, and embedded adaptive
step-size control follow Press et al., *Numerical Recipes*, Chapter
17, and Hairer, Norsett and Wanner, *Solving Ordinary Differential
Equations I*.
