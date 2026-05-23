---
title: Linear Perturbation Growth in LCDM
slug: linear-perturbation-growth
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-CS
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: liddle-cosmology
primary_chapter: 12
hook: 'Tiny density bumps in the early universe grow under gravity in proportion to the scale factor, until dark energy takes over and freezes structure formation.'
one_paragraph: 'Cosmic structure forms because gravity amplifies small initial density contrasts. In the matter-dominated era the linear growing mode is simple: the density contrast delta grows in direct proportion to the scale factor a. When dark energy (Lambda) comes to dominate, accelerated expansion outruns gravitational collapse and growth saturates, so structure formation effectively shuts off. The playground integrates the linear growth equation through the matter and Lambda eras so you watch delta(a) rise and then flatten. Reference: Liddle, An Introduction to Modern Cosmology, Ch. 12.'
tags: [cosmology, animation, live-readout]
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
# Linear perturbation growth
$\delta \propto a$ in matter era; Lambda saturates growth. Source: Liddle Ch. 12.

## Explainer

### What you are looking at

Galaxies exist because tiny density bumps in the early universe,
about one part in $10^5$, were amplified by gravity over billions of
years. But that amplification is not unlimited: it switches on in the
matter era and switches off once dark energy takes over. The
playground integrates a single overdensity through cosmic history and
shows it grow, then freeze.

### The growth equation

In the linear regime a small matter overdensity
$\delta = \delta\rho/\rho$ obeys a damped, gravity-driven equation
(written in terms of the scale factor $a$ and expansion rate $H$):

$$\ddot\delta + 2H\dot\delta
  = 4\pi G\,\rho_m\,\delta.$$

The right side is gravity trying to collapse the bump; the
$2H\dot\delta$ term is Hubble drag, the expansion fighting collapse.
The competition between them sets whether and how fast structure
grows.

### Three eras, three behaviors

- Radiation era: the universe expands too fast (Hubble drag wins),
  so sub-horizon matter perturbations barely grow (the Meszaros
  effect), $\delta \approx \text{const}$.
- Matter era: gravity and drag balance just right and the growing
  mode is

$$\delta(a)\;\propto\;a,$$

  perturbations grow linearly with the scale factor, the workhorse
  result.
- Dark-energy era: accelerated expansion makes the drag overwhelming,
  $\rho_m$ dilutes away, and growth saturates: $\delta\to$ constant.

The combined history is packaged in the growth factor $D(a)$ and the
growth rate $f = d\ln D/d\ln a \approx \Omega_m(a)^{0.55}$, which
redshift-space galaxy surveys measure directly to test gravity and
constrain dark energy. The playground sweeps $\Omega_m$ and
$\Omega_\Lambda$ and shows the $\delta\propto a$ ramp turning over
into a plateau as $\Lambda$ takes over.

### Things to try

- Watch $\delta$ stay flat in the radiation era, ramp linearly in
  $a$ through the matter era, then saturate under $\Lambda$.
- Increase $\Omega_\Lambda$ and watch growth shut off earlier (a
  lower final amplitude).
- Note the growth rate $f\approx\Omega_m^{0.55}$ dropping toward
  zero as dark energy dominates.

### Where this comes from

The linear growth equation, the $\delta\propto a$ matter-era solution,
and the $\Lambda$ saturation follow Liddle, *An Introduction to
Modern Cosmology*, Chapter 12, and Dodelson, *Modern Cosmology*.
