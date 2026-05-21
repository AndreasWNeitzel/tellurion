---
title: Thin-Film Interference and Iridescent Colors
slug: thin-film-interference
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3019
supporting_ucs: []
curriculum_year: bsc-y3s1
hook: 'The colours in an oil slick or a soap bubble are not pigment: the two reflections off a thin film interfere, and which colour survives depends on the thickness.'
one_paragraph: 'A thin transparent film reflects light from its top and bottom surfaces; those two beams interfere with a path difference set by the film thickness and refractive index, plus a half-wave phase flip at a low-to-high index reflection. In white light some wavelengths cancel and others reinforce, so the reflected colour shifts with thickness and viewing angle, the iridescence of soap bubbles, oil films, and beetle shells. The playground sweeps the film thickness and shows the reflected spectrum and the resulting colour. Reference: Hecht, Optics, Ch. 9.'
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

# Thin-film interference and iridescent colors

## Explainer

### What you are looking at

A soap bubble or an oil slick is colorless material, yet it shimmers
with color. The color is not pigment: it is interference between the
light reflected off the top of a thin film and the light reflected off
its bottom. Change the thickness and the color changes. The playground
sweeps the film thickness and shows the reflected spectrum and the
resulting hue.

### The two reflections

Light hits a film of index $n_\text{film}$ and thickness $d$. Part
reflects at the top surface, part travels through, reflects at the
bottom, and comes back out having traveled an extra optical path. The
phase difference between the two emerging beams is

$$\delta = \frac{4\pi\,n_\text{film}\,d}{\lambda},$$

plus a half-wave ($\pi$) flip at any reflection going from lower to
higher index. The full two-interface reflectance is the Airy formula

$$R = \frac{|r_{12} + r_{23}e^{-i\delta}|^2}
  {|1 + r_{12}r_{23}e^{-i\delta}|^2},$$

with Fresnel coefficients $r_{12}, r_{23}$ at the two surfaces.

### Why it makes color

For white light, $\delta$ depends on wavelength, so some colors
interfere constructively and others destructively. For a film between
air and a denser substrate, constructive reflection occurs at

$$\lambda = \frac{2\,n_\text{film}\,d}{m}, \qquad m = 1, 2, 3,\dots$$

and destructive halfway between. As the thickness $d$ changes, the
reinforced wavelength sweeps through the spectrum, which is why a
draining soap film shows moving colored bands and an oil slick is
iridescent. The same effect, by design, makes anti-reflection lens
coatings and dichroic mirrors.

### Things to try

- Sweep the thickness and watch the reflected color cycle through the
  spectrum.
- Make the film very thin ($d \ll \lambda$): it goes dark (the two
  reflections cancel because of the half-wave flip), the black spot on
  a draining soap film.
- Change the film index and watch the fringe spacing and contrast
  shift.

### Where this comes from

The Airy two-interface reflectance, the thin-film phase, and the
constructive/destructive conditions follow Hecht, *Optics*, 5th ed.,
Chapter 9.

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
