---
title: Geodesic Deviation on a Sphere
slug: geodesic-deviation-equation
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: M3007
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: carroll-spacetime
primary_chapter: 3
hook: 'Start two travellers walking dead straight and parallel on a sphere and they drift together anyway: curvature, not a force, pulls them in.'
one_paragraph: 'On a flat plane two parallel straight lines never meet. On a curved surface they do: two geodesics that start parallel on a sphere bend toward each other and cross at the pole, with nothing pushing them. The geodesic deviation equation makes this quantitative, tying the relative acceleration of nearby geodesics directly to the curvature. The playground launches two parallel-starting geodesics on a sphere and shows them converging. This is exactly how general relativity reframes gravity: tidal acceleration is geodesic deviation in curved spacetime. Reference: Carroll, Spacetime and Geometry, Ch. 3.'
tags: [relativity, animation, live-readout]
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
# Geodesic deviation
Two parallel-starting geodesics on a sphere converge at the pole. Source: Carroll Spacetime and Geometry Ch. 3 (`carroll-spacetime`).

## Explainer

### What you are looking at

Two travellers set off from the equator heading due north, exactly
parallel. They never steer, yet they drift together and meet at the
pole. Nothing pushed them; the surface is curved. The playground
launches two parallel-starting geodesics on a sphere and watches the
gap between them close, the visual core of how curvature acts like
gravity.

### Geodesics and their separation

A geodesic is the straightest possible path (zero acceleration within
the surface); on a sphere these are great circles. Let $\xi$ be the
small separation vector between two nearby geodesics, and $\lambda$ the
distance along them. The geodesic deviation equation says the
separation accelerates in proportion to the curvature:

$$\frac{D^2\xi^a}{d\lambda^2}
  = -\,R^a{}_{bcd}\,u^b\,\xi^c\,u^d,$$

where $u$ is the tangent (direction of travel) and $R$ the Riemann
curvature tensor. On a flat plane $R=0$ and parallel lines stay
parallel forever; on the unit sphere ($R$ positive) the right side is
restoring, so

$$\ddot\xi = -\,\xi
  \;\Longrightarrow\; \xi(\lambda)\propto\cos\lambda,$$

the separation oscillates: it shrinks to zero at the pole (a quarter
turn away), reflecting the positive curvature.

### Why it is gravity

In general relativity free-falling particles follow geodesics of
curved spacetime. The relative acceleration of two nearby free-fallers,
the tidal force, is exactly geodesic deviation: gravity is not a force
but the convergence of geodesics produced by curvature. So this little
sphere demo is the same equation that describes tides and the
stretching near a black hole. The playground shows the two geodesics
converging and the separation following the curvature-driven law.

### Things to try

- Start the two paths parallel at the equator and watch them meet at
  the pole (separation $\propto\cos\lambda$).
- Note neither path ever turns: the convergence is curvature, not
  steering.
- Connect it to gravity: this is the tidal-force equation in
  disguise.

### Where this comes from

The geodesic deviation equation, the Riemann tensor, and its
identification with tidal gravity follow Carroll, *Spacetime and
Geometry*, Chapter 3.
