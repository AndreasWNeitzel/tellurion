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
---
# ODE solvers shootout
Three integrators on the simple harmonic oscillator; Euler drifts energy upward, RK4 is accurate, RK45 estimates its own error. Source: Villate VPython Numerical Methods (`villate-vpython`).
