---
title: Skin Effect in a Conductor
slug: skin-effect-1d-conductor
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2013
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: griffiths-em
primary_chapter: 9
hook: 'An alternating current does not fill a wire; it crowds into a thin surface skin whose depth shrinks as the frequency rises.'
one_paragraph: 'Inside a conductor an oscillating field cannot penetrate freely: it decays exponentially with depth on the scale of the skin depth delta = sqrt(2 / (omega mu sigma)). Higher frequency or higher conductivity gives a thinner skin, so high-frequency current effectively flows only in a shell near the surface and the resistance rises. The playground plots the field amplitude against depth as you change frequency and conductivity, marking delta where it has fallen to 1/e. This is why RF conductors are surface-plated and why the centre of a thick power conductor carries almost no high-frequency current. Reference: Griffiths, Introduction to Electrodynamics, Ch. 9.'
tags: [electromagnetism, animation, live-readout]
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
# Skin effect
Exponential decay of the AC electric field inside a conductor; skin depth $\delta = \sqrt{2/(\omega \mu \sigma)}$. Source: Griffiths E&M Ch. 9 (`griffiths-em`).

## Explainer

### What you are looking at

Push a steady current through a wire and it uses the whole cross
section. Push an alternating current and it crowds into a thin surface
layer, leaving the core nearly dead. The faster you alternate, the
thinner that layer. This skin effect is why high-frequency conductors
are hollow tubes or stranded, and why microwave parts are
silver-plated.

### Why the field cannot get in

Inside a good conductor Maxwell's equations for the AC field reduce to
a diffusion-like equation. A wave entering the surface is damped as it
penetrates, with amplitude

$$E(z) = E_0\,e^{-z/\delta}\,\cos\!\big(\omega t - z/\delta\big),$$

an exponential decay (and a phase lag) into the metal. The physical
reason: the changing field induces eddy currents that oppose it
(Lenz's law), screening the interior.

### The skin depth

The single length that governs it is the skin depth

$$\delta = \sqrt{\frac{2}{\omega\,\mu\,\sigma}}.$$

By one skin depth the field is down to $1/e \approx 37\%$; by a few
$\delta$ it is essentially gone. Read off the scalings: higher
frequency $\omega$, higher conductivity $\sigma$, or higher
permeability $\mu$ all make $\delta$ smaller, so the current hugs the
surface more tightly. For copper at mains frequency $\delta$ is about a
centimeter; at gigahertz it is under a micron, which is why only the
plating matters there. The playground sweeps the frequency and shows
the field profile sharpening into the surface.

### Things to try

- Raise the frequency and watch the field collapse toward the surface
  as $\delta \propto 1/\sqrt\omega$.
- Increase the conductivity and see the same tightening: better
  conductors screen faster.
- Note the phase lag with depth: the interior field lags the surface,
  not just shrinks.

### Where this comes from

The damped field solution and the skin depth
$\delta = \sqrt{2/(\omega\mu\sigma)}$ follow Griffiths, *Introduction
to Electrodynamics*, 5th ed., Chapter 9.
