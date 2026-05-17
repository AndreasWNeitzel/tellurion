---
title: Fabry-Perot Etalon Spectrometer
slug: fabry-perot-spectrometer
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Point a Fabry-Perot etalon at the sodium doublet and raise the mirror reflectance: one blurred line splits cleanly into two as the finesse passes the resolving threshold.'
one_paragraph: 'A Fabry-Perot etalon used as a spectrometer. Multiple-beam interference between two mirrors of reflectance R gives the Airy transmission T = 1/(1 + F sin^2(delta/2)), F = 4R/(1-R)^2, delta = 4 pi d / lambda. The scene scans the plate spacing and plots the Airy comb of each sodium D line (D2 588.995 nm, D1-like second line) and their sum: at low R the peaks are broad and the doublet is one hump; raising R sharpens them (reflectance finesse F* = pi sqrt(R)/(1-R)) until the two lines split. The instrument resolves the doublet when the resolving power R_p = m F* exceeds lambda/dLambda and the free spectral range lambda^2/(2d) exceeds the separation so orders do not overlap. The headless sim.js is gate-tested for the finesse at R = 0.99, the Airy maxima and minima, the R = 0 transparent limit, the exact FWHM, periodicity and bounds, the FSR, the resolving power and the doublet resolution criterion.'
tags: [optics, interference, spectroscopy, instrument, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3019
share_state_keys: []
---

# Fabry-Perot Etalon Spectrometer

## Physical setup

Two plane mirrors of reflectance `R`, spacing `d`, illuminated by the
sodium doublet. Normal incidence, `n = 1`.

## Governing equations

Airy transmission `T = 1/(1 + F sin^2(delta/2))`, `F = 4R/(1-R)^2`,
`delta = 4 pi d / lambda`. Reflectance finesse
`F* = pi sqrt(R)/(1-R)`. Order `m = 2d/lambda`. Free spectral range
`FSR = lambda^2/(2d)`. Resolving power `R_p = m F*`. The doublet of
separation `dLambda` is resolved when `R_p >= lambda/dLambda` and
`FSR > dLambda` (no order overlap). Exact peak FWHM in phase:
`4 asin(1/sqrt F)`.

## Numerical method

Closed-form evaluation (no iteration); the spacing is scanned over
about three orders and `T(d)` plotted per line plus the sum.
Deterministic, no RNG. Reference: Hecht, Optics (5th ed.), Ch. 9.6
(`hecht2017`); Born and Wolf, Principles of Optics (7th ed.),
Sec. 7.6 (`born-wolf`).

## Controls

- reflectance R: sets the finesse (peak sharpness).
- spacing d: sets the order and the free spectral range.
- line gap dLambda: the doublet separation (Na is ~0.597 nm).
- Reset.

## Expected qualitative features

- Low R: broad Airy peaks; the two lines merge into one hump.
- High R: razor peaks; the doublet splits into two clear lines.
- Small d (large FSR): orders well separated; large d: orders crowd
  and eventually overlap the doublet.
- The `resolved` readout flips yes/no exactly at the threshold.

## Invariants and acceptance thresholds

- `F* ~ 312` at `R = 0.99` (within 1); `F* = pi sqrt(R)/(1-R)`.
- Maxima `T = 1` at `delta = 2 m pi`; minima `1/(1+F)`.
- `R = 0` gives `T = 1` everywhere.
- `0 < T <= 1`, `T` is `2 pi` periodic.
- Exact FWHM `4 asin(1/sqrt F)` matches a numeric half-max width.
- FSR and order consistent; one FSR advances the phase by `2 pi`.
- `R_p = m F*`; the Na doublet resolves only at high R when
  `FSR > dLambda`.
- Higher R sharpens peaks (smaller FWHM, deeper minima).

## Limiting cases for verification

- `R -> 0`: a transparent plate, `T = 1`.
- `R -> 1`: a delta-comb, `T_min -> 0`, FWHM `-> 0`.
- Short etalon (`FSR > dLambda`): resolution set by the finesse.

## Visual fallback

Static frame: the two Airy combs and their sum at the captured R.

## Citations

- Hecht, Optics (5th ed.), Ch. 9.6 (`hecht2017`).
- Born and Wolf, Principles of Optics (7th ed.), Sec. 7.6
  (`born-wolf`).

## Stretch goals

- Add the reflected channel (R = 1 - T for a lossless etalon).
- A pressure- or angle-scanned etalon instead of spacing-scanned.

## Risk register

- A long etalon makes the FSR smaller than the doublet; the orders
  overlap and the resolved flag is correctly false regardless of R.
- The sum is drawn at half scale so it stays within `[0, 1]`.
