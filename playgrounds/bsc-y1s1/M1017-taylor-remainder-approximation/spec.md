---
title: Taylor Polynomials and the Remainder
slug: taylor-remainder-approximation
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M1017
curriculum_year: bsc-y1s1
primary_citation: rudin-pma
primary_chapter: 5
hook: "Watch a polynomial grow term by term until it hugs a curve, then hit the wall: outside the radius of convergence, no degree is high enough."
one_paragraph: "The degree-n Taylor polynomial P_n(x) = sum f^(k)(a)/k! (x-a)^k matches f and its first n derivatives at the centre a, so the remainder f - P_n vanishes there and grows away from it, bounded by the Lagrange form |R_n| <= max|f^(n+1)| |x-a|^(n+1)/(n+1)!. The playground draws f and its Taylor polynomial with the next term fading in as the degree sweeps up, shades the remainder, and marks the radius of convergence; the diagnostic plots the error and the Lagrange bound against degree at a draggable test point, running downhill inside the radius and uphill outside it (for 1/(1-x) and ln(1+x) the series diverges past the wall even where f stays finite)."
tags: [real-analysis, taylor-series, approximation, convergence, animation, interactive]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [fn]
invariants:
  - key: touch
    label: P_n matches f at the centre (the remainder is zero there)
    tolerance: 1e-9
  - key: bound
    label: the error never exceeds the Lagrange remainder bound
    tolerance: 1e-9
  - key: radius
    label: the error falls with degree inside the radius and grows outside it
    tolerance: 0.0
what_to_try:
  - Watch each term fade in and the polynomial wrap further around the curve, the shaded remainder squeezed outward.
  - Drag the centre a along the curve; the polynomial re-anchors and hugs the function there.
  - Switch to 1/(1-x) or ln(1+x) and drag the test point across the radius wall; the error plot flips from downhill to uphill.
references:
  - "Rudin, Principles of Mathematical Analysis, 3rd ed., Thm. 5.15 (Taylor's theorem)."
  - "Stewart, Calculus, 8th ed., Sec. 11.10 and 11.11."
---

# Taylor polynomials and the remainder

## Mathematical setup

A function f is approximated near a centre a by its Taylor polynomials, the
partial sums of its Taylor series.

## Equations

The degree-n Taylor polynomial is

$$ P_n(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}(x-a)^k, $$

matching f and its first n derivatives at a. The remainder $R_n = f - P_n$ obeys
the Lagrange bound

$$ |R_n(x)| \le \frac{\max_{[a,x]}|f^{(n+1)}|}{(n+1)!}\,|x-a|^{n+1}, $$

which goes to zero with n inside the radius of convergence and can grow outside.

## Numerical method

No engine. Taylor coefficients are evaluated in closed form from the analytic
derivatives; the displayed degree sweeps continuously, the highest term fading in
by the fractional degree.

## Controls

- Function (sin, exp, ln(1+x), 1/(1-x)), maximum degree; drag the centre a and the
  test point x; Reset.

## Expected qualitative features

1. Higher-degree polynomials hug the curve over a wider interval; the remainder
   shrinks toward the centre.
2. Inside the radius of convergence the error falls with degree; outside it grows.
3. For ln(1+x) and 1/(1-x) a finite radius wall appears, past which the series
   diverges even where f is finite.

## Invariants and acceptance thresholds

- $P_n(a) = f(a)$ (remainder zero at the centre).
- $|R_n(x)| \le$ the Lagrange bound.
- The error decreases with degree inside the radius and increases outside.

## Citations

Rudin, Principles of Mathematical Analysis, 3rd ed., Thm. 5.15. Stewart, Calculus,
8th ed., Sec. 11.10 and 11.11.
