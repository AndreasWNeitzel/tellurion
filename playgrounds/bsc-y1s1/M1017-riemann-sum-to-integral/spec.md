---
title: Riemann Sums and the Integral
slug: riemann-sum-to-integral
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: M1017
curriculum_year: bsc-y1s1
primary_citation: stewart2016
primary_chapter: 5
hook: "The integral is a limit of rectangle sums. Slide the number of rectangles up and the staircase squeezes onto the curve; the log-log plot reads off how fast each rule converges."
one_paragraph: "The definite integral is the limit of Riemann sums: slice [a,b] into n pieces of width h, sum f at a sample point times h, and let n grow. The sample point sets the rule and the rate. Left and right endpoints over- or under-shoot and converge as 1/n; the midpoint and the trapezoid cancel the leading error and converge as 1/n^2. The playground draws f with n rectangles or trapezoids and the exact area, and plots the approximation error against n on log-log axes against reference slopes, so the first-order endpoint rules and the second-order midpoint and trapezoid rules separate visibly. A nice subtlety: for a function that returns to the same value at both ends (sine on a half period), the endpoint rules become second order too."
tags: [calculus, analysis, integration, interactive, live-readout]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [func, rule, n]
invariants:
  - key: conv
    label: the Riemann sum converges to the exact integral as n grows
    tolerance: 1e-2
  - key: order1
    label: the endpoint rules are first order (error ~ 1/n) when f(a) != f(b)
    tolerance: 0.4
  - key: order2
    label: the midpoint and trapezoid rules are second order (error ~ 1/n^2)
    tolerance: 0.4
what_to_try:
  - Slide n up and the staircase hugs the curve while the sum closes in on the exact integral.
  - Cycle the rule: the endpoint rectangles lean over or under the curve; the midpoint and trapezoid hug it far more tightly.
  - Read the slopes in the log-log plot: endpoint rules parallel the 1/n line, midpoint and trapezoid the steeper 1/n^2 line.
references:
  - "Stewart, Calculus, Eighth ed., Sec. 5.2 (the definite integral) and 7.7 (approximate integration)."
  - "Rudin, Principles of Mathematical Analysis, Ch. 6 (the Riemann-Stieltjes integral)."
---

# Riemann sums and the integral

## Physical setup

A positive function $f$ on $[a,b]$. The interval is sliced into $n$ subintervals
of width $h=(b-a)/n$, and a rectangle (or trapezoid) is built on each.

## Equations

The Riemann sum and the rules are

$$ S_n = \sum_{i=0}^{n-1} f(x_i^*)\,h \;\xrightarrow{n\to\infty}\; \int_a^b f\,dx, $$

with $x_i^*$ the left endpoint, right endpoint, or midpoint of the $i$th cell, or
the trapezoid average $\tfrac12(f(x_i)+f(x_{i+1}))$. The endpoint rules have error
$O(h) = O(1/n)$; the midpoint and trapezoid rules have error $O(h^2) = O(1/n^2)$.

## Numerical method

No engine. The sums are evaluated directly for analytic functions with known
exact integrals; the error is the absolute difference from the exact value.

## Controls

- Number of rectangles n; cycle the rule (left, right, midpoint, trapezoid) and
  the function. Reset.

## Expected qualitative features

1. The staircase of rectangles converges onto the curve as n grows.
2. Endpoint rectangles systematically over- or under-shoot; the midpoint and
   trapezoid track the curve closely.
3. On the log-log error plot the endpoint rules parallel the 1/n line and the
   midpoint and trapezoid the 1/n^2 line.

## Invariants and acceptance thresholds

- The Riemann sum converges to the exact integral.
- Endpoint rules are first order (when $f(a)\neq f(b)$).
- Midpoint and trapezoid rules are second order.

## Citations

Stewart, Calculus, 8th ed., Sec. 5.2 and 7.7. Rudin, Principles of Mathematical
Analysis, Ch. 6.
