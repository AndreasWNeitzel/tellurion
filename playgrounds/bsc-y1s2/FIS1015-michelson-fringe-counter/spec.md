---
title: Michelson Fringe Counter
slug: michelson-fringe-counter
status: deprecated
superseded_by: michelson-interferometer
audience: portfolio
created: 2026-05-14
primary_uc: FIS1015
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: hecht2017
primary_chapter: 9
hook: 'Nudge one mirror by half a wavelength of light and the whole ring pattern breathes by exactly one fringe; count fringes and you have measured a distance in units of light.'
one_paragraph: 'A Michelson interferometer splits a beam in two, sends each down a separate arm, and recombines them; the path-length difference decides whether they add or cancel. For a slightly divergent source this paints a bullseye of bright and dark rings. Move one arm and every half-wavelength of travel slides exactly one ring through the centre. The playground renders the live ring system and counts the fringes as you scan the arm, which is exactly how Michelson turned an interferometer into a ruler good to a fraction of a micron. Reference: Hecht, Optics, Ch. 9.4.'
tags: [optics, waves, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Michelson fringe counter
Moving one arm of a Michelson interferometer by $\lambda/2$ produces one full fringe at the center. The rendered pattern is the ring system for a divergent source. Source: Hecht Optics Ch. 9.4 (`hecht2017`).

## Explainer

### What you are looking at

A Michelson interferometer splits a beam in two, sends each half down a
mirror arm, and recombines them. With a slightly divergent source the
recombined light forms concentric rings. Move one mirror a hair and the
rings march inward or outward, and counting them measures distance to a
fraction of a wavelength. This is how wavelengths and tiny
displacements were measured before lasers and how gravitational-wave
detectors work today.

### Why moving the mirror by half a wavelength counts one fringe

The two beams travel different round-trip distances. If one mirror
moves by $d$, the path difference changes by $2d$ (the light goes down
the arm and back). A bright ring sits wherever the path difference is a
whole number of wavelengths:

$$2d = m\,\lambda, \qquad m = 0, 1, 2, \dots$$

So each time $d$ increases by $\lambda/2$, the order $m$ at the center
ticks up by one and exactly one fringe is swallowed (or born) at the
center. Counting $\Delta m$ fringes for a mirror move $\Delta d$ gives

$$\lambda = \frac{2\,\Delta d}{\Delta m},$$

a wavelength measurement from nothing but a count and a distance.

### The ring pattern

For a divergent source, rays entering at angle $\theta$ have path
difference $2d\cos\theta$, so the bright fringes are circles of equal
inclination:

$$2d\cos\theta = m\,\lambda.$$

As $d$ changes the whole ring system expands or contracts through the
center, which is the motion you count. The playground draws this ring
system and the fringe counter.

### Things to try

- Step the mirror by exactly $\lambda/2$ and confirm precisely one
  fringe passes the center.
- Move it a known distance and back out $\lambda$ from the count.
- Note the rings are circles of constant $\theta$, densest at the
  center where they appear and vanish.

### Where this comes from

The $2d = m\lambda$ counting rule and the equal-inclination ring
pattern follow Hecht, *Optics*, 5th ed., Section 9.4.
