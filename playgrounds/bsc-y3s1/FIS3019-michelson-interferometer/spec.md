---
title: Michelson Interferometer
slug: michelson-interferometer
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3019
supporting_ucs: [MAA-OT]
curriculum_year: bsc-y3s1
primary_citation: hecht2017
primary_chapter: 9
hook: 'Slide one mirror of a Michelson interferometer and the fringes march by; how far they stay sharp measures the light''s coherence length.'
one_paragraph: 'A Michelson interferometer splits a beam, sends the halves down two arms, and recombines them; moving one mirror by d changes the path difference by L = 2d and sweeps the detector through bright and dark fringes spaced by the wavelength. The fringe contrast does not last forever: its visibility falls as the path difference approaches the source coherence length L_c, here as exp(-(L/L_c)^2), which is equivalent to measuring the spectral bandwidth Delta nu ~ 0.44 c / L_c. A laser stays coherent over kilometres, sunlight over under a micron. The playground sweeps L and shows I(L) with the visibility envelope. Reference: Hecht, Optics, Ch. 9.'
tags: [optics, animation, live-readout]
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

# Michelson interferometer: visibility and coherence length

## Explainer

### What you are looking at

Split a beam, send the halves down two mirror arms, recombine them. As
you slide one mirror the detector brightens and dims through fringes.
How far you can slide before the fringes wash out measures how
"coherent" the light is, which is the same as measuring its spectral
purity. This is the instrument behind Fourier spectroscopy and
gravitational-wave detectors.

### The fringe pattern

Moving one mirror by $d$ changes the path difference by $L = 2d$. The
recombined intensity is

$$I(L) = \tfrac12\big[\,1 + V(L)\cos(2\pi L/\lambda)\,\big].$$

The cosine is the fringe (one full cycle per wavelength of path
change). $V(L)$ is the visibility (fringe contrast), and it does not
stay at 1.

### Coherence length sets the envelope

Real light is not a perfect single frequency; it is a band. Different
frequencies drift out of step as the path difference grows, so the
fringe contrast decays:

$$V(L) = e^{-(L/L_c)^2},$$

where $L_c$ is the coherence length. Equivalently it measures the
source bandwidth, $\Delta\nu \approx 0.44\,c/L_c$. A laser has
$L_c$ of kilometers (kHz bandwidth, fringes for a very long slide);
sunlight has $L_c$ under a micron (fringes vanish almost immediately).
Measuring how the contrast falls off is a direct measurement of the
spectrum (the Wiener-Khinchin idea behind FTIR spectroscopy). The
playground sweeps $L$ and shows $I(L)$ under its decaying envelope.

### Things to try

- Increase the coherence length and watch the fringes survive to much
  larger path differences.
- Shrink it (broadband source) and watch the envelope collapse near
  $L = 0$.
- Note the fringe spacing is always one wavelength; only the contrast
  envelope changes.

### Where this comes from

The Michelson fringe intensity, the visibility-coherence relation, and
the bandwidth link follow Hecht, *Optics*, 5th ed., Chapter 9.

## Physical setup

A Michelson interferometer with one moving mirror produces a path difference $L = 2d$ between the two arms. The detector intensity is

$$I(L) = \tfrac12 \left[1 + V(L) \cos(2 \pi L / \lambda)\right],$$

with the visibility $V(L) = e^{-(L/L_c)^2}$ for a source of Gaussian temporal coherence length $L_c$. The fringe spacing equals $\lambda$; the envelope falls off as $L$ approaches and exceeds $L_c$.

The implied spectral bandwidth is $\Delta\nu \approx 0.4413\,c / L_c$. A laser ($L_c$ kilometers) has $\Delta\nu \sim$ kHz; sunlight ($L_c \sim 0.4$ um) has $\Delta\nu \sim$ PHz.

## Numerical method

Closed-form. Single-axis plot of $I(L)$ over $\pm \max(6\lambda, 1.5 L_c)$ with the visibility envelope dashed.

## Controls

- Wavelength $\lambda$ (400 to 700 nm).
- $\log_{10}(L_c / \mathrm{nm})$ from 2 to 9 (100 nm to 1 m).

## Expected qualitative features

1. Sharp fringes near $L = 0$ regardless of $L_c$.
2. As $|L|$ grows past $L_c$, fringes wash out (envelope shrinks).
3. Increasing $L_c$ stretches the envelope; fringes persist further.
4. Reducing $\lambda$ shortens the fringe period.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $V(0) = 1$ exact | within $10^{-15}$ | invariants test |
| $V(L_c) = 1/e$ | within $10^{-12}$ | invariants test |
| $V \to 0$ for $L \gg L_c$ | $< 10^{-40}$ at $L = 10 L_c$ | invariants test |
| intensity at $L = 0$ is 1 | within $10^{-15}$ | invariants test |
| fringe period equals $\lambda$ | within $10^{-12}$ | invariants test |
| half-fringe gives minimum (near zero) | within $10^{-12}$ | invariants test |
| bandwidth grows when $L_c$ shrinks | strict | invariants test |
| fringesPerMicron $= 2000 / \lambda_\mathrm{nm}$ | exact | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $L_c \to \infty$ (laser): pure cosine, no envelope.
- $L_c \to 0$ (white light): visibility collapses except near $L = 0$; only the central fringe is visible.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Hecht, *Optics*, 5e, Ch. 9 (`hecht2017`).
- Companion playgrounds: `fabry-perot-finesse` (multi-beam interference), `thin-film-interference` (two-beam).

## Stretch goals

- Multi-line source (e.g., sodium doublet) showing beats in the visibility envelope.
- Switch to chirped source (FTIR style) and recover the spectrum from the interferogram.

## Risk register

- At $L_c = 100$ nm the envelope barely encloses a few fringes; visually fine.
- Very large $L_c$ pushes the plot range out; auto-zoom uses $1.5 L_c$ when $L_c > 4\lambda$.
