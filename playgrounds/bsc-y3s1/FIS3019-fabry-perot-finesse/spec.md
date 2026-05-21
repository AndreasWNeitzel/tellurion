---
title: Fabry-Perot Finesse
slug: fabry-perot-finesse
status: superseded
superseded_by: fabry-perot-spectrometer
audience: portfolio
created: 2026-05-13
primary_uc: FIS3019
supporting_ucs: [MAA-OT]
curriculum_year: bsc-y3s1
primary_citation: hecht2017
primary_chapter: 9
hook: 'Scan a Fabry-Perot cavity: it flashes bright and transmits only at the razor-sharp resonances set by the mirror finesse.'
one_paragraph: 'Fabry-Perot finesse made physical: a scanned two-mirror cavity. An input beam undergoes multiple partial reflections; as the round-trip phase is swept the circulating field builds up and the cavity flashes bright at each resonance with a strong transmitted beam, while between resonances it is dark and the light is reflected. Raising the mirror reflectance R sharpens the resonances (higher finesse F* = pi sqrt(R)/(1-R)) until they are razor thin and almost always missed. A synced Airy strip shows T(phi) over three free spectral ranges with a marker tracking the scan, plus the live finesse and T_min. Reference: Hecht, Optics, Chapter 9; Born and Wolf, Principles of Optics, Chapter 7.'
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

# Fabry-Perot etalon: Airy transmission and finesse

## Explainer

### What you are looking at

Two parallel partial mirrors a fixed gap apart. Light bounces between
them many times, and the many reflections interfere. The result is
that the cavity transmits almost nothing except at razor-sharp resonant
wavelengths. This is the Fabry-Perot etalon, the heart of laser
cavities, optical filters, and gravitational-wave detectors.

### Multiple-beam interference

Each round trip adds a phase

$$\phi = \frac{4\pi n L\cos\theta}{\lambda}.$$

Summing the infinite series of partially-reflected beams (a geometric
series) gives the Airy transmission

$$T(\phi) = \frac{1}{1 + F\sin^2(\phi/2)},
  \qquad F = \frac{4R}{(1-R)^2}.$$

Transmission is 1 only when $\phi = 2\pi m$ (an integer number of
half-wavelengths fits the cavity); everywhere else the many beams
destructively interfere and the etalon is dark.

### Finesse: how sharp the peaks are

The coefficient $F$ grows steeply as the mirror reflectance $R\to1$, so
the transmission peaks become extremely narrow. The sharpness is
measured by the finesse:

$$\mathcal F = \frac{\pi\sqrt R}{1-R},$$

the number of resolvable peaks per free spectral range. High
reflectance, high finesse, ultra-narrow lines, which is exactly what
makes a Fabry-Perot a precision wavelength filter and what lets a laser
cavity select a single mode. The playground shows the bouncing beams
decaying as $R^k$, the intracavity standing wave brightening at
resonance, and the Airy curve sharpening as you raise $R$.

### Things to try

- Raise the mirror reflectance $R$ and watch the transmission peaks
  collapse to spikes (finesse climbing).
- Scan the phase and see transmission near zero except at the sharp
  resonances.
- Lower $R$ and watch the peaks broaden into gentle humps (low
  finesse).

### Where this comes from

The Airy multiple-beam transmission, the coefficient of finesse, and
the finesse $\mathcal F = \pi\sqrt R/(1-R)$ follow Hecht, *Optics*,
5th ed., Chapter 9.

## Physical setup

Two parallel partial mirrors of intensity reflectance $R$ at spacing $L$ form a Fabry-Perot etalon. Light incident at angle $\theta$ inside the cavity (refractive index $n$) accumulates round-trip phase $\phi = 4 \pi n L \cos\theta / \lambda$. Multiple-beam interference gives the Airy transmission

$$T(\phi) = \frac{1}{1 + F \sin^2(\phi/2)}, \qquad F = \frac{4 R}{(1 - R)^2}.$$

Resonance peaks at $\phi = 2 \pi m$ (integer $m$). The finesse $F_* = \pi \sqrt{R} / (1 - R)$ counts FWHMs per free spectral range.

## Numerical method

Closed-form Airy transmission from sim.js (unchanged). The scene renders the multiple-beam picture (input, bouncing rays decaying as $R^k$, intracavity standing wave whose brightness tracks the normalised transmitted intensity $T(\phi)$, reflected and transmitted beams scaling with $1-T$ and $T$). A synced strip plots $T(\phi)$ over three FSRs ($\phi \in [-\pi, 5\pi]$) with a scan marker.

## Controls

- Reflectance $R$ from 0.1 to 0.999.

## Expected qualitative features

1. On resonance the cavity is bright and the transmitted beam is strong; off resonance it is dark and the beam is reflected.
2. $R$ near 1: razor-sharp resonances (high finesse), so the scan is almost always off them; $R$ near 0: broad peaks, easily on resonance.
3. The Airy strip shows peak sharpening with $R$ and the FWHM $\approx 4/\sqrt{F}$, with the marker synced to the cavity state.
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
- $\phi = (2m+1) \pi$: $T = T_{\min}$ exactly.

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
