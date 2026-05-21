---
title: Multiple Integral Fubini
slug: multiple-integral-fubini
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M1015
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: riley-hobson
primary_chapter: 10
hook: 'Add up a function over a rectangle column by column, or row by row; Fubini''s theorem promises the same total, and here both orders are computed side by side.'
one_paragraph: 'A double integral over a rectangle can be done as an iterated integral in either order: integrate over x first then y, or y first then x. Fubini''s theorem guarantees the two agree when the integrand is well behaved. The playground evaluates both orders numerically for f(x, y) = sin x cos y over an adjustable rectangle and shows the running partial sums converging to the same value. Watching the two accumulations fill the region in different directions yet meet at the same answer makes the theorem concrete instead of a line taken on faith. Reference: Riley and Hobson, Mathematical Methods, Ch. 10.'
tags: [numerics, animation, live-readout]
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
# Fubini's theorem in 2D
Iterated integrals over a rectangle in two orders match numerically. Demonstrated on $f(x, y) = \sin x \cos y$. Source: Riley-Hobson Ch. 10 (`riley-hobson`).

## Explainer

### What you are looking at

To integrate a function of two variables over a rectangle you can sweep
in $x$ first then $y$, or in $y$ first then $x$. Fubini's theorem says
you get the same number either way. The playground computes both orders
on $f(x,y) = \sin x\cos y$ and shows the running totals converging to
the same value, so a 2D integral is just two ordinary 1D integrals
done in sequence.

### The statement

For a continuous $f$ on a rectangle $[a,b]\times[c,d]$,

$$\iint_R f\,dA
  = \int_a^b\!\left(\int_c^d f(x,y)\,dy\right)dx
  = \int_c^d\!\left(\int_a^b f(x,y)\,dx\right)dy.$$

The double integral is the volume under the surface; each iterated
form builds that volume out of slices, one taking $y$-slices, the other
$x$-slices. They have to agree because they measure the same volume.

### The worked example

With $f = \sin x\cos y$ the inner and outer integrals separate cleanly.
Integrating $\cos y$ over $[c,d]$ gives $\sin d - \sin c$; integrating
$\sin x$ over $[a,b]$ gives $\cos a - \cos b$; the double integral is
their product. Doing it in the other order multiplies the same two
factors in the opposite sequence, which is the same number. The
playground evaluates both numerically and the two running sums land on
the same value, the theorem made concrete.

### When it can fail

Fubini needs the function to be well behaved (absolutely integrable).
For a continuous function on a bounded rectangle, like this one, it
always holds; the order is purely a matter of convenience, and you pick
whichever inner integral is easier.

### Things to try

- Watch both running totals converge to the same limit.
- Change the rectangle and confirm the two orders still agree.
- Note that picking the easier inner variable is the whole practical
  payoff of the theorem.

### Where this comes from

Fubini's theorem and iterated double integrals follow Riley, Hobson
and Bence, *Mathematical Methods for Physics and Engineering*, 3rd ed.,
Chapter 10.
