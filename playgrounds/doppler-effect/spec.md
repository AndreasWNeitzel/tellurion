---
title: Doppler Effect from a Moving Source
slug: doppler-effect
status: verified
audience: portfolio
created: 2026-05-13
---

# Doppler effect from a moving source

## Physical setup

A point source moves with constant velocity v in the +x direction. In its
own rest frame it emits a sinusoidal signal of frequency f, so it emits a
discrete wavefront every period T = 1 / f. Each wavefront propagates
isotropically at speed c. A stationary observer detects compressed
wavefronts in front of the source and stretched ones behind it.

## Governing equations

Non-relativistic source-moving Doppler formula:
  f_obs = f / (1 - (v / c) cos(theta))

where theta is the angle from the source's velocity vector to the
observer. Special cases:
  theta = 0:     f_obs = f / (1 - v / c)        (blue-shifted, in front)
  theta = pi:    f_obs = f / (1 + v / c)        (red-shifted, behind)
  theta = pi / 2: f_obs = f                     (no shift, perpendicular)

## Numerical method

Each frame the time advances by dt = 0.02. Whenever simulation time crosses
a multiple of T = 1, a new wavefront is recorded at the current source
position. Wavefronts are rendered as concentric circles with radius
r = (t - t_emit) c.

## Controls

- v / c: source speed, 0 to 0.95.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. v = 0: concentric circles centered on the (stationary) source.
2. 0 < v < c: front circles pile up tightly; back circles space out.
3. v approaches c: front wavefronts piled almost on top of each other.
4. Bar chart in lower panel shows the asymmetry of f_obs(theta) curve
   relative to the f = 1 reference line.

## Invariants and acceptance thresholds

1. v = 0: f_obs = f at every angle within 1e-12.
2. f_obs(theta = 0) = f / (1 - v / c) exact.
3. f_obs(theta = pi) = f / (1 + v / c) exact.
4. f_obs(theta = pi / 2) = f in non-relativistic limit.
5. Reciprocal: f_obs * T_obs = 1 within 1e-12.
6. Wavefront radius = c (t - t_emit) within 1e-10.
7. Subsonic stability: no wavefront escapes |r| > 20.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- v = 0: no Doppler.
- v / c approaches 1: arbitrarily large f_obs in front.

## Visual fallback

Canvas2D only. Top scene: source + wavefronts + two stationary observers.
Bottom: f_obs(theta) curve with reference line at f = 1.

## Citations

- Crawford, Waves and Oscillations Ch. 4 (`crawford-waves`).
- French, Vibrations and Waves Ch. 7 (alternate).

## Stretch goals

- Supersonic regime (v > c) showing the shock cone.
- Moving observer (relativistic full Doppler).
- Audible playback at the observed frequency.

## Risk register

- The non-relativistic source-moving formula does not include the
  relativistic transverse Doppler. For v close to c this would shift
  f_obs(pi/2) below f.
