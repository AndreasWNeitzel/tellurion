---
title: Fabry-Perot Finesse
slug: fabry-perot-finesse
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3019
supporting_ucs: [MAA-OT]
curriculum_year: bsc-y3s1
primary_citation: hecht2017
primary_chapter: 9
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [optics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Fabry-Perot etalon: Airy transmission and finesse

## Physical setup

Two parallel partial mirrors of intensity reflectance $R$ at spacing $L$ form a Fabry-Perot etalon. Light incident at angle $\theta$ inside the cavity (refractive index $n$) accumulates round-trip phase $\phi = 4 \pi n L \cos\theta / \lambda$. Multiple-beam interference gives the Airy transmission

$$T(\phi) = \frac{1}{1 + F \sin^2(\phi/2)}, \qquad F = \frac{4 R}{(1 - R)^2}.$$

Resonance peaks at $\phi = 2 \pi m$ (integer $m$). The finesse $F_* = \pi \sqrt{R} / (1 - R)$ counts FWHMs per free spectral range.

## Numerical method

Closed-form. Top panel: three FSRs at $\phi \in [-\pi, 5\pi]$; bottom panel: zoom on the $\phi = 2\pi$ peak using a window of width $3 \cdot \mathrm{FWHM}$.

## Controls

- Reflectance $R$ from 0.1 to 0.999.

## Expected qualitative features

1. $R$ near 1: sharp narrow peaks at every multiple of $2\pi$; $T \to 0$ between them.
2. $R$ near 0: peaks broaden and $T_\min$ approaches $1/(1+F)$, far from zero.
3. The zoom panel reveals the FWHM width $\approx 4/\sqrt{F}$ for high $R$.
4. The finesse readout grows from ~10 at $R = 0.7$ to ~313 at $R = 0.99$.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $T(0) = 1$ exact | within $10^{-15}$ | invariants test |
| $T(\pi) = 1/(1+F)$ | within $10^{-12}$ | invariants test |
| $T(2\pi) = 1$ exact | within $10^{-12}$ | invariants test |
| finesse $F_* = \pi\sqrt{R}/(1-R)$ | within $10^{-12}$ | invariants test |
| FSR in frequency $= c/(2nL)$ | within $10^{-6}$ | invariants test |
| FSR scaling: $L \to 2L$ halves FSR | exact | invariants test |
| FWHM shrinks as $R \to 1$ | strict | invariants test |
| coefficient finesse $F = 4R/(1-R)^2$ | within $10^{-12}$ | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $R = 0$: $T = 1$ everywhere (no interference).
- $R \to 1$: peaks become delta functions; ideal high-Q laser cavity.
- $\phi = (2m+1) \pi$: $T = T_\min$ exactly.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Hecht, *Optics*, 5e, Ch. 9 (`hecht2017`).

## Stretch goals

- Add angular dependence: tilt the etalon and watch peaks shift via $\cos\theta$.
- Multi-wavelength input to show the spectrometer use case.
- Time-domain ringdown: photon dwell time in the cavity.

## Risk register

- At $R = 0.999$ the finesse is huge and the peaks are sub-pixel in the top panel. The bottom panel auto-zooms with the FWHM so peaks always render.
