---
title: Fresnel and Snell at an Interface
slug: fresnel-snell-3d-interface
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Tune to Brewster and the reflected p-beam simply switches off; tip past the critical angle and the light cannot leave at all.'
one_paragraph: 'Reflection and refraction at a planar dielectric interface. The refracted beam bends by Snell, the Fresnel equations fix the s- and p-reflectance, the reflected p-beam vanishes at Brewster theta_B = atan(n2/n1), and from a dense to a rare medium beyond the critical angle the wave is totally internally reflected with an evanescent skin. Energy is conserved, R + T = 1. The primary scene is the physical interface with incident, reflected and refracted beams whose width tracks the power and a polarization-state inset; the side panel is the Fresnel R_s, R_p versus angle with the Brewster and critical markers. The headless sim.js is gate-tested for Snell to 0.01 deg, the Brewster zero, energy conservation, total internal reflection with a positive evanescent decay, the normal-incidence coincidence and the grazing limit.'
tags: [optics, electromagnetism, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2006
share_state_keys: []
---

# Fresnel and Snell at an Interface

## Physical setup

A plane wave of chosen polarization strikes the boundary between two
non-absorbing media of refractive indices n1 and n2 at a variable
angle of incidence.

## Governing equations

Snell: `n1 sin(th1) = n2 sin(th2)`. Fresnel amplitude coefficients
(Hecht convention)

`r_s = (n1 c1 - n2 c2)/(n1 c1 + n2 c2)`,
`r_p = (n2 c1 - n1 c2)/(n2 c1 + n1 c2)`,

with `c1 = cos th1`, `c2 = cos th2`. `R = |r|^2`,
`T = (n2 c2)/(n1 c1) |t|^2`, and `R + T = 1`. Brewster
`th_B = atan(n2/n1)` gives `r_p = 0`; for `n1 > n2` above
`th_c = asin(n2/n1)` the wave is totally internally reflected
(`R = 1`) and `cos th2` is imaginary, an evanescent field decaying as
`exp(-k0 sqrt(n1^2 sin^2 th1 - n2^2) z)`.

## Numerical method

Closed-form Fresnel with a small complex helper so the total internal
reflection branch (imaginary `cos th2`) is exact; the beams are drawn
with width proportional to `sqrt(R)` or `sqrt(T)`. Reference: Hecht,
*Optics* (5th ed.), Sec. 4.6 (`hecht2017`); Jackson, *Classical
Electrodynamics* (3rd ed.), Sec. 7.3.

## Controls

- incidence angle (deg): sweeps through Brewster and the critical
  angle.
- n1, n2: refractive indices (set the Brewster and critical angles).
- polarization: p (TM), s (TE) or unpolarized; the inset shows the
  E-field orientation.
- Reset, Pause.

## Expected qualitative features

- The refracted beam bends toward the normal entering a denser medium.
- At Brewster the reflected p-beam disappears entirely (the readout
  R_p goes to zero).
- From glass to air past the critical angle there is no refracted
  beam, only an evanescent skin, and R = 1.
- Energy is conserved at every angle below TIR.

## Invariants and acceptance thresholds

- Snell's law satisfied within 0.01 deg.
- `R_p = 0` at `th_B` (< 1e-9), a strict minimum; `R_s` has no zero.
- `R_s + T_s = 1` and `R_p + T_p = 1` within 1e-4 below TIR.
- Above `th_c`: `R_s = R_p = 1` within 1e-9, `T = 0`, evanescent
  decay positive and increasing with angle.
- Normal incidence: `R_s = R_p = ((n1-n2)/(n1+n2))^2`.
- Grazing incidence reflects fully; `n1 = n2` gives `R = 0, T = 1`.

## Limiting cases for verification

- `th1 -> 90 deg`: `R -> 1` for both polarizations.
- `n1 = n2`: no interface, no reflection.

Source: Hecht, *Optics* (5th ed.), Sec. 4.6 (`hecht2017`).
