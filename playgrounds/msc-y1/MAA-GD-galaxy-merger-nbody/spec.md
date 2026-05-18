---
title: "Galaxy Merger N-Body"
slug: galaxy-merger-nbody
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: MAA-GD
supporting_ucs: []
curriculum_year: msc-y1
hook: 'Two Hernquist galaxies collide; tracer particles feel both halo potentials and develop tidal tails, captured stars, and a final mixed-color elliptical remnant.'
one_paragraph: 'Each tracer feels analytic Hernquist potentials of BOTH halos while halo centers integrate as a softened 2-body. Plummer softening keeps the pair force finite during close encounters.'
tags: [galactic, interactive-drag, animation, live-readout]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: []
---

# Galaxy Merger N-Body

Two Hernquist galaxies (800 tracer particles each, color-coded by initial galaxy) approach at user-chosen impact parameter and relative velocity. Each tracer feels the analytic potential of BOTH halos, while the halo centers integrate as a softened 2-body problem. Tidal tails, captured stars, bar instabilities, and a final mixed-color elliptical remnant emerge naturally.

## Explainer

### What you are looking at

When two galaxies pass close, gravity does something dramatic: it
flings stars into long tidal tails, captures stars from the other
galaxy, and (over a few passes) merges the pair into a single
featureless elliptical. The playground is a restricted N-body model
that reproduces all of this from the choice of impact parameter and
approach speed.

### The restricted N-body setup

Following two full galaxies' worth of self-gravity is expensive, so
the model uses a standard simplification. Each galaxy is an analytic
Hernquist halo whose potential is

$$\Phi(r) = -\frac{G M}{r + a},$$

with scale length $a$. The two halo centers integrate as a softened
two-body problem,

$$\ddot{\mathbf r} = -\,\frac{G(M_1+M_2)}{(|\mathbf r|^2+\epsilon^2)
  ^{3/2}}\,\mathbf r,$$

and each massless tracer star feels the combined live potential of
both halos:

$$\ddot{\mathbf x}_i = -\nabla\big[\Phi_1(\mathbf x_i - \mathbf r_1)
  + \Phi_2(\mathbf x_i - \mathbf r_2)\big].$$

The tracers do not pull back on the halos (hence "restricted"), which
is what makes hundreds of stars cheap to integrate live while still
showing the right tidal dynamics.

### Why tails and bridges form

Stars on the far side of each galaxy are less bound and get
differentially stretched by the companion's tide into a long thin
tidal tail; stars on the near side are pulled across into a bridge
and captured. The two colors interpenetrate and phase-mix into a
diffuse, well-stirred debris field. This is the Toomre and Toomre
(1972) mechanism for tidal tails and bridges, the morphological
fingerprint of an interaction. One honest caveat about the restricted
model: because the tracers do not pull back on the halos, there is no
dynamical friction, so the two halo centers follow a fixed two-body
orbit and do not spiral together on their own. A true coalescence
into a single bound elliptical remnant requires that friction (or a
bound, decaying orbit), which a live full N-body code adds; here you
see the encounter dynamics (approach, tidal distortion, tails and
bridges, dispersed mixed debris) faithfully, which is the part the
restricted model gets right.

### Things to try

- Use a grazing prograde encounter and watch two long symmetric
  tidal tails and a connecting bridge form (the Antennae morphology).
- Increase the relative velocity to a fast flyby: the galaxies pass
  through with only mild distortion.
- Run a slow, low-impact encounter and watch the two colors
  interpenetrate and phase-mix into a diffuse stirred debris field
  (the part the frictionless restricted model captures).

### Where this comes from

The restricted N-body merger model, tidal tails, and elliptical
remnant follow Toomre and Toomre, ApJ 178, 623 (1972), and Binney
and Tremaine, *Galactic Dynamics*, 2nd ed., Chapters 2 and 8.

## Physical setup

Hernquist (1990) density and DF, sampled analytically so the tracers start in equilibrium. Gravity on each tracer: $\mathbf{a} = -\nabla(\Phi_1 + \Phi_2)$ from both halo centers. Halo centers: leapfrog with softening. Units: $M_\odot$, kpc, km/s.

## Controls

- Impact-parameter slider, relative-velocity slider, Launch button
- Preset encounters: direct hit, grazing pass, retrograde, minor merger (3:1)
- Zoom + pan

## Invariants

- Total halo-center energy conserved within 0.1% per 1000 steps.
- Isolated galaxy retains velocity dispersion profile within 5% after 500 steps.
- Head-on merger: > 90% of stars from each galaxy remain bound.

## Status note

Scaffolded with Hernquist DF spec; analytic DF sampler + leapfrog + remnant-classification readout not yet implemented.

## Citations

Hernquist 1990, ApJ 356, 359 (`hernquist1990`).
