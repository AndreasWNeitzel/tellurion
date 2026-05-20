---
title: Cosmic Distance Ladder
slug: distance-ladder-toy
status: superseded
superseded_by: cosmic-distance-ladder
audience: portfolio
created: 2026-05-14
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: carroll-ostlie
primary_chapter: 24
hook: 'No single method reaches across the universe; you bootstrap from parallax to Cepheids to supernovae, and the errors compound at every handoff.'
one_paragraph: 'Cosmic distances are measured by a ladder: parallax calibrates nearby stars, those calibrate Cepheid variables, Cepheids calibrate Type Ia supernovae, and supernovae reach cosmological distances. Each rung is anchored in the overlap region of the one below it, so its zero-point error feeds forward. The playground builds a four-rung ladder and propagates the uncertainty up it, showing how a small calibration shift at the bottom moves the inferred Hubble constant at the top. That error budget is the core of the current Hubble-tension debate. Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 24.'
tags: [cosmology, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Distance ladder toy
Four-rung overlap and error propagation. Source: Carroll-Ostlie Ch. 24 (`carroll-ostlie`).

## Explainer

### What you are looking at

No single method measures distances across the universe. You build a
ladder: a method good for nearby objects calibrates the next, which
calibrates the next. Each rung inherits the errors of the rungs below
it. The playground builds a four-rung ladder and propagates the
uncertainty up, showing why the Hubble constant is so hard to pin down.

### The rungs

- Parallax: trigonometry on Earth's orbit, exact in principle but only
  good for nearby stars.
- Cepheid variables: their pulsation period sets their luminosity (the
  period-luminosity relation), calibrated by parallax.
- Type Ia supernovae: nearly standard candles, calibrated by Cepheids
  in galaxies close enough to host both.
- Hubble flow: distant supernovae plus redshift give the Hubble
  constant.

Each rung is anchored only in the overlap region where it and the rung
below can both be measured.

### How errors compound

If rung $i$ has fractional zero-point uncertainty $\sigma_i$, the
distances at the top carry the sum in quadrature

$$\left(\frac{\sigma_D}{D}\right)^2 \;=\; \sum_i \sigma_i^2,$$

because each calibration multiplies the next. A small systematic at the
bottom (say a 2% Cepheid zero-point shift) propagates straight into the
inferred Hubble constant at the top. That error budget, not statistical
noise, is the heart of the current "Hubble tension" between the
distance-ladder value and the value inferred from the early universe.
The playground lets you perturb a rung and watch the top-level
distance and $H_0$ move.

### Things to try

- Shift the Cepheid zero-point slightly and watch the inferred $H_0$
  move by a comparable fraction (errors multiply up the ladder).
- Widen one rung's overlap region and watch its contribution to the
  total error shrink.
- Add the rungs in quadrature and confirm the bottom rungs dominate
  the final budget.

### Where this comes from

The cosmic distance ladder, its rungs, and the quadrature error
propagation follow Carroll and Ostlie, *An Introduction to Modern
Astrophysics*, 2nd ed., Chapter 24.
