---
title: Stokes Theorem 2D Circulation
slug: stokes-theorem-2d-circulation
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M2037
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: riley-hobson
primary_chapter: 10
hook: 'Walk a loop through a vector field and the total swirl you accumulate equals the curl bottled up inside, whatever the loop''s shape.'
one_paragraph: 'Green''s theorem (Stokes in 2D) says the circulation of a field around a closed curve equals the curl integrated over the enclosed area. The playground offers three fields (unit curl, a shear, and a conservative field) and a draggable rectangle: it computes the line-integral circulation and the enclosed curl-times-area and shows them matching as you move and resize the loop. The conservative field gives zero every time; the uniform-curl field gives curl times area no matter where the box sits. It turns the theorem into something you can drag around and watch hold. Reference: Riley and Hobson, Mathematical Methods, Ch. 10.'
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
# Stokes theorem in 2D
Three vector fields (unit-curl, shear, conservative) and a draggable rectangle. Circulation = $\iint$ curl $dA$ closed-form for these uniform-curl fields. Source: Riley-Hobson Ch. 10 (`riley-hobson`).

## Explainer

### What you are looking at

Stokes' theorem says a global quantity (how much a field circulates
around a loop) equals a local one (its curl) added up over the area
inside. The playground makes that exact: drag a rectangle through
different fields and watch the loop integral and the enclosed
curl-integral track each other to the digit.

### The theorem

In 2D, Green's theorem (the planar case of Stokes' theorem) states

$$\boxed{\;\oint_{\partial A} \mathbf F \cdot d\boldsymbol\ell
       = \iint_A (\nabla \times \mathbf F)_z\,dA,\;}$$

where the left side is the *circulation* (the work done going once
around the loop $\partial A$ in the positive orientation), and the
right side sums the local rotation density over the enclosed area
$A$.  In coordinates,

$$(\nabla \times \mathbf F)_z = \frac{\partial F_y}{\partial x}
                              - \frac{\partial F_x}{\partial y}.$$

The boundary "sees" only what the interior does; the enclosed curl
is the only thing that matters.

### Each side, written out

If you parametrise the rectangle $A = [x_1, x_2] \times [y_1, y_2]$
counterclockwise, the line integral splits into four straight legs:

$$\oint_{\partial A} \mathbf F \cdot d\boldsymbol\ell
   = \int_{x_1}^{x_2} F_x(x, y_1)\,dx + \int_{y_1}^{y_2} F_y(x_2, y)\,dy
   - \int_{x_1}^{x_2} F_x(x, y_2)\,dx - \int_{y_1}^{y_2} F_y(x_1, y)\,dy.$$

The playground evaluates this by Simpson's rule and prints both it
and the area integral $\iint_A (\partial_x F_y - \partial_y F_x)\,dA$
side by side; they agree to the digit.

### Reading the three fields

- *Unit-curl field* (rigid rotation): $\mathbf F = \tfrac{1}{2}(-y, x)$
  gives $(\nabla \times \mathbf F)_z = 1$ everywhere, so the
  circulation equals exactly the enclosed area $|A|$.
- *Shear field*: $\mathbf F = (-y, 0)$ has constant curl
  $(\nabla \times \mathbf F)_z = 1$ as well; circulation still
  equals $|A|$, regardless of placement, illustrating that the curl
  is a LOCAL property and the result depends only on its integral.
- *Conservative field* (a gradient): $\mathbf F = \nabla\phi$ with
  $\phi = \tfrac{1}{2}(x^2 + y^2)$ gives
  $\nabla \times \mathbf F = \mathbf 0$ everywhere, so every
  closed-loop circulation is exactly zero, the field is
  path-independent, and has a potential $\phi$.

### Why this matters

The "local rotation = global circulation" identity is what makes
Maxwell's equations expressible in differential form (Ampere's law
$\oint \mathbf B \cdot d\boldsymbol\ell = \mu_0 I$ becomes
$\nabla \times \mathbf B = \mu_0 \mathbf J$). In fluid dynamics it
is the bridge between Kelvin's circulation theorem and vorticity
dynamics. In topology it is the seed of de Rham cohomology: a curl-
free field on a simply connected domain admits a global potential;
on a multiply connected one it might not, and the obstruction is
exactly the closed-loop circulations around holes.

### Symbols, at a glance

- $\mathbf F = (F_x, F_y)$, a 2D vector field.
- $A$, a planar region with boundary $\partial A$ traversed
  counterclockwise.
- $d\boldsymbol\ell$, the line element of $\partial A$.
- $(\nabla \times \mathbf F)_z = \partial_x F_y - \partial_y F_x$,
  the scalar (out-of-plane) curl.
- $\phi$, a scalar potential if it exists; $\mathbf F = \nabla\phi$.

### Things to try

- Drag the rectangle in the unit-curl field and watch the
  circulation scale linearly with the enclosed area.
- Move the loop around in the conservative field and confirm the
  circulation is always zero (path independence, a potential exists).
- Compare: same area, different placement gives the same circulation
  for uniform-curl fields (it depends only on enclosed curl).

### Bibliographic origin

Green's theorem was stated in Green, *An Essay on the Application of
Mathematical Analysis to the Theories of Electricity and Magnetism*
(privately printed, Nottingham 1828). The 3D generalisation that
became Stokes' theorem appeared in a postscript to Lord Kelvin's
letter to George Gabriel Stokes (2 July 1850); Stokes promptly set
it as Problem 8 of the Smith's Prize examination at Cambridge in
1854 (it later acquired his name). Modern textbook treatments are
Riley, Hobson and Bence, *Mathematical Methods for Physics and
Engineering* (3rd ed., Cambridge 2006), Ch. 10; Griffiths,
*Introduction to Electrodynamics* (5th ed., Cambridge 2024), Ch. 1;
Spivak, *Calculus on Manifolds* (Westview 1971), Ch. 4 for the
exterior-calculus generalisation.
