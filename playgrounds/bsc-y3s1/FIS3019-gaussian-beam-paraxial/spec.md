---
title: Paraxial Gaussian Beam (TEM_00)
slug: gaussian-beam-paraxial
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3019
supporting_ucs: []
curriculum_year: bsc-y3s1
hook: 'A laser beam is not a pencil ray: it has a narrowest waist, then spreads as a hyperbola, and the tighter you focus it the faster it diverges.'
one_paragraph: 'The fundamental TEM_00 laser mode is a Gaussian beam, not a ray. It is narrowest at the waist (1/e^2 radius w_0) and spreads hyperbolically: the spot radius is w(z) = w_0 sqrt(1 + (z/z_R)^2), set by the Rayleigh range z_R = pi w_0^2 / lambda, while the wavefront curvature goes from flat at the waist to spherical far away. The tighter the waist, the shorter z_R and the faster the beam diverges, which is the diffraction limit you cannot beat. The playground sweeps w_0 and wavelength and draws the envelope, waist, and wavefronts. Reference: Saleh and Teich, Fundamentals of Photonics, Ch. 3.'
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

# Paraxial Gaussian beam (TEM_00)

## Explainer

### What you are looking at

A laser beam is not a parallel pencil of light. It has a narrowest
point (the waist), and on either side it flares out as a hyperbola. The
tighter you focus it, the faster it spreads, a hard limit set by
diffraction. The playground shows the waist, the hyperbolic envelope,
and the curving wavefronts.

### The beam and its scales

The fundamental TEM_00 laser mode has a Gaussian intensity profile

$$I(r, z) = I_0\left(\frac{w_0}{w(z)}\right)^2
  \exp\!\left(-\frac{2 r^2}{w(z)^2}\right),$$

narrowest at the waist ($1/e^2$ radius $w_0$). The single scale that
governs everything is the Rayleigh range

$$z_R = \frac{\pi w_0^2}{\lambda},$$

the distance over which the beam stays roughly collimated. The spot
size, wavefront curvature, and an extra phase then follow:

$$w(z) = w_0\sqrt{1 + (z/z_R)^2}, \quad
  R(z) = z\left(1 + (z_R/z)^2\right), \quad
  \eta(z) = \arctan(z/z_R).$$

### The diffraction trade-off

Far from the waist the beam spreads at the divergence half-angle

$$\theta = \frac{\lambda}{\pi w_0}.$$

Read it: a tight waist (small $w_0$) gives a short $z_R$ and a large
$\theta$. You cannot have a beam that is both tightly focused and
stays collimated; the product $w_0\theta = \lambda/\pi$ is fixed by the
wavelength. That is the diffraction limit in one line, the same reason
a small telescope cannot resolve fine detail. The extra Gouy phase
$\eta(z)$ is a real $\pi$ phase slip a focused beam picks up passing
through its waist, important for cavity resonance. The playground
sweeps $w_0$ and $\lambda$ so the scalings are visible.

### Things to try

- Shrink the waist $w_0$ and watch the beam flare faster ($\theta
  \propto 1/w_0$, $z_R \propto w_0^2$).
- Increase the wavelength and watch the same flaring (longer waves
  diffract more).
- Note the wavefronts: flat at the waist, most curved near $z_R$,
  spherical far away.

### Where this comes from

The Gaussian-beam profile, Rayleigh range, spot-size and curvature
laws, Gouy phase, and the divergence limit follow Saleh and Teich,
*Fundamentals of Photonics*, Chapter 3.

## Physical setup

The fundamental TEM_00 mode of a laser cavity, modeled in the paraxial (slowly varying envelope) limit. The beam is narrowest at z = 0 with 1/e^2 intensity radius w_0; it expands hyperbolically along z as it propagates.

## Governing equations

  z_R = pi w_0^2 / lambda                              (Rayleigh range)
  w(z) = w_0 sqrt(1 + (z / z_R)^2)                    (spot radius)
  R(z) = z (1 + (z_R / z)^2)                          (radius of curvature)
  eta(z) = atan(z / z_R)                              (Gouy phase)
  I(r, z) = I_0 (w_0 / w(z))^2 exp(-2 r^2 / w(z)^2)   (intensity)

Far-field divergence half-angle theta = lambda / (pi w_0).

## Numerical method

Closed-form analytic profile. 320 x 200 grid covering [-z_max, +z_max] x [-r_max, +r_max] with r_max = 4 w_0. Gamma 0.5 for display so faint tails near the Gaussian wings remain visible.

## Controls

- w_0: beam waist, slider 0.05 - 0.50, default 0.20
- lambda: wavelength, slider 0.005 - 0.080, default 0.020
- z range: half-width of the displayed z axis, 1 - 10, default 4.0

## Expected qualitative features

1. At z = 0 the spot is narrowest; the heatmap shows a tight bright bar.
2. At z = +/- z_R the spot has grown to sqrt(2) w_0; the dashed red markers identify these positions.
3. Far from the waist (|z| >> z_R), the +/- w(z) curves are nearly linear with slope +/- theta.
4. Smaller w_0 at fixed lambda gives a larger far-field divergence (uncertainty trade-off).

## Invariants and acceptance thresholds

- z_R = pi w_0^2 / lambda (closed form to 12 sig figs).
- w(0) = w_0; w(z_R) = sqrt(2) w_0.
- Far field: w(z) -> z lambda / (pi w_0) within 1e-3 relative for z = 50 z_R.
- Power through aperture of radius w(z): 1 - e^{-2} ~ 0.865 (Siegman 17.51) at any z.
- Intensity field peak at z = 0, r = 0 (within grid resolution).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- lambda -> 0: z_R -> infinity, w(z) -> w_0 (no diffraction).
- w_0 -> 0 at fixed lambda: theta diverges (impossible to focus to a point).
- z -> infinity: hyperbolic envelope flattens to straight lines.

## Visual fallback

Canvas2D only.

## Citations

- Siegman 1986, Lasers, Chapter 17 (`siegman1986`).
- Hecht 2017, Optics, 5e, Section 13.1 (`hecht2017`).
- Born and Wolf 1999, Principles of Optics, 7e, Section 13.4.

## Stretch goals

- Add a higher-order Hermite-Gauss (HG_mn) mode selector.
- Add a "thin lens" location that re-focuses the beam to a new waist.
- Overlay the wavefront contours (constant phase surfaces).

## Risk register

- At very small lambda (< 0.005) z_R becomes huge and the displayed field is uniformly bright; the slider lower bound prevents this.
- At w_0 < 0.05 the spot becomes a single pixel at the chosen grid resolution; clamp prevents.
