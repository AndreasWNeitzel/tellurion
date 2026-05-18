---
title: Rotational Splitting of Multiplets
slug: rotational-splitting-multiplets
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-AS
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: aerts-asteroseism
primary_chapter: 3
hook: 'A non-rotating star''s oscillation modes are degenerate; spin the star and each splits into a frequency multiplet whose spacing measures the rotation rate.'
one_paragraph: 'Without rotation, a stellar oscillation mode of degree l has 2l+1 components (the azimuthal orders m) at one shared frequency. Rotation lifts that degeneracy: prograde and retrograde modes shift in opposite directions, splitting the mode into an evenly spaced multiplet with spacing proportional to m(1 - C_nl)Omega, where Omega is the rotation rate and C_nl the Ledoux constant. The playground fans the (2l+1) multiplet out as you spin the star. Measuring that splitting in Kepler light curves is how the internal rotation of red giants and subgiants was determined. Reference: Aerts, Christensen-Dalsgaard and Kurtz, Asteroseismology, Ch. 3.8.'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Rotational splitting
Rigid rotation splits a $(2\ell+1)$-fold multiplet by $m(1-C)\Omega$. Source: Aerts et al. Ch. 3.8 (`aerts-asteroseism`).

## Explainer

### What you are looking at

In a non-rotating star all the modes of a given degree $\ell$ share
exactly one frequency, a single sharp peak. Spin the star and that
peak splits into an evenly spaced comb, just like the Zeeman effect
splits spectral lines in a magnetic field. The size of the splitting
measures how fast the star rotates, and which layers do the rotating.
The playground shows a single peak fanning into its multiplet as you
turn up the rotation.

### Why rotation lifts the degeneracy

A mode of degree $\ell$ has $2\ell+1$ azimuthal patterns labelled by
$m = -\ell,\dots,+\ell$. In a spherical star they are degenerate.
Rotation breaks the spherical symmetry: prograde and retrograde
patterns ($\pm m$) no longer ring at the same frequency. To first
order in a slowly, rigidly rotating star the observed frequency of
each component is

$$\nu_{n\ell m} = \nu_{n\ell} + m\,(1 - C_{n\ell})\,
  \frac{\Omega}{2\pi},$$

so the single line becomes a $(2\ell+1)$-component multiplet with a
uniform splitting

$$\delta\nu = (1 - C_{n\ell})\,\frac{\Omega}{2\pi}.$$

Here $\Omega$ is the rotation rate and $C_{n\ell}$ is the Ledoux
constant, a mode-dependent number (near 0 for pure p-modes, near
$1/[\ell(\ell+1)]$ for high-order g-modes) that encodes the Coriolis
back-reaction.

### Reading the star's internal rotation

The headline use: the splitting is proportional to the rotation rate
weighted by where the mode has its amplitude. p-modes (envelope) and
g-dominated mixed modes (core) give different splittings in the same
star, which is exactly how asteroseismology discovered that red-giant
cores rotate far faster than their envelopes. The playground sweeps
$\Omega$ and the Ledoux $C$ and shows the comb widen linearly and the
g-modes split less than the p-modes for the same spin.

### Things to try

- Set $\Omega = 0$ and watch all $2\ell+1$ components collapse onto
  one peak.
- Increase $\Omega$ and watch the multiplet fan out with uniform
  spacing $\propto\Omega$.
- Raise the Ledoux $C$ toward the g-mode value and watch the same
  rotation produce a smaller splitting.

### Where this comes from

The first-order rotational splitting, the Ledoux constant, and the
multiplet structure follow Aerts, Christensen-Dalsgaard and Kurtz,
*Asteroseismology*, Chapter 3.8.
