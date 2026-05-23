---
title: Spiral Density-Wave Dispersion
slug: spiral-density-wave-dispersion
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-GD
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: binney-tremaine
primary_chapter: 6
hook: 'A galaxy''s spiral arms are not fixed strings of stars but a wave pattern, like the bunching of cars in a traffic jam, that the disk material flows through.'
one_paragraph: 'In the tight-winding (WKB) limit a small-amplitude density wave in a differentially rotating stellar disk obeys the Lin-Shu dispersion relation (omega - m Omega)^2 = kappa^2 - 2 pi G Sigma |k| F(s, Q), linking the pattern frequency to the radial wavenumber k through the epicyclic frequency kappa, the surface density Sigma and the reduction factor F. A single dimensionless number, Toomre''s Q = kappa sigma_R / (3.36 G Sigma), decides stability: for Q > 1 the disk is stable to axisymmetric perturbations and only certain wavelengths support travelling waves, while Q < 1 lets perturbations grow. The playground plots the dispersion curve and the forbidden band as Q and the wavenumber vary, showing why arms are a self-sustained wave rather than a material structure. Reference: Binney and Tremaine, Galactic Dynamics 2e, Chapter 6.'
tags: [galactic, animation, live-readout]
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
# Lin-Shu dispersion
$\nu^2(k)$ for tightly-wound spiral waves; Toomre $Q$ boundary. Source: Binney-Tremaine Ch. 6.

## Explainer

### What you are looking at

A galaxy's spiral arms are not fixed strings of stars; they are a
wave pattern, like the bunching of cars in a traffic jam, that the
disk material flows through. Whether such a wave can exist, and at
which wavelengths, is set by a single dispersion relation and one
stability number, Toomre's $Q$. The playground plots it.

### The Lin-Shu dispersion relation

For tightly-wound (nearly radial) density waves in a rotating stellar
disk, linearizing the collisionless Boltzmann + Poisson system gives
the Lin-Shu dispersion relation. In the fluid (cold-disk) approximation

$$(\omega - m\Omega)^2 \;=\; \kappa^2
  - 2\pi G\,\Sigma\,|k|
  + c_s^2 k^2,$$

with $\Omega$ the rotation rate, $\kappa$ the epicyclic frequency,
$\Sigma$ the surface density, $c_s$ the velocity dispersion, $k$ the
radial wavenumber, and $\nu = (\omega - m\Omega)/\kappa$ the
dimensionless frequency. Each term is a restoring or driving effect:
$\kappa^2$ is rotational support (stabilizing), $-2\pi G\Sigma|k|$ is
self-gravity (destabilizing, the spiral driver), $c_s^2 k^2$ is
pressure (stabilizing at small scales).

### Toomre Q: the stability knife-edge

Whether $\nu^2$ can go negative (a growing, unstable wave) at any $k$
is governed by the Toomre parameter

$$Q = \frac{c_s\,\kappa}{\pi G\,\Sigma}.$$

For $Q > 1$ the disk is stable to axisymmetric perturbations
(rotation + pressure beat self-gravity at every wavelength); for
$Q < 1$ a band of wavelengths is unstable and fragments. Real disks
sit near $Q\approx1$, marginally stable, which is exactly the regime
that supports long-lived spiral waves (and sets where star formation
switches on). The playground sweeps $Q$ and the wavenumber and shows
the $\nu^2(k)$ curve dip below zero as $Q$ crosses 1.

### Things to try

- Set $Q>1$ and see $\nu^2(k)$ stay positive for all $k$ (stable, no
  growing waves).
- Lower $Q$ through 1 and watch a band of $k$ go unstable
  ($\nu^2<0$): the onset of fragmentation/spiral support.
- Note the two stabilizers (rotation at large scale, pressure at small
  scale) leaving a vulnerable intermediate band.

### Where this comes from

The Lin-Shu dispersion relation and the Toomre $Q$ stability criterion
follow Binney and Tremaine, *Galactic Dynamics*, 2nd ed., Chapter 6.
