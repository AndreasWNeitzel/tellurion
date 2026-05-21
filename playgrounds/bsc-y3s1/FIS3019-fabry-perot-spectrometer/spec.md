---
title: Fabry-Perot Etalon Spectrometer
slug: fabry-perot-spectrometer
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Point a Fabry-Perot etalon at the sodium doublet and raise the mirror reflectance: one blurred line splits cleanly into two as the finesse passes the resolving threshold.'
one_paragraph: 'A Fabry-Perot etalon used as a spectrometer. Multiple-beam interference between two mirrors of reflectance R gives the Airy transmission T = 1/(1 + F sin^2(delta/2)), F = 4R/(1-R)^2, delta = 4 pi d / lambda. The scene scans the plate spacing and plots the Airy comb of each sodium D line (D2 588.995 nm, D1-like second line) and their sum: at low R the peaks are broad and the doublet is one hump; raising R sharpens them (reflectance finesse F* = pi sqrt(R)/(1-R)) until the two lines split. The instrument resolves the doublet when the resolving power R_p = m F* exceeds lambda/dLambda and the free spectral range lambda^2/(2d) exceeds the separation so orders do not overlap. Drag the spacing and the reflectance to watch the doublet emerge from a single blurred hump. Reference: Hecht, Optics, Chapter 9; Born and Wolf, Principles of Optics, Chapter 7.'
tags: [optics, interference, spectroscopy, instrument, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3019
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

# Fabry-Perot Etalon Spectrometer

## Explainer

### What you are looking at

Sodium light is not one yellow line but two, 0.6 nm apart. A
Fabry-Perot spectrometer resolves that doublet by squeezing light
between two mirrors so only razor-sharp resonant wavelengths get
through. The playground scans the mirror spacing and shows the doublet
splitting into separated peaks, with the trade-offs that limit any
spectrometer.

### The instrument

Two mirrors of reflectance $R$, spacing $d$, transmit via multiple-beam
interference with the Airy function

$$T = \frac{1}{1 + F\sin^2(\delta/2)},
  \qquad F = \frac{4R}{(1-R)^2},
  \qquad \delta = \frac{4\pi d}{\lambda}.$$

Transmission peaks where the round-trip phase is a multiple of
$2\pi$, i.e. at order $m = 2d/\lambda$.

### The three numbers that decide everything

- Free spectral range, the wavelength gap between adjacent orders:
  $\mathrm{FSR} = \lambda^2/2d$. Two features further apart than the
  FSR overlap into the next order (ambiguous).
- Finesse, the peak sharpness: $\mathcal F = \pi\sqrt R/(1-R)$, the
  number of resolvable peaks per FSR. High $R$, sharp peaks.
- Resolving power: $R_p = m\,\mathcal F$.

The sodium doublet of separation $\Delta\lambda$ is cleanly resolved
only when $R_p \ge \lambda/\Delta\lambda$ (peaks narrow enough to
separate) and $\mathrm{FSR} > \Delta\lambda$ (no order overlap). That
twin condition is the central lesson: raising $R$ sharpens peaks but
you must also keep the spacing $d$ small enough to avoid order
confusion. The playground sweeps $d$ and $R$ so you see the doublet
resolve and the order overlap appear.

### Things to try

- Raise $R$ and watch the doublet peaks sharpen and separate (finesse
  up).
- Increase $d$ and watch the FSR shrink until adjacent orders collide
  (overlap).
- Find the regime where both conditions hold: that is a usable
  spectrometer setting.

### Where this comes from

The Airy transmission, finesse, free spectral range, and resolving
power follow Hecht, *Optics*, 5th ed., Chapter 9.

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

- A physical-representation band above the spectrum: an etalon
  schematic with the cascade of internal reflections (the number of
  beams still carrying > 1.5 percent grows with R, multiple-beam
  interference made literal) and the concentric ring fringe pattern
  T(theta) the eyepiece sees, both sharpening as R rises.
- Low R: broad Airy peaks; the two lines merge into one hump; few
  bounces; broad blurry rings.
- High R: razor peaks; the doublet splits; many bounces; thin bright
  rings.
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
