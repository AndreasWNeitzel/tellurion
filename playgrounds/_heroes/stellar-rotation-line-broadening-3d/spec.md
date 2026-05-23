---
title: Stellar Rotation and Line Broadening (Hero)
slug: stellar-rotation-line-broadening-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3015
supporting_ucs: [MAA-SP]
curriculum_year: hero
primary_citation: gray2005
primary_chapter: 17
hero_candidate: true
hook: 'A rotating star Doppler-broadens its spectral lines by v sin i. The shape of the line is the integral of every surface point''s velocity over the disk, weighted by limb darkening.'
one_paragraph: 'A rotating star presents one limb approaching (blueshifted) and the other receding (redshifted), so each surface element contributes a Doppler-shifted copy of the rest-frame Gaussian line. The observed line profile is the limb-darkened-weighted sum of those copies. Strong rotation broadens the line, hollows out its core, and turns a narrow Gaussian into the characteristic ellipse-section rotational profile. The playground renders the rotating star as a sphere whose surface displays the Doppler-shifted intensity (blue limb / red limb), and below it the live broadened line profile next to the non-rotating template. Reference: Gray, Observation and Analysis of Stellar Photospheres, Ch. 17.'
caption: 'Figure 1. Rotating limb-darkened star and the resulting rotationally broadened absorption-line profile (red curve), compared to the non-rotating Gaussian template (gold curve). Method: numerical sum of the rest-frame line profile across the visible disk weighted by quadratic limb darkening, with each surface element shifted by v_LOS = v sin i * x. Source: Gray, Stellar Photospheres, Ch. 17.'
tags: [stellar, animation, live-readout, three-d]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [vsini, sigma, inclination]
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

# Stellar rotation and line broadening
Doppler-broadened line from a rotating limb-darkened disk. Source: Gray Ch. 17.

## Explainer

### What you are looking at

A rotating star, seen from outside, with its rotation axis tilted by an
angle $i$ to your line of sight. One limb of the visible disk is
approaching you (the surface there is blueshifted), the other limb is
receding (redshifted), and points between contribute proportionally.
The image colors each surface element by its line-of-sight velocity:
warm orange on the receding side, cool blue on the approaching side.

Below the star is its absorption line: in the rest frame it would be a
narrow Gaussian, but every disk element contributes a Doppler-shifted
copy of that template, weighted by limb darkening, and the sum is the
broadened profile shown in red. The gold reference curve is the same
line if the star did not rotate. The broadening width encodes $v\sin
i$, which is the single line-fit parameter astronomers actually pull
out of high-resolution spectra.

### The Doppler shift

A surface element at projected coordinate $x$ on the sky (with the
rotation axis along sky $y$) moves with line-of-sight velocity

$$v_{\text{LOS}}(x) \;=\; (v\sin i)\, x / R_{\star},$$

so its rest-frame line profile $\phi(\lambda - \lambda_0)$ is shifted
by $\delta\lambda / \lambda_0 = v_{\text{LOS}}/c$. The observed flux
at wavelength $\lambda$ is

$$F(\lambda) \;=\; \frac{\displaystyle\int_{\text{disk}}
  I_c(\mu)\, \phi\!\bigl(\lambda - \lambda_0 - \tfrac{\lambda_0}{c}
  v_{\text{LOS}}(x)\bigr)\,\mathrm{d}A}{\displaystyle\int_{\text{disk}}
  I_c(\mu)\,\mathrm{d}A},$$

where $I_c(\mu)$ is the limb-darkening law (taken quadratic with the
usual Sun-like coefficients $u_1 \approx 0.42$, $u_2 \approx 0.25$),
and $\mu = \cos\theta$ where $\theta$ is the angle between the surface
normal and the line of sight.

### Why it is a rotation thermometer

The integral above can be done in closed form for a uniform disk
(Gray's "ellipse" profile), with full width at half depth

$$\Delta\lambda_{1/2} \;\approx\; \frac{2\, v\sin i}{c}\, \lambda_0.$$

For a Sun-like star at $v\sin i = 30\,\mathrm{km/s}$ the broadening
is $\sim 0.06\,\mathrm{nm}$ at H$\alpha$, a measurable mark on a
spectrum. The non-degenerate observable is $v\sin i$: you cannot
separate the true equatorial speed $v$ from the inclination $i$ from
the line shape alone, only their product. (Asteroseismic rotational
splittings break this degeneracy, which is why the asymptotic-period-
spacing playground next door is worth a look.)

### Symbols

- $v$: equatorial rotation speed.
- $i$: inclination of the rotation axis to the line of sight ($i = 90^\circ$ is edge-on).
- $\lambda_0$: rest-frame line center.
- $\sigma$: rest-frame Gaussian line width (microturbulence + thermal).
- $\mu = \cos\theta$ for $\theta$ from disk centre to the surface element.
- $I_c(\mu)$: continuum-intensity limb-darkening law.

### Where this comes from

The integral form and the limb-darkening weighting are from Gray,
Observation and Analysis of Stellar Photospheres, Ch. 17; the
quadratic limb law and the practical $u_1$, $u_2$ values follow the
same chapter and Claret 2000.
