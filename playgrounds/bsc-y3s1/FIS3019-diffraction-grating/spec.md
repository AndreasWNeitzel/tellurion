---
title: The Diffraction Grating
slug: diffraction-grating
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3019
curriculum_year: bsc-y3s1
primary_citation: hecht-optics
primary_chapter: 10
hook: "Many slits sharpen the fringes of two into needle-thin orders. Add more slits and each one knives in, the resolving power R = mN that powers every spectrometer."
one_paragraph: "A grating of N slits produces the Fraunhofer intensity I = (sin beta / beta)^2 (sin N alpha / (N sin alpha))^2: the single-slit envelope times the N-slit interference factor, which spikes at the grating equation d sin theta = m lambda. Between each pair of principal maxima there are N-1 zeros and N-2 weak secondary maxima, and the principal peaks sharpen as 1/N, the resolving power R = mN. The playground paints the pattern as a coloured strip of orders above the intensity profile and its envelope, with labelled orders and a draggable cursor, and zooms one order to show the secondary maxima and the 1/N narrowing."
tags: [optics, diffraction, grating, interference, interactive, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [N, d, l]
invariants:
  - key: equation
    label: principal maxima at the grating equation d sin theta = m lambda
    tolerance: 1e-6
  - key: secondary
    label: N-1 zeros and N-2 secondary maxima between adjacent orders
    tolerance: 0.0
  - key: sharpening
    label: the principal-peak width shrinks as 1/N (resolving power R = mN)
    tolerance: 1e-9
what_to_try:
  - Raise the slit count N; the orders knife in (width ~ 1/N) and the secondary maxima fade.
  - Change the spacing d; the orders crowd or spread per d sin theta = m lambda.
  - Slide the wavelength; each order shifts angle (the dispersion of a spectrometer).
references:
  - "Hecht, Optics, 5th ed., Sec. 10.2.7 (the diffraction grating)."
  - "Born and Wolf, Principles of Optics, 7th ed., Sec. 8.6."
---

# The diffraction grating

## Physical setup

A grating of N slits, each of width a, spaced by d, diffracts monochromatic light
to a distant screen (Fraunhofer regime).

## Equations

$$ I(\theta) = \left(\frac{\sin\beta}{\beta}\right)^2 \left(\frac{\sin N\alpha}{N\sin\alpha}\right)^2, \quad \beta = \frac{\pi a\sin\theta}{\lambda}, \quad \alpha = \frac{\pi d\sin\theta}{\lambda}, $$

with principal maxima at $d\sin\theta = m\lambda$, N-2 secondary maxima between
them, and resolving power $R = mN$.

## Numerical method

No engine. The intensity is the closed-form N-slit formula; the brightness strip
maps wavelength to colour. No fabricated values.

## Controls

- Number of slits N, spacing d, wavelength; drag the cursor.

## Expected qualitative features

1. Sharp principal orders at the grating equation, under the single-slit envelope.
2. N-2 secondary maxima between adjacent orders.
3. The orders sharpen as N grows (resolving power) and shift with wavelength.

## Invariants and acceptance thresholds

- Principal maxima at $d\sin\theta = m\lambda$.
- N-1 zeros, N-2 secondary maxima between orders.
- Peak width $\sim 1/N$, $R = mN$.

## Citations

Hecht, Optics, 5th ed., Sec. 10.2.7. Born and Wolf, Principles of Optics, 7th ed.,
Sec. 8.6.
