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
hook: 'Slice the solid under a surface one way or the other; Fubini''s theorem promises both stacks of slabs fill the same volume, and here both orders are computed side by side.'
one_paragraph: 'A double integral over a rectangle is the volume of the solid under z = f(x, y), and it can be built by slicing the solid in either order: cut perpendicular to x (each slab is the inner integral over y) and stack along x, or cut perpendicular to y and stack along x first. Fubini''s theorem guarantees the two agree when the integrand is well behaved. The scene draws the solid in an oblique 3D projection over a resizable region (drag the back corner), cut into slabs in the chosen order, with a sweep that fills the slabs in one at a time: fins receding into depth for dy-then-dx, walls stacked front-to-back for dx-then-dy. The diagnostic accumulates the volume in both orders at once: two running totals that take different paths but land on precisely the same final value, the theorem made concrete instead of a line taken on faith. Three non-negative integrands (a symmetric dome, an asymmetric slant, a non-separable wave) cover the cases. Reference: Riley and Hobson, Mathematical Methods, Ch. 10.'
tags: [numerics, animation, live-readout, interactive]
difficulty: 3
tier: hero
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
references:
  - "Riley, Hobson, Bence, Mathematical Methods for Physics and Engineering, Third ed., Ch. 10."
---
# Fubini's theorem in 2D
The double integral over a rectangle is the volume under the surface, built by
slicing the solid into slabs in either order; both orders match numerically and
fill the same solid. Shown on three non-negative integrands with an oblique 3D
solid you can slice two ways and a both-orders accumulation diagnostic; drag the
back corner to resize the region. Source: Riley-Hobson Ch. 10.

## Controls

- integrand: dome (sin x sin y, symmetric), slant (x sin y / 2, asymmetric so
  the two accumulation routes visibly differ), wave (1/2(1 + sin(x+y)),
  non-separable). All are non-negative on [0, pi]^2 so the integral is a
  genuine volume.
- slice order: dy then dx (slice along x, fins receding into depth) or dx then
  dy (slice along y, walls stacked front-to-back), selecting which cut and
  sweep is shown in the scene.
- drag the back corner to resize the region [0, X1] x [0, Y1].
- Reset, Pause.

## Numerical method

The cross-section areas (areaAtX, areaAtY = the inner integrals) and the
iterated totals use nested Simpson quadrature; the running accumulation curves
use trapezoidal sums of the cross-sections. The reference value is the closed
form where available (dome, slant) and fine quadrature otherwise (wave).
Rendering is plain Canvas2D: an oblique projection of the solid under z=f over
the region, the slabs filled in sweep order (painter's algorithm: fins drawn
near-to-far in x, walls drawn far-to-near in y), and the two accumulation
curves converging to the exact total.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| dx-dy and dy-dx agree (Fubini), every integrand | within 1e-6 on the square and a sub-rectangle | invariants test + live |
| iterated total matches the exact closed form (dome, slant) | within 1e-5 | invariants test |
| stacking cross-sections A(x) over x recovers the volume | within 1e-3 | invariants test |
| stacking cross-sections A(y) over y recovers the volume | within 1e-3 | invariants test |
| every integrand is non-negative on the domain | >= 0 | invariants test |

All confirmed in `invariants.test.mjs` (17 tests passing).

## Explainer

### What you are looking at

The double integral of $f$ over a rectangle is the volume of the solid
under the surface $z=f(x,y)$. You cannot add a volume up all at once, so
you slice it into thin slabs and add the slabs. Cut perpendicular to $x$
and each slab's face is the inner integral over $y$; cut perpendicular to
$y$ and each slab is the inner integral over $x$. Fubini's theorem says
both stacks fill the same solid, so the two iterated integrals are equal.
The scene draws the solid in 3D and cuts it in the order you choose; the
diagnostic accumulates the volume in both orders and they land on the
same value.

### The statement

For a continuous $f$ on a rectangle $[a,b]\times[c,d]$,

$$\iint_R f\,dA
  = \int_a^b\!\left(\int_c^d f(x,y)\,dy\right)dx
  = \int_c^d\!\left(\int_a^b f(x,y)\,dx\right)dy.$$

The double integral is the volume under the surface; each iterated
form builds that volume out of slices, one taking $y$-slices, the other
$x$-slices. They have to agree because they measure the same volume.

### The worked examples

The dome $f=\sin x\sin y$ separates cleanly: the volume over
$[a,b]\times[c,d]$ is $(\cos a-\cos b)(\cos c-\cos d)$, so over the full
square it is $2\times 2=4$. The dome is symmetric in $x$ and $y$, so its
two accumulation routes coincide. The slant $f=x\sin y/2$ is asymmetric:
slicing along $x$ accumulates like $x^2$, slicing along $y$ like
$1-\cos y$, two visibly different routes that still meet at
$\pi^2/2\approx4.93$. The wave $\tfrac12(1+\sin(x+y))$ does not factor
into a function of $x$ times a function of $y$ at all, yet the two orders
still agree; this is where Fubini earns its keep, since there is no
trivial factoring to fall back on.

### When it can fail

Fubini needs the function to be well behaved (absolutely integrable).
For a continuous function on a bounded rectangle, like all three here, it
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
