---
title: Secular Perturbations (Laplace-Lagrange)
slug: secular-perturbation-laplace-lagrange
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-SS
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: murray-dermott
primary_chapter: 7
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [exoplanets, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Laplace-Lagrange secular theory
Two-planet eccentricity exchange via mode beating. Source: Murray-Dermott Ch. 7 (`murray-dermott`).

## Explainer

### What you are looking at

Planets tug on each other. Averaged over many orbits the fast motion
cancels and only a slow drift of the orbit shapes survives: the
eccentricities and orientations cycle back and forth over millennia.
The playground shows two planets trading eccentricity like coupled
pendulums, the secular dynamics behind Earth's Milankovitch cycles.

### Secular (orbit-averaged) theory

Average the mutual perturbation over both orbital periods (drop the
fast angles). To leading order in eccentricity the equations for the
eccentricity vectors $(h_j, k_j) = e_j(\sin\varpi_j,\cos\varpi_j)$
become linear:

$$\dot{\mathbf z} = i\,A\,\mathbf z,$$

where $\mathbf z$ stacks the complex eccentricities and $A$ is the
Laplace-Lagrange matrix built from the masses and semi-major axes
(via Laplace coefficients). It is the small-oscillations problem all
over again.

### Eigenmodes and beating

Diagonalize $A$: the system has normal modes, each a fixed combination
of the planets' eccentricities precessing at its own frequency $g_k$.
A general state is a superposition, so each planet's eccentricity is a
sum of sinusoids at the $g_k$ frequencies and *beats*: planet 1's
eccentricity falls while planet 2's rises, then reverses, conserving an
overall "angular-momentum deficit". This linear secular theory
predicts the long-term envelope of planetary eccentricities (the
Milankovitch forcing of ice ages is exactly this mode beating for
Earth). The playground shows the two eccentricities oscillating out of
phase and the underlying normal modes.

### Things to try

- Start one planet eccentric and the other circular and watch the
  eccentricity pour back and forth (mode beating).
- Change the mass ratio or spacing and watch the secular frequencies
  $g_k$ (and the beat period) shift.
- Note the total stays bounded: secular theory conserves the
  angular-momentum deficit; no runaway.

### Where this comes from

The orbit-averaged Laplace-Lagrange secular equations, the eigenmode
diagonalization, and eccentricity beating follow Murray and Dermott,
*Solar System Dynamics*, Chapter 7.
