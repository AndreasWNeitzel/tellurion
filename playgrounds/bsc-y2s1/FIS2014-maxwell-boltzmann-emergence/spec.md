---
title: Maxwell-Boltzmann Emergence from Hard-Disk Collisions
slug: maxwell-boltzmann-emergence
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2014
supporting_ucs: []
curriculum_year: bsc-y2s1
hook: 'Start every disk at the same speed and let them collide; within moments the speeds spread into the bell-shaped Maxwell-Boltzmann curve and stay there.'
one_paragraph: 'A box of identical hard disks all begin with the same speed but random directions. Elastic collisions conserve total energy and momentum, yet they reshuffle speed among the disks until the speed histogram relaxes to the Maxwell-Boltzmann distribution and then holds, fluctuating gently around it. The playground runs the gas and overlays the live histogram on the analytic 2D Maxwell-Boltzmann curve, so you watch an ordered state (a single sharp speed) decay into the universal thermal distribution. This is the microscopic origin of temperature and of the second law''s arrow. Reference: Reif, Fundamentals of Statistical and Thermal Physics, Ch. 7.'
tags: [thermodynamics, statistical-physics, animation, live-readout]
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

# Maxwell-Boltzmann emergence from hard-disk collisions

## Explainer

### What you are looking at

Start every disk in a box with the *same* speed and only random
directions. Let them collide. Within seconds the speeds spread out into
a smooth bell-like distribution and stay there. No one imposed that
distribution; it emerges from collisions alone. This is the
microscopic origin of temperature and the Maxwell-Boltzmann law.

### The setup

$N$ equal hard disks in a box, walls reflecting, all starting at speed
$v_0$ so the initial speed distribution is a spike,
$\delta(|v| - v_0)$. Between collisions disks fly straight; an elastic
collision between equal masses simply swaps the velocity components
along the line of contact and leaves the tangential parts alone:

$$v_n^{(i)},\,v_n^{(j)} \;\longrightarrow\; v_n^{(j)},\,v_n^{(i)},
  \qquad v_t \text{ unchanged}.$$

Energy and momentum are conserved at every collision; nothing is
random except the initial directions.

### Why a unique distribution emerges

Collisions shuffle energy between disks. A fast disk hitting a slow one
tends to even them out, but statistically the only speed distribution
that is left unchanged by further collisions (the equilibrium, maximum-
entropy state at fixed total energy) is the 2D Maxwell-Boltzmann
distribution:

$$p(v) = \frac{v}{\sigma^2}\,e^{-v^2/2\sigma^2},
  \qquad \sigma^2 = \frac{v_0^2}{2}.$$

The playground histograms the live speeds and overlays this curve; the
spike relaxes onto it and then stays, fluctuating but stable. The width
$\sigma$ is exactly what we call temperature. This is the H-theorem in
miniature: a reversible microscopic rule producing irreversible
relaxation to equilibrium.

### Things to try

- Watch the speed histogram start as a single bar and spread into the
  Maxwell-Boltzmann shape within a few collision times.
- Confirm it then stays put: equilibrium is stable under more
  collisions.
- Note total kinetic energy is conserved throughout; the distribution
  changes shape, not its mean energy.

### Where this comes from

The hard-disk collision rule, the relaxation to equilibrium, and the
Maxwell-Boltzmann distribution follow Reif, *Fundamentals of
Statistical and Thermal Physics*, Chapter 1.

## Physical setup

A 2D box of side L = 8 containing N = 80 hard disks (radius 0.15) initially
moving with identical speed v_0 = 1 but random orientations. Walls are
reflecting; disk-disk collisions are elastic with equal masses (which
exchanges only the velocity components along the contact normal).

## Governing equations

Free flight between collisions; elastic collision at contact:
  v_n^i, v_n^j  ->  v_n^j, v_n^i
  v_t unchanged.

The initial distribution is delta(|v| - v_0). Through collisions it
relaxes toward the 2D Maxwell-Boltzmann distribution
  p(v) = (v / sigma^2) exp(-v^2 / (2 sigma^2))
with sigma^2 = v_0^2 / 2.

## Numerical method

Fixed time-step Euler with pairwise overlap detection and elastic
collision resolution. O(N^2) collision check per step (cheap at N = 80).

## Controls

- speed: simulation steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Initial: all disks at the same speed (uniform color).
2. After collisions: color spreads (some slow, some fast).
3. Histogram of |v| starts as a single tall bar at v_0 and broadens.
4. Long-time histogram matches the analytic MB curve (overlaid in orange).
5. Mean speed converges to sigma sqrt(pi/2) approx 0.886 v_0.

## Invariants and acceptance thresholds

1. Total KE conserved to 1e-9 over 200 steps.
2. Initial mean speed equals v_0.
3. Particles remain inside the box.
4. Mean speed post-thermalization in [0.7, 1.0] when v_0 = 1.
5. Analytic 2D MB integrates to 1 within 1e-3 (sanity).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- N -> infinity: histogram converges to MB more sharply.
- Density -> 1 (close-packing): qualitatively different statistics (jamming).

## Visual fallback

Canvas2D only. Left: gas box (color = speed). Right: speed histogram with
MB analytic curve overlaid.

## Citations

- Reif, Fundamentals of Statistical and Thermal Physics Ch. 1.
- Krauth, Statistical Mechanics: Algorithms and Computations Ch. 2.

## Stretch goals

- Event-driven collisions (exact instead of overlap-based).
- Maxwell-Boltzmann demon: split slow vs fast disks across a partition.
- 3D extension.

## Risk register

- Time-stepped collisions can cause occasional disk overlap if dt is too
  large; we push particles apart in `resolveCollision` to avoid sticking.
- For very long runs, energy drift from this push correction is < 1e-9
  per step.
