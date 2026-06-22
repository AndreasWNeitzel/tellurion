---
title: The Maxwell-Boltzmann Speed Distribution
slug: maxwell-boltzmann-speeds
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3008
curriculum_year: bsc-y3s1
primary_citation: reif-thermal
primary_chapter: 7
hook: "A gas at one temperature is a riot of speeds. Sample them and they fill in the Maxwell-Boltzmann bell, pinned by three speeds in fixed ratio."
one_paragraph: "Each velocity component of a gas molecule is an independent Gaussian of variance kT/m, so the speed follows f(v) = sqrt(2/pi) v^2/a^3 exp(-v^2/2a^2) with a = sqrt(kT/m), a lopsided bell with a v^2 rise and an exponential tail. Three speeds summarize it in fixed ratio, the most probable v_p = sqrt(2) a, the mean v_avg = sqrt(8/pi) a, and the rms v_rms = sqrt(3) a, always ordered v_p < v_avg < v_rms. The playground shows a box of molecules coloured by speed and a histogram of sampled speeds converging to f(v) with the three speeds marked; raising T (or lowering m) widens and shifts the distribution to higher speeds while keeping its area one."
tags: [statistical-physics, kinetic-theory, distribution, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [T, m]
invariants:
  - key: norm
    label: the distribution integrates to 1
    tolerance: 1e-2
  - key: order
    label: v_p < v_avg < v_rms with ratios sqrt2 : sqrt(8/pi) : sqrt3
    tolerance: 1e-6
  - key: sample
    label: the sampled speeds reproduce the mean and rms
    tolerance: 0.1
what_to_try:
  - Watch the histogram fill in the smooth f(v) curve as more speeds are sampled.
  - Raise the temperature; the distribution slides right and flattens (area stays one).
  - Increase the mass; the distribution shrinks toward slow speeds (v_p ~ 1/sqrt(m)).
references:
  - "Reif, Fundamentals of Statistical and Thermal Physics, Sec. 7.9-7.10."
  - "Blundell and Blundell, Concepts in Thermal Physics, 2nd ed., Ch. 5."
---

# The Maxwell-Boltzmann speed distribution

## Physical setup

An ideal gas in equilibrium at temperature T: the speeds of its molecules are
distributed, not uniform.

## Equations

With each velocity component Gaussian of variance $a^2 = kT/m$,

$$ f(v) = \sqrt{\tfrac{2}{\pi}}\,\frac{v^2}{a^3}\,e^{-v^2/2a^2}, $$

with the most probable $v_p = \sqrt{2}\,a$, mean $v_\text{avg} = \sqrt{8/\pi}\,a$,
and rms $v_\text{rms} = \sqrt{3}\,a$, always $v_p < v_\text{avg} < v_\text{rms}$.

## Numerical method

Speeds are sampled as the magnitude of a 3D Gaussian velocity and stacked into a
histogram that converges to f(v); the molecules in the box carry MB speeds. No
fabricated values.

## Controls

- Temperature T, molecular mass m.

## Expected qualitative features

1. The histogram converges to the smooth f(v).
2. Higher T widens and shifts the distribution to higher speeds; the area stays 1.
3. Heavier molecules move slower at the same temperature.

## Invariants and acceptance thresholds

- $\int f\,dv = 1$.
- $v_p < v_\text{avg} < v_\text{rms}$ with the fixed ratios.
- The sampler reproduces the mean and rms.

## Citations

Reif, Fundamentals of Statistical and Thermal Physics, Sec. 7.9-7.10. Blundell and
Blundell, Concepts in Thermal Physics, 2nd ed., Ch. 5.
