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
---

# Michelson interferometer: visibility and coherence length

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
