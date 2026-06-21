---
title: Line Integral vs Path
slug: line-integral-vs-path
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M1015
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: riley-hobson
primary_chapter: 10
hook: 'Walk a force field from A to B along a straight line, then along a curved detour. For some fields the work is identical; for others the gap is exactly the curl you enclosed.'
one_paragraph: 'The work done by a vector field along a path is a line integral. For a conservative field it depends only on the endpoints, so a straight chord, a curved arc, and a bent detour from A to B all give the same value and a closed loop is zero. For a non-conservative field the routes disagree, and by Green''s theorem the closed-loop integral equals the curl integrated over the enclosed area. The scene draws the field with draggable endpoints A and B and three routes between them (straight, arc, and a bent path with a draggable handle); the diagnostic accumulates F.dr along each route versus progress, so the curves either land on the same value (conservative, path-independent) or split apart (path-dependent). A closed-loop mode walks out straight and back by the arc and shows the round trip return to zero, or not. Reference: Riley and Hobson, Mathematical Methods, Ch. 11.'
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

# Line integrals and path independence

## Explainer

### What you are looking at

Push something from A to B through a force field and add up the work
done along the way. For some fields the answer depends only on A and B;
for others it depends on the route you took. The playground walks two
paths between the same endpoints (a straight chord and a semicircular
arc) and shows the work each accumulates. When they disagree, the field
is not conservative.

### The line integral

The work along a path is the line integral

$$\int_A^B \mathbf F\cdot d\mathbf r
  = \int_A^B \big(P\,dx + Q\,dy\big).$$

A field is conservative if this is path-independent, which happens
exactly when $\mathbf F$ is the gradient of a potential, $\mathbf F =
\nabla\phi$. Then the integral collapses to $\phi(B) - \phi(A)$ and the
route does not matter. The playground includes two conservative fields,
$\mathbf F = (2xy, x^2)$ with potential $x^2 y$, and $\mathbf F = (x, y)$
with potential $\tfrac12(x^2+y^2)$, where the chord and arc give
identical work.

### The closed loop and Green's theorem

Go A to B along one path and back along the other: that closed loop
measures the disagreement. Green's theorem (Stokes in 2D) turns the
loop into an area integral of the curl:

$$\oint \mathbf F\cdot d\mathbf r
  = \iint_S\left(\frac{\partial Q}{\partial x}
  - \frac{\partial P}{\partial y}\right)dA.$$

For the rotation field $\mathbf F = (-y, x)$ the curl is $2$ and the
enclosed half-disk has area $\pi/2$, so the closed loop integral is
exactly $\pi$, nonzero, the precise statement that this field is not
conservative. The shear field $\mathbf F = (y, 0)$ has curl $-1$ and
likewise fails path-independence.

### Things to try

- Pick a conservative field and confirm the chord and arc give the
  same work (closed loop = 0).
- Pick the rotation field and watch the two paths disagree, with the
  loop integral equal to $\pi$.
- Connect it to physics: a conservative force has a potential energy;
  a non-conservative one (like a magnetic-style swirl) does not.

### Where this comes from

Line integrals, path independence, conservative fields, and Green's
theorem follow Riley, Hobson and Bence, *Mathematical Methods for
Physics and Engineering*, 3rd ed., Chapter 10.

## Physical setup

A 2D vector field $\mathbf{F} = (P, Q)$ in the plane, with two draggable endpoints A and B and three routes between them: the straight chord, the upper semicircular arc, and a bent Bezier path with a draggable handle. Simpson (and midpoint) quadrature evaluates $\int_A^B \mathbf{F} \cdot d\mathbf{r}$ along each; the closed-loop integral (straight forward, arc reversed) measures the failure of path-independence.

Four fields are available: two conservative ($\mathbf{F} = (2xy, x^2)$ with potential $x^2 y$; $\mathbf{F} = (x, y)$ with potential $\tfrac12(x^2+y^2)$) and two non-conservative ($\mathbf{F} = (-y, x)$ with curl $2$; $\mathbf{F} = (y, 0)$ with curl $-1$).

## Governing equations

Stokes in 2D: $\oint \mathbf{F} \cdot d\mathbf{r} = \iint_S (\partial Q/\partial x - \partial P/\partial y)\,dA$. For the rotation field the enclosed half-disk has area $\pi/2$ and curl $2$, so the closed loop is $\pi$.

## Numerical method

Midpoint accumulation along each sampled route for the live running
integral, and Simpson 1/3 quadrature for the reference values.
Rendering is plain Canvas2D: a field quiver coloured by magnitude, the
three routes with travelling markers, the draggable A / B / handle, and
the accumulated-integral-vs-progress diagnostic.

## Controls

- field selector (four named fields: two conservative, two with curl).
- routes selector: all three (straight / arc / bent) or closed loop.
- drag the endpoints A and B and the bent-path handle.
- Reset, Pause.

## Expected qualitative features

1. Conservative fields: all three routes accumulate to the same final
   value; the closed loop returns to zero.
2. Non-conservative fields: the routes split to different final values;
   the closed loop nets the circulation.
3. The closed-loop integral equals the curl times the enclosed area
   (Stokes), exact for these constant-curl fields.
4. The field quiver clarifies the conservative-vs-rotational structure.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| conservative1: straight = arc | within $10^{-6}$ | invariants test |
| conservative1: $\int = \phi(B) - \phi(A)$ | within $10^{-6}$ | invariants test |
| rotation: straight $\ne$ arc | difference $> 10^{-3}$ | invariants test |
| rotation: closed loop $\approx \pi$ | within $0.01$ | invariants test |
| conservative closed loops are zero | within $10^{-6}$ | invariants test |
| FIELDS object exposes the four named fields | strict | invariants test |
| shear field is non-conservative | closed loop $> 10^{-3}$ | invariants test |

All confirmed in `invariants.test.mjs` (10 tests passing).

## Limiting cases for verification

- $\mathbf{F} = 0$: every integral is zero, conservative trivially.
- $\mathbf{F}$ constant: line integral is $\mathbf{F} \cdot (B - A)$, independent of path.
- Endpoints coincide: closed loop equals $\iint \mathrm{curl}\,\mathbf{F}\,dA$ exactly.

## Visual fallback

Canvas2D only. The caption names the path-independence criterion and
Stokes' theorem so the figure reads without Canvas2D; the selectors
remain operable.

## Citations

- Riley-Hobson-Bence, *Mathematical Methods for Physics and Engineering*, 3e, Ch. 10.

## Stretch goals

- Allow the user to drag the endpoints A and B around.
- Show the potential $\phi(x, y)$ as a color background for conservative fields.
- Add a free-form path drawn by the user with the mouse.

## Risk register

- Simpson quadrature at $n = 200$ is more than enough for these smooth fields; convergence is $O(h^4)$.
