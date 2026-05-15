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
