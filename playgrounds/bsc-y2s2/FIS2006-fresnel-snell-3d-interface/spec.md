---
title: Fresnel and Snell at an Interface
slug: fresnel-snell-3d-interface
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Tune to Brewster and the reflected p-beam simply switches off; tip past the critical angle and the light cannot leave at all.'
one_paragraph: 'Reflection and refraction at a planar dielectric interface. The refracted beam bends by Snell, the Fresnel equations fix the s- and p-reflectance, the reflected p-beam vanishes at Brewster theta_B = atan(n2/n1), and from a dense to a rare medium beyond the critical angle the wave is totally internally reflected with an evanescent skin. Energy is conserved, R + T = 1. The primary scene is the physical interface with incident, reflected and refracted beams whose width tracks the power and a polarization-state inset; the side panel is the Fresnel R_s, R_p versus angle with the Brewster and critical markers. Reference: Hecht, Optics, 5th ed., Section 4.6; Jackson, Classical Electrodynamics, 3rd ed., Section 7.3.'
tags: [optics, electromagnetism, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2006
primary_citation: hecht2017
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
references:
  - "Griffiths, Introduction to Quantum Mechanics, Third ed."
---

# Fresnel and Snell at an Interface

## Explainer

### What you are looking at

When light hits glass it partly reflects and partly bends through.
Exactly how much of each depends on the angle and the polarization.
The playground sweeps the incidence angle and shows two special
angles: Brewster, where the reflection of one polarization switches
off entirely, and the critical angle, beyond which the light cannot
leave a dense medium at all.

### Snell and the Fresnel coefficients

The refracted ray obeys Snell's law,

$$n_1\sin\theta_1 = n_2\sin\theta_2,$$

with refractive indices $n_1,n_2$ and angles to the normal
$\theta_1,\theta_2$. How much amplitude reflects is set by the Fresnel
coefficients for the two polarizations (s, electric field in the
surface; p, in the plane of incidence):

$$r_s=\frac{n_1 c_1-n_2 c_2}{n_1 c_1+n_2 c_2},\qquad
  r_p=\frac{n_2 c_1-n_1 c_2}{n_2 c_1+n_1 c_2},$$

where $c_1=\cos\theta_1$, $c_2=\cos\theta_2$. The reflectance is
$R=|r|^2$ and energy is conserved, $R+T=1$.

### Brewster and total internal reflection

At the Brewster angle $\theta_B=\arctan(n_2/n_1)$ the p-reflectance
$r_p$ is exactly zero: reflected light is then purely s-polarized
(this is how polarizing sunglasses work). Going from a dense to a rare
medium ($n_1>n_2$), beyond the critical angle
$\theta_c=\arcsin(n_2/n_1)$ there is no refracted ray at all: the wave
is totally internally reflected, $R=1$, with only an evanescent field
that decays exponentially into the second medium.

### Things to try

- Tune to Brewster and watch the reflected p-beam vanish.
- Set glass-to-air and sweep past the critical angle into total
  internal reflection.
- Check $R+T=1$ holds at every angle below the critical angle.

### Where this comes from

Snell's law, the Fresnel equations, Brewster's angle and total
internal reflection follow Hecht, Optics, 5th ed., Section 4.6, and
Jackson, Classical Electrodynamics, 3rd ed., Section 7.3.

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
*Optics* (5th ed.), Sec. 4.6; Jackson, *Classical
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

Source: Hecht, *Optics* (5th ed.), Sec. 4.6.
