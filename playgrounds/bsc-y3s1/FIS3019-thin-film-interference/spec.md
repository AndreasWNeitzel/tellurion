---
title: Thin-Film Interference and Iridescent Colors
slug: thin-film-interference
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3019
supporting_ucs: []
curriculum_year: bsc-y3s1
---

# Thin-film interference and iridescent colors

## Physical setup

A thin layer of refractive index n_film and thickness d sits on a substrate.
Default values: n_top = 1.0 (air), n_film = 1.33 (water/oil), n_sub = 1.5
(glass). White light at normal incidence reflects from both interfaces;
the two reflected beams interfere, with the interference pattern depending
on d / lambda.

## Governing equations

Airy formula for two-interface reflectance:
  r12 = (n_top - n_film) / (n_top + n_film)
  r23 = (n_film - n_sub) / (n_film + n_sub)
  delta = 4 pi n_film d / lambda
  R = |r12 + r23 e^{-i delta}|^2 / |1 + r12 r23 e^{-i delta}|^2

For low-high-high stack (n_film between air and glass):
  constructive at lambda = 2 n_film d / m,  m = 1, 2, 3, ...
  destructive at lambda = 2 n_film d / (m + 0.5).

## Numerical method

None. Direct evaluation of the Airy formula at sample wavelengths.

## Controls

- d: film thickness, 50 to 1500 nm.
- n_film: film refractive index, 1.10 to 2.40.
- speed: sweep rate (0 means slider only).
- Reset / Pause / Play.

## Expected qualitative features

1. Small d (~ 100 nm): broad-band, single-color reflection (blue/violet).
2. Mid d (~ 500 nm): two or three colored peaks in R(lambda); reflected
   color is a mix.
3. Large d: many narrow peaks; reflected color is near-white.
4. Increasing n_film shifts peaks to longer wavelengths.

## Invariants and acceptance thresholds

1. R in [0, 1].
2. Constructive maxima at predicted wavelengths.
3. Zero thickness reduces to single-interface reflectance.
4. R periodic in d with period lambda / (2 n_film).
5. constructiveLambda formula correct for low-high-high.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- d = 0: single Fresnel interface.
- n_film = n_sub: only top interface contributes.

## Visual fallback

Canvas2D only. Top: R(lambda) curve with visible-spectrum color strip.
Bottom: reflected color swatch and history strip of color vs d (sweep).

## Citations

- Hecht, Optics 5e Ch. 9.
- Born and Wolf, Principles of Optics Ch. 1.

## Stretch goals

- Oblique incidence (s and p polarization separately).
- Wedge film with continuous thickness gradient.
- Multilayer dielectric mirror.

## Risk register

- Wavelength-to-RGB conversion is a perceptual approximation.
- Spectrum normalization in `reflectedColor` is heuristic; the swatch
  shows qualitative color, not exact CIE XYZ.
