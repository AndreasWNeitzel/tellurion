---
title: CMB Power Spectrum (Toy)
slug: cmb-power-spectrum-toy
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-CS
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: liddle-cosmology
primary_chapter: 12
hook: 'The temperature ripples of the cosmic microwave background, sorted by angular size, form a series of acoustic peaks that pin down the universe''s geometry and contents.'
one_paragraph: 'The cosmic microwave background is nearly uniform, but its tiny temperature fluctuations, decomposed by angular scale, form a power spectrum with a characteristic series of acoustic peaks. The first peak''s position fixes the spatial geometry (flat, open, or closed); the relative peak heights weigh baryons against dark matter; small-scale damping reflects photon diffusion. The playground exposes these three controls so you see how each reshapes the curve. Fitting this spectrum is how the cosmological parameters were measured to percent precision. Reference: Liddle, An Introduction to Modern Cosmology, Ch. 12.'
tags: [cosmology, animation, live-readout]
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
# Toy CMB temperature power spectrum
Three free parameters: first-peak position, damping scale, amplitude. Source: Liddle Ch. 12 (`liddle-cosmology`).

## Explainer

### What you are looking at

The cosmic microwave background is almost perfectly uniform, but its
one-part-in-100,000 temperature ripples, sorted by angular size, form a
series of acoustic peaks. The position and heights of those peaks pin
down the geometry and contents of the universe. The playground exposes
three knobs and shows the spectrum respond.

### Sound in the early universe

Before recombination the photon-baryon plasma oscillated: gravity
compressed overdense regions, radiation pressure pushed back, sound
waves. At recombination these standing waves froze, imprinting a
harmonic series on the CMB. Decomposed into spherical harmonics, the
temperature power spectrum $C_\ell$ versus multipole $\ell$ (small
$\ell$ = large angles) shows:

- A first acoustic peak whose multipole position $\ell_1$ measures the
  spatial geometry: $\ell_1\approx220$ for a flat universe; a curved
  universe shifts it.
- Relative peak heights set by the baryon and dark-matter densities
  (baryons load the oscillator, deepening compression peaks).
- A damping tail at high $\ell$ (Silk damping): photon diffusion
  smears small-scale ripples, an exponential cutoff.

The toy model parameterizes exactly these three: first-peak position,
damping scale, and overall amplitude. Fitting the real spectrum to this
shape is how $\Omega_k$, $\Omega_b$, $\Omega_c$ and the rest were
measured to percent precision by WMAP and Planck.

### Things to try

- Move the first-peak position and read it as the geometry knob
  (flat vs curved).
- Change the amplitude and damping scale and watch the tail rise/fall
  and cut off earlier or later.
- Note the regular harmonic spacing: these are overtones of one
  primordial sound wave.

### Where this comes from

The acoustic-peak structure, the first-peak geometry diagnostic, and
Silk damping follow Liddle, *An Introduction to Modern Cosmology*,
Chapter 12, and Dodelson, *Modern Cosmology*.
