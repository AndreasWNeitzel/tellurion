---
title: Sedov-Taylor Blast Wave
slug: sedov-taylor-blastwave
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3014
supporting_ucs: [AST3016]
curriculum_year: bsc-y3s1
primary_citation: shu-vol2
primary_chapter: 17
hook: 'Dump a fixed energy at a point in uniform gas and the blast wave forgets everything except that energy: its radius grows as (E t^2 / rho)^(1/5).'
one_paragraph: 'The Sedov-Taylor solution describes a strong blast wave from a point energy release E into uniform gas of density rho, the model for a supernova remnant in its energy-conserving phase. Once the swept-up mass dominates the ejecta, the only scales left are E, rho and time, so dimensional analysis forces a self-similar expansion with shock radius proportional to (E t^2 / rho)^(1/5) and an interior profile frozen in shape. Taylor famously used this to back out the yield of the first atomic test from declassified fireball photographs. The playground sweeps time and shows the expanding shock and the self-similar profile. Reference: Shu, The Physics of Astrophysics Vol. II, Ch. 17.'
tags: [fluids-mhd, stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Sedov-Taylor blast wave
Self-similar point-explosion blast: $R \propto (E t^2/\rho)^{1/5}$. Source: Shu Vol II Ch. 17 (`shu-vol2`).

## Explainer

### What you are looking at

Release a huge energy at a single point in uniform gas (a supernova, a
nuclear test) and the blast wave that expands forgets every detail
except how much energy was released. Its radius grows by a fixed power
law in time. The playground sweeps time and shows the shock expanding
with its frozen interior profile.

### Why the answer is forced by dimensions

Once the swept-up gas mass dominates the original ejecta, the only
physical quantities left are the released energy $E$, the ambient
density $\rho$, and the elapsed time $t$. There is exactly one way to
combine them into a length, so the shock radius must be

$$R(t) = \xi_0\left(\frac{E\,t^2}{\rho}\right)^{1/5},$$

with $\xi_0$ a pure number of order one. No detailed solution is
needed for the scaling; dimensional analysis alone forces the
$t^{2/5}$ growth. The shock speed therefore falls as $t^{-3/5}$: the
remnant decelerates as it sweeps up mass.

### The self-similar interior

The profiles of density, velocity, and pressure inside the shock do
not change shape, they just rescale with $R(t)$. Writing everything in
the stretched coordinate $r/R(t)$ collapses the whole time evolution
onto one fixed curve (the Sedov similarity solution): most of the mass
is piled up in a thin shell behind the shock, with a near-vacuum
interior. This energy-conserving phase is how a young supernova remnant
evolves for thousands of years. Famously, G. I. Taylor used exactly
this law to back out the yield of the first atomic test from
declassified photographs of the fireball radius versus time.

### Things to try

- Sweep time and confirm the radius follows $t^{2/5}$ (it grows fast
  then visibly slows).
- Raise the energy $E$ and watch the whole evolution scale up by
  $E^{1/5}$.
- Note the interior profile keeps its shape while only its size
  changes, the meaning of self-similarity.

### Where this comes from

The dimensional argument, the $R \propto (Et^2/\rho)^{1/5}$ law, and
the self-similar interior follow Shu, *The Physics of Astrophysics
Vol. II*, Chapter 17 (after Sedov and Taylor).
