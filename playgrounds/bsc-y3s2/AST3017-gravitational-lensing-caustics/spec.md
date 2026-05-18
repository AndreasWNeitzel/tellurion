---
title: "Gravitational Lensing Caustics"
slug: gravitational-lensing-caustics
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
hook: 'Drag the source across the source plane; watch images appear and disappear as it crosses a caustic.'
one_paragraph: 'Point-mass lens with deflection 4 G M / (c^2 xi). Critical curves traced by det(J) = 0 grid scan. Newton iteration from coarse seeds finds the image positions; binary-lens mode produces a figure-8 caustic.'
tags: [relativity, gr-relativity, interactive-drag, field-visualization]
difficulty: 4
tier: large
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: []
---

# Gravitational Lensing Caustics

Drag up to four point-mass lenses; caustic curves (in amber) and critical curves (in white) are drawn analytically. A source position marker in the source-plane creates 2, 3, or 4 multiply-lensed images that update in real time. A background dot grid shears according to the lens map.

## Explainer

### What you are looking at

A mass bends the light passing near it, so a galaxy or star behind it
can appear as several images, arcs, or a ring. The playground lets you
place point-mass lenses and watch a background source split into
multiple images, with the caustic and critical curves that mark where
the magnification diverges.

### The lens equation

Light from a source at angular position $\boldsymbol\beta$ reaches us
along a deflected ray at position $\boldsymbol\theta$, related by the
lens equation

$$\boldsymbol\beta = \boldsymbol\theta
  - \nabla\psi(\boldsymbol\theta),$$

where $\psi$ is the lensing potential. For a point mass the
deflection is $\propto 1/\theta$, and a perfectly aligned source
forms an Einstein ring of radius

$$\theta_E = \sqrt{\frac{4GM}{c^2}\,
  \frac{D_{ls}}{D_l D_s}}.$$

The lens equation is generally many-to-one: one source position can
map to several image positions, which is why you see multiple images.

### Critical curves and caustics

The magnification of an image is the inverse Jacobian of the lens map,

$$\mu = \left[\det\frac{\partial\boldsymbol\beta}
  {\partial\boldsymbol\theta}\right]^{-1}.$$

Where that determinant vanishes the magnification formally diverges:
the locus in the image plane is the critical curve (white), and its
image in the source plane is the caustic (amber). When the source
sits inside a caustic it has the maximal number of images; crossing a
caustic creates or destroys a pair of highly magnified images. This
is exactly the structure behind multiply-imaged quasars, giant arcs,
and microlensing light curves. The playground updates the images,
critical curves, and caustics in real time as you drag the lenses and
the source.

### Things to try

- Align the source behind a single lens and watch the images merge
  toward an Einstein ring.
- Move the source across a caustic and watch a pair of bright images
  appear or vanish (the fold caustic).
- Add a second lens and watch the caustic develop cusps and the
  image count jump to 3 or 4.

### Where this comes from

The lens equation, Einstein radius, and caustic/critical-curve
structure follow Schneider, Ehlers and Falco, *Gravitational Lenses*,
and Narayan and Bartelmann, "Lectures on Gravitational Lensing".

## Physical setup

Deflection $\alpha = 4 G M / (c^2 \xi)$, in scaled units $\hat\alpha = \theta_E^2 / \theta$. Multi-lens: $\alpha = \sum_i \alpha_i$. Lens equation $\beta = \theta - \alpha(\theta)$. Critical curves: $\det(J(\theta)) = 0$ solved on a grid. Caustics: $\beta(\theta_\mathrm{crit})$.

## Controls

- Drag lens markers, add/remove lens
- Drag source marker
- Background-grid toggle, shear-field toggle

## Invariants

- Single point lens: critical curve is exactly $\theta_E$ within 0.1%.
- Image count: 2 outside caustic, 4 inside (single smooth lens + point source).
- Magnification near caustic crossing exceeds 100 within $0.01 \theta_E$.

## Status note

Scaffolded; multi-lens Jacobian root finder + image renderer not yet implemented.

## Citations

Schneider, Kochanek, Wambsganss, "Gravitational Lensing: Strong, Weak and Micro" (`schneider2006`).
