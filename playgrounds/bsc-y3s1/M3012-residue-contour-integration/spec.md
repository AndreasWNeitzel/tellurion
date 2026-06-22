---
title: The Residue Theorem
slug: residue-contour-integration
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M3012
curriculum_year: bsc-y3s1
primary_citation: ablowitz-fokas
primary_chapter: 4
hook: "A contour integral of an analytic function ignores the path and counts only the poles inside. Grow the loop and watch the value jump by 2 pi i Res at each."
one_paragraph: "For a function analytic except at isolated poles, the residue theorem says the integral around a closed contour equals 2 pi i times the sum of the residues of the poles enclosed, independent of the path. The playground colours the plane by the phase of f (bright pinwheels at the poles), draws a draggable circular contour, and prints the integral computed numerically from the loop, which always equals 2 pi i times the enclosed residues. Growing the radius keeps the integral flat between poles and jumps it by 2 pi i Res whenever the contour swallows a pole, which the diagnostic records as a staircase; enclosing no poles gives zero, and enclosing every pole of a proper rational function returns zero."
tags: [complex-analysis, residue-theorem, contour-integral, math-methods, interactive]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [fn, R]
invariants:
  - key: theorem
    label: the contour integral equals 2 pi i times the enclosed residue sum
    tolerance: 0.05
  - key: empty
    label: a contour enclosing no pole integrates to zero
    tolerance: 0.01
  - key: jump
    label: the integral jumps by 2 pi i Res when a pole is swallowed
    tolerance: 0.1
what_to_try:
  - Grow the radius from zero; the integral is flat, then jumps by 2 pi i Res when the loop swallows a pole.
  - Drag the contour to enclose no pole; the integral collapses to zero whatever the path.
  - Enclose every pole of a proper rational function; the residues cancel to zero.
references:
  - "Ablowitz and Fokas, Complex Variables, 2nd ed., Ch. 4 (the residue theorem)."
  - "Arfken, Weber, Harris, Mathematical Methods for Physicists, 7th ed., Sec. 11.8."
---

# The residue theorem

## Mathematical setup

A function f is analytic except at isolated poles. We integrate it around a closed
contour and relate the value to the poles inside.

## Equations

$$ \oint_C f(z)\,dz = 2\pi i \sum_{z_k \text{ inside } C} \mathrm{Res}(f, z_k). $$

The value depends only on which poles are enclosed, not on the path; between poles
it is constant and it jumps by $2\pi i\,\mathrm{Res}$ as each pole is swallowed.

## Numerical method

The contour integral is evaluated numerically around the circle; residues are
found from small contour integrals. The numeric loop integral matches the
2 pi i residue sum. No fabricated values.

## Controls

- Next function (poles on the real axis, the imaginary axis, the origin), contour
  radius; drag the contour centre.

## Expected qualitative features

1. The integral is flat between poles and steps by 2 pi i Res at each crossing.
2. A loop around no pole integrates to zero.
3. A loop around all poles of a proper rational function gives zero.

## Invariants and acceptance thresholds

- Integral $= 2\pi i \sum \mathrm{Res}$.
- Empty contour integrates to zero.
- The jump at a pole crossing is $2\pi i\,\mathrm{Res}$.

## Citations

Ablowitz and Fokas, Complex Variables, 2nd ed., Ch. 4. Arfken, Weber, Harris,
Mathematical Methods for Physicists, 7th ed., Sec. 11.8.
