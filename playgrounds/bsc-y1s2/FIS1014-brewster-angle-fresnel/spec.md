---
title: Brewster Angle and Fresnel Equations
slug: brewster-angle-fresnel
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1014
primary_citation: hecht2017
supporting_ucs: [FIS3019]
curriculum_year: bsc-y1s2
hook: "Light hitting glass at one special angle reflects only one polarization; the other passes straight through. That is Brewster's angle, why polarized sunglasses kill glare and why laser windows are cut at a slant."
one_paragraph: "When light crosses a boundary between two media the Fresnel equations give how much reflects for each polarization. The s-polarization (perpendicular to the plane of incidence) always reflects something, but the p-polarization (in the plane) has a reflectance that drops exactly to zero at the Brewster angle, theta_B = arctan(n2/n1), where the reflected and refracted rays are 90 degrees apart. The top scene fires a beam at the interface and brightens the reflected and refracted rays with their Fresnel intensity (with flowing photons); at Brewster the p-reflection vanishes and the right-angle marker appears. The bottom diagnostic plots R_s and R_p versus incidence angle, with the Brewster zero and the total-internal-reflection cliff (for the dense-to-rare case). Pick the interface, the polarization, and the angle. This is the physics of glare-killing polarized sunglasses, Brewster-window lasers and the polarization of skylight."
tags: [electromagnetism, animation, live-readout, interactive]
difficulty: 3
tier: hero
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
references:
  - "Hecht, Optics."

---

# Brewster angle and the Fresnel reflectance

## Explainer

### What you are looking at

Light hitting glass partly reflects and partly refracts. How much
reflects depends on the angle and on the polarization, and at one
special angle (Brewster's angle) one polarization does not reflect at
all. That is why polarized sunglasses kill glare off water and roads.

### Snell first

The refracted ray bends according to Snell's law,

$$n_1 \sin\theta_i = n_2 \sin\theta_t,$$

with $\theta_i$ the incidence angle and $\theta_t$ the transmitted
angle. Everything else needs both angles.

### The Fresnel equations

The fraction of amplitude reflected differs for light polarized in the
plane of incidence (p) and perpendicular to it (s):

$$r_s = \frac{n_1\cos\theta_i - n_2\cos\theta_t}
  {n_1\cos\theta_i + n_2\cos\theta_t}, \qquad
  r_p = \frac{n_2\cos\theta_i - n_1\cos\theta_t}
  {n_2\cos\theta_i + n_1\cos\theta_t}.$$

The reflected power (reflectance) is the square of these,
$R_s = r_s^2$ and $R_p = r_p^2$. The playground plots both against the
incidence angle.

### Brewster and the critical angle

Set the numerator of $r_p$ to zero and you find the Brewster angle,

$$\theta_B = \arctan(n_2/n_1),$$

where $R_p = 0$: p-polarized light is perfectly transmitted, so the
reflection is purely s-polarized. A polarizing filter aligned to block
s then removes the glare entirely. Going from a dense to a rare medium
($n_1 > n_2$) there is also a total-internal-reflection threshold, the
critical angle

$$\theta_c = \arcsin(n_2/n_1),$$

beyond which $R = 1$ for both polarizations. Both special angles fall
straight out of the Fresnel formulas as you sweep the slider.

### Things to try

- Sweep to $\theta_B = \arctan(1.5/1.0) \approx 56^\circ$ for air-glass
  and watch the $R_p$ curve touch zero.
- Compare $R_s$ and $R_p$: they only agree at normal incidence and at
  grazing incidence.
- Flip to $n_1 > n_2$ and find the critical angle where reflection
  becomes total.

### Where this comes from

Snell's law, the Fresnel amplitude coefficients, and the Brewster and
critical angles follow Hecht, *Optics*, 5th ed., Chapter 4, and Born
and Wolf, *Principles of Optics*, Chapter 1.

## Physical setup

Plane wave from medium 1 (index n_1) incident on the planar interface with
medium 2 (index n_2) at angle theta_i. Default: n_1 = 1.0 (air),
n_2 = 1.5 (glass). Refracted angle theta_t from Snell's law.

## Governing equations

  r_s = (n_1 cos theta_i - n_2 cos theta_t) / (n_1 cos theta_i + n_2 cos theta_t)
  r_p = (n_2 cos theta_i - n_1 cos theta_t) / (n_2 cos theta_i + n_1 cos theta_t)
  R_s = r_s^2,  R_p = r_p^2

Brewster's angle: theta_B = atan(n_2 / n_1), at which r_p = 0.
Critical angle (if n_1 > n_2): theta_c = arcsin(n_2 / n_1).

## Numerical method

Closed-form Fresnel evaluation. Rendering is plain Canvas2D: the ray
diagram (incident, reflected, refracted) with brightness and flowing
photons scaled by the Fresnel intensity, the Brewster right-angle marker,
and the R(theta) diagnostic with Brewster and critical-angle markers.

## Controls

- interface: air to glass, air to water, glass to air, water to air
  (the last two showing total internal reflection).
- polarization: p (in-plane), s (out-of-plane), or unpolarized.
- theta_i: incidence angle, 0 to 89 degrees.
- Reset / Pause / Play.

## Expected qualitative features

1. theta_i = 0: R_s = R_p = ((n_1 - n_2)/(n_1 + n_2))^2.
2. theta_i = theta_B: R_p = 0 exactly; R_s small but nonzero.
3. theta_i -> 90: R_s, R_p both -> 1 (grazing).
4. If n_1 > n_2 and theta_i > theta_c: total internal reflection.

## Invariants and acceptance thresholds

1. theta_B = atan(n_2 / n_1) exact.
2. R_p at theta_B < 1e-6.
3. R_s, R_p in [0, 1] over [0, pi/2].
4. Normal-incidence formula exact.
5. Grazing: R approaches 1.
6. TIR above critical angle.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Normal incidence: standard reflectance.
- Grazing: full reflection.
- TIR for n_1 > n_2 above theta_c.

## Visual fallback

Canvas2D only. Top: ray sketch with incident (yellow), reflected (its
brightness scaled by the selected reflectance, so it vanishes at
Brewster for p), and transmitted (yellow). Bottom: R_s(theta) and
R_p(theta) curves with Brewster and critical-angle markers and a
current-angle cursor. The caption names the Brewster condition so the
figure reads without Canvas2D.

## Citations

- Hecht, Optics 5e Ch. 4.
- Born and Wolf Ch. 1.

## Stretch goals

- Complex refractive index (metals) with phase rotation.
- Animated polarization vectors.
- Pseudo-Brewster minimum for absorbing media.

## Risk register

- For n_1 > n_2 the slider can produce TIR; the ray diagram shows no
  transmitted ray and R_s = R_p = 1.
