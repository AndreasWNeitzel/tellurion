---
title: Gaussian Beam - ABCD Propagation
slug: laser-gaussian-beam-propagation
status: verified
audience: portfolio
created: 2026-05-17
hook: 'One complex number carries the whole beam: feed q through ray-transfer matrices and a lens snaps a collimated beam to a waist of exactly lambda f / pi w0.'
one_paragraph: 'Gaussian-beam propagation by the ABCD law. The beam is the complex parameter q with 1/q = 1/R - i lambda/(pi w^2); a paraxial element with ray matrix [[A,B],[C,D]] maps q to (A q + B)/(C q + D). Free space gives q -> q + z so the spot follows w(z) = w0 sqrt(1 + (z/zR)^2) with zR = pi w0^2/lambda, and a thin lens refocuses it. The scene is an optical bench: the beam envelope through a draggable lens, with the input and focused waists, the Rayleigh range and the divergence marked, and a readout comparing the exact focused waist to the lambda f / (pi w) limit. The headless sim.js is gate-tested for q = q0 + z, the spot-size law, lens focusing to lambda f / (pi w0), ABCD composition and reversibility, the Rayleigh-range landmarks, the Gouy phase, and two-mirror resonator stability with a self-consistent mode only when stable.'
tags: [optics, laser, abcd, animation, live-readout]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3019
share_state_keys: []
---

# Gaussian Beam - ABCD Propagation

## Physical setup

A Gaussian beam launched from a waist `w0` propagates along an
optical bench and passes through a thin lens of focal length `f` at
an adjustable position.

## Governing equations

`1/q = 1/R - i lambda/(pi w^2)`; element map
`q -> (A q + B)/(C q + D)`. Free space `[[1,z],[0,1]]` so
`q -> q + z`; thin lens `[[1,0],[-1/f,1]]`. `zR = pi w0^2/lambda`,
`w(z) = w0 sqrt(1 + (z/zR)^2)`, divergence `theta = lambda/(pi w0)`,
Gouy phase `psi = atan(z/zR)`. A collimated beam focuses to
`w0' = lambda f/(pi w_lens)`. Two-mirror cavity: stable iff
`0 <= g1 g2 <= 1`, `g_i = 1 - L/R_i`.

## Numerical method

Closed-form complex-`q` bilinear transforms; the focused waist is
found from the propagated `q` (where `Re(1/q) = 0`). Deterministic,
no RNG. Reference: Siegman, Lasers (1986), Ch. 17 and 19
(`siegman1986`); Hecht, Optics (5th ed.), Ch. 13 (`hecht2017`).

## Controls

- input waist w0, wavelength: set the launched beam.
- focal length f: lens strength.
- object z0: the input-waist (object) position; draggable, so it is
  not static at the bench start.
- lens position: also draggable. Dragging grabs whichever of the
  object or the lens is nearer the cursor.
- Reset.

## Expected qualitative features

- Two transverse intensity spots (object vs focus) on one shared
  scale, with a tighter/wider factor, so the focusing is shown, not
  just the envelope: a short `f` collapses the focused spot well
  below the object spot, a long `f` leaves it wider.
- No lens region: the envelope follows the hyperbolic `w(z)`.
- A short-`f` lens makes a tight focus close behind it; a long-`f`
  lens barely bends the beam.
- The focused waist tracks `lambda f/(pi w_lens)` (readout `w0'` vs
  `law`).
- Moving the lens moves and resizes the focus.

## Invariants and acceptance thresholds

- Free space: `q = q0 + z` (1e-12); `w` matches the spot law.
- `zR = pi w0^2/lambda`; `w(zR) = sqrt2 w0`; `R(zR) = 2 zR`.
- Collimated lens focus `= lambda f/(pi w0)` within 0.5 percent,
  waist at `~ f`.
- ABCD composition equals sequential application (1e-10).
- Free-space propagation is reversible (1e-9).
- Gouy phase `0` at the waist, `pi/4` at `zR`, `pi` across a focus.
- Resonator stability `<=> |(A+D)/2| <= 1`; a stable cavity has a
  self-consistent `q` with `Im q > 0`, an unstable one has none.
- Front-focus object images to the back focus.

## Limiting cases for verification

- `f -> infinity`: the lens does nothing, `q` unchanged.
- Collimated input (`zR >> f`): `w0' -> lambda f/(pi w0)`.
- Confocal / plane-parallel cavity: marginal `g1 g2 = 0` or `1`.

## Visual fallback

Static frame: the beam envelope and focus at the captured `f`.

## Citations

- Siegman, Lasers (1986), Ch. 17 and 19 (`siegman1986`).
- Hecht, Optics (5th ed.), Ch. 13 (`hecht2017`).

## Stretch goals

- A multi-element bench (telescope) with several draggable lenses.
- The resonator-stability `g1 g2` chart with the live cavity point.

## Risk register

- `q` near a real axis (planar wavefront) makes `R -> infinity`;
  handled by reading the waist from `Re(1/q) = 0`.
- The envelope is auto-scaled to the largest spot so a tight focus
  next to a wide collimated section both stay on screen.
