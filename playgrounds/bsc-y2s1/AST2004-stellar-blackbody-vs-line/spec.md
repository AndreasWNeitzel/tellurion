---
title: Stellar Blackbody + Absorption Lines
slug: stellar-blackbody-vs-line
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST2004
supporting_ucs: [MAA-SP]
curriculum_year: bsc-y2s1
primary_citation: carroll-ostlie
primary_chapter: 3
hook: 'A star''s spectrum is a smooth Planck glow with sharp bites taken out of it; the bites are the fingerprints of the atoms in its atmosphere.'
one_paragraph: 'A star''s continuum is close to a Planck blackbody set by its surface temperature; cooler gas above the photosphere absorbs at specific wavelengths and carves dark lines into that glow. The playground draws the Planck curve as you change temperature (watch the peak slide blueward by Wien''s law) and overlays the hydrogen Balmer, ionized-calcium, and sodium-D absorption lines. It joins two ideas a first spectroscopy course keeps apart: the temperature you read from the continuum shape, and the composition you read from the line pattern. Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 3.'
tags: [stellar, exoplanets, animation, live-readout]
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
# Stellar blackbody + lines
Planck continuum plus Balmer / Ca II / Na D absorption lines. Source: Carroll-Ostlie Ch. 3.

## Explainer

### What you are looking at

A star's spectrum is a smooth glowing background with dark notches
cut into it. The background is thermal (blackbody) radiation that
tells you the temperature; the notches are absorption lines that tell
you the composition. The playground builds both: a Planck continuum
you can set the temperature of, with Balmer, Ca II and Na D lines
carved on top.

### The continuum: Planck's law

A hot opaque gas radiates the blackbody spectrum

$$B_\lambda(T) = \frac{2hc^2}{\lambda^5}\,
  \frac{1}{e^{hc/\lambda k_B T} - 1}.$$

Two consequences set the look of a star: the peak wavelength obeys
Wien's law $\lambda_\mathrm{max}T = 2.9\times10^{-3}$ m K (hot stars
peak blue, cool stars red), and the total power scales as
Stefan-Boltzmann $\propto T^4$. Sliding $T$ slides the colour and
brightness of the continuum.

### The lines: absorption by atoms

Cooler gas in the star's outer layers absorbs photons at the exact
wavelengths that bump its atoms between energy levels (Bohr:
$\Delta E = hc/\lambda$), removing light there and leaving dark
lines. The strength of a line depends on how many atoms are in the
right lower level, which is itself temperature-dependent (Boltzmann
and Saha): the hydrogen Balmer lines peak around 9000 K and weaken
for very hot or very cool stars, which is precisely why the spectral
sequence O B A F G K M is a temperature sequence, not a composition
one. The line shape is a Voigt profile (thermal Doppler core plus
pressure-broadened wings) and its area (equivalent width) measures
the abundance. The playground overlays Balmer, Ca II and Na D on the
Planck curve and lets you watch the continuum colour and the line
strengths respond to temperature.

### Things to try

- Raise $T$ and watch the continuum peak shift blueward (Wien) and
  brighten steeply (Stefan-Boltzmann $T^4$).
- Tune $T$ near 9000 K and watch the hydrogen Balmer lines reach
  maximum strength, then fade at higher and lower $T$.
- Compare the deep narrow Na D doublet against the broad Balmer
  lines (different broadening and abundances).

### Where this comes from

Planck's law, Wien and Stefan-Boltzmann, and the temperature
dependence of stellar absorption lines follow Carroll and Ostlie,
*An Introduction to Modern Astrophysics*, Chapters 3 and 8, and
Gray, *The Observation and Analysis of Stellar Photospheres*.
