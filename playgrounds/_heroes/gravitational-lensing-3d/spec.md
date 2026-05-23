---
title: Gravitational Lensing (Hero)
slug: gravitational-lensing-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST3017
supporting_ucs: []
curriculum_year: hero
primary_citation: sef1992
primary_chapter: 5
hero_candidate: true
hook: 'Drag the source behind a point-mass lens and watch the two images merge into an Einstein ring, then split again on the other side.'
one_paragraph: 'A compact mass between observer and source bends light by general relativity. For an unresolved point-mass lens the image positions are the roots of a quadratic in image radius, giving two images that merge into a full Einstein ring when the source crosses behind the lens. The playground renders the lensed background as a distorted pattern (the inverse lens map applied to a stripe pattern), draws the two solved image positions for a movable source, and traces the magnification field whose divergence is the critical curve. Reference: Schneider, Ehlers, Falco, Gravitational Lenses, Ch. 5.'
caption: 'Figure 1. Lensed image plane (background pattern is the source pulled back through the inverse lens map) with the lens at origin and the two solved point-mass images. The bright ring at theta = theta_E is the critical curve where magnification diverges. Method: closed-form point-mass lens equation, numerical Jacobian for magnification. Source: Schneider, Ehlers, Falco, Gravitational Lenses, Ch. 5.'
tags: [relativity, animation, three-d, live-readout]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [beta_x, beta_y, lens_kind]
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

# Gravitational lensing
Point-mass lens + Einstein ring. Source: Schneider, Ehlers, Falco, Gravitational Lenses, Ch. 5.

## Explainer

### What you are looking at

A heavy mass sits between you and a distant background. Its gravity
bends every light ray that passes close, so the background pattern you
see is not the true sky: it is a distortion of it. The playground
renders the lensed image plane (each pixel is colored by what the
source plane looks like along the deflected ray), and draws the two
discrete images that a point source at $\vec\beta$ produces. Drag the
source toward the lens and the two images merge into a complete
Einstein ring.

### The point-mass lens equation

For a compact mass with Einstein radius $\theta_E$, the lens equation
relates source angle $\vec\beta$ to image angle $\vec\theta$ via

$$\vec\beta \;=\; \vec\theta - \theta_E^2\,\frac{\vec\theta}
  {|\vec\theta|^2}.$$

Setting $\theta_E = 1$ in code units, this is a quadratic in
$|\vec\theta|$ that solves to

$$|\vec\theta|_{\pm} \;=\; \tfrac{1}{2}\!\left(|\vec\beta| \pm
  \sqrt{|\vec\beta|^2 + 4}\right),$$

with the two images lying on the line through the lens and the source
(one outside the Einstein ring, one inside, on opposite sides). When
$|\vec\beta| \to 0$ the two image radii approach $\pm 1$ and the
images form a full ring.

### The Einstein ring

The Einstein radius is

$$\theta_E \;=\; \sqrt{\frac{4 G M_{\rm lens}}{c^2}\,
  \frac{D_{LS}}{D_L D_S}},$$

where $D_L$, $D_S$, $D_{LS}$ are angular-diameter distances. For a
solar-mass lens at $\sim$kpc distance behind a Galactic source, $\theta_E$
is sub-milliarcsecond, the regime of stellar microlensing. For a
galaxy lensing a quasar, $\theta_E$ is arcsecond-scale, the regime of
strong galaxy lensing.

### Symbols

- $\vec\beta$: source angular position (relative to lens).
- $\vec\theta$: image angular position.
- $\theta_E$: Einstein radius.
- $G$, $M_{\rm lens}$, $c$: standard.
- $D_L$, $D_S$, $D_{LS}$: angular-diameter distances.

### Where this comes from

The lens equation and the closed-form point-mass solution follow
Schneider, Ehlers and Falco, *Gravitational Lenses*, Springer 1992,
Ch. 5; Schneider, Kochanek and Wambsganss, *Gravitational Lensing:
Strong, Weak, and Micro*, Saas-Fee 33 (2006) is the modern reference
covering galaxy-scale lensing and microlensing.
