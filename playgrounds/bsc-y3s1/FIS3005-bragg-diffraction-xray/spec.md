---
title: X-ray Bragg Diffraction
slug: bragg-diffraction-xray
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3005
curriculum_year: bsc-y3s1
primary_citation: ashcroft-mermin
primary_chapter: 6
hook: "Why does a crystal reflect X-rays only at special angles? Watch the path difference between planes hit a whole number of wavelengths and the Bragg peak light up."
one_paragraph: "X-rays reflect from parallel crystal planes spaced d; rays from adjacent planes differ in path by 2d sin(theta) and interfere constructively only when n lambda = 2d sin(theta), the Bragg condition. The playground draws the two-plane geometry with the path-difference segments highlighted and the reflected beam brightening at the Bragg condition, and plots the N-plane reflected intensity against glancing angle: sharp peaks at the Bragg angles labelled by order. Sweep or drag the angle; change d and lambda to shift the whole pattern."
tags: [solid-state, crystallography, x-ray-diffraction, bragg, interference, interactive, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [d, lambda]
invariants:
  - key: bragg
    label: at each peak the path difference equals n lambda (2d sin theta = n lambda)
    tolerance: 1e-9
  - key: intensity
    label: the reflected intensity is 1 at the Bragg angles and suppressed between
    tolerance: 1e-6
  - key: orders
    label: the number of visible orders is floor(2d/lambda)
    tolerance: 0
what_to_try:
  - Sweep the angle; the reflected beam flares at each Bragg peak.
  - Read the path-difference label; at a peak it is exactly n lambda.
  - Increase d; the peaks crowd to smaller angles and more orders appear.
  - Raise lambda above 2d; the peaks vanish (no Bragg solution).
references:
  - "Ashcroft and Mermin, Solid State Physics, Holt-Saunders, 1976, Ch. 6."
  - "Kittel, Introduction to Solid State Physics, 8th ed., Ch. 2."
---

# X-ray Bragg diffraction

## Physical setup

A monochromatic X-ray beam of wavelength lambda incident on a stack of parallel atomic
planes separated by spacing d, reflecting at glancing angle theta.

## Equations

Adjacent planes give reflected rays with path difference $2d\sin\theta$; they add in
phase when

$$ n\lambda = 2d\sin\theta. $$

The intensity from N planes is the interference factor
$\left(\dfrac{\sin(N\phi/2)}{N\sin(\phi/2)}\right)^2$ with $\phi = 2\pi(2d\sin\theta)/\lambda$,
sharply peaked at the Bragg angles.

## Numerical method

Closed-form Bragg geometry and the N-beam interference factor; no time integration.
The path-difference construction (perpendiculars to the incident and reflected rays)
gives the two segments summing to $2d\sin\theta$.

## Controls

- Plane spacing d; wavelength lambda; angle sweep toggle; drag the angle on the plot.

## Expected qualitative features

1. The reflected beam brightens only near the Bragg angles.
2. The intensity plot is dark with sharp peaks at $\theta_n = \arcsin(n\lambda/2d)$.
3. Larger d moves peaks to smaller angles and admits more orders.
4. For $\lambda > 2d$ no peak exists.

## Invariants and acceptance thresholds

- $2d\sin\theta = n\lambda$ at every peak (to 1e-9).
- Intensity 1 at the Bragg angles, suppressed between.
- Visible orders = $\lfloor 2d/\lambda\rfloor$.

## Citations

Ashcroft and Mermin, Solid State Physics, Ch. 6.
Kittel, Introduction to Solid State Physics, 8th ed., Ch. 2.
