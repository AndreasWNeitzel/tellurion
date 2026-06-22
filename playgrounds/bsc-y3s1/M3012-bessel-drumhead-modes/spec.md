---
title: Vibrating Drumhead Modes
slug: bessel-drumhead-modes
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M3012
curriculum_year: bsc-y3s1
primary_citation: arfken-mmp
primary_chapter: 14
hook: "A round drum does not ring on a clean pitch. Its modes are Bessel functions, and their zeros, the nodal circles, fall in no integer ratio."
one_paragraph: "The wave equation on a disk separates into an angular factor cos(m theta) and a radial Bessel function J_m(kr). Clamping the rim forces J_m(ka) = 0, so the allowed wavenumbers are k_{mn} = j_{m,n}/a with j_{m,n} the n-th zero of J_m, and the frequencies scale with those zeros. The (m,n) mode has m nodal diameters and n-1 nodal circles. The playground animates the mode as a diverging colormap on the disk with its nodal lines, and plots the radial profile J_m(kr) whose zeros are the nodal circles; the frequency ratios are non-integer, so the drum is inharmonic."
tags: [math-methods, bessel-functions, normal-modes, wave-equation, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [m, n]
invariants:
  - key: rim
    label: the clamped rim forces J_m(k a) = 0
    tolerance: 1e-5
  - key: nodes
    label: mode (m,n) has m nodal diameters and n-1 nodal circles at the interior zeros
    tolerance: 0.0
  - key: inharmonic
    label: the Bessel-zero frequency ratios are not integers
    tolerance: 0.0
what_to_try:
  - Step the angular number m; each increment adds a nodal diameter.
  - Step the radial number n; each increment adds a nodal circle, a new zero in the radial profile.
  - Read the frequency ratio; the Bessel zeros are not integer multiples, so the drum is inharmonic.
references:
  - "Arfken, Weber, Harris, Mathematical Methods for Physicists, 7th ed., Sec. 14 (Bessel functions)."
  - "Kreyszig, Advanced Engineering Mathematics, 10th ed., Sec. 12.10."
---

# Vibrating drumhead modes

## Physical setup

A circular membrane of radius a is clamped at its rim and vibrates in normal
modes. The wave equation separates in polar coordinates.

## Equations

The modes are $u_{mn}(r,\theta) = J_m(k_{mn} r)\cos(m\theta)$, and the rim
condition $u(a)=0$ gives $J_m(k_{mn} a) = 0$, so

$$ k_{mn} = \frac{j_{m,n}}{a}, \qquad \omega_{mn} \propto j_{m,n}, $$

with $j_{m,n}$ the n-th zero of $J_m$. The mode has m nodal diameters and n-1
nodal circles (at the interior zeros of $J_m$).

## Numerical method

$J_m$ from its power series; its zeros by scanning and bisection. The displacement
field is sampled on the disk and animated by an overall cos(t); no fabricated
values (verified against tabulated Bessel zeros).

## Controls

- Angular mode m (0 to 3), radial mode n (1 to 3).

## Expected qualitative features

1. m nodal diameters and n-1 nodal circles.
2. Every mode is clamped to zero at the rim.
3. The overtone frequencies are inharmonic (non-integer ratios).

## Invariants and acceptance thresholds

- $J_m(k a) = 0$ at the rim.
- m nodal diameters, n-1 nodal circles.
- Frequency ratios are not integers.

## Citations

Arfken, Weber, Harris, Mathematical Methods for Physicists, 7th ed., Sec. 14.
Kreyszig, Advanced Engineering Mathematics, 10th ed., Sec. 12.10.
