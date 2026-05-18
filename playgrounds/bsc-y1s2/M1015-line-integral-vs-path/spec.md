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
one_paragraph: 'The work done by a vector field along a path is a line integral. For a conservative field it depends only on the endpoints, so the straight chord and the curved arc from A to B give the same value and the closed loop is zero. For a non-conservative field the two paths disagree, and by Green''s theorem the closed-loop integral equals the curl integrated over the enclosed area. The playground evaluates F.dr by Simpson quadrature along both paths for four selectable fields (two conservative, two with constant curl) and shows the loop integral matching the analytic curl-times-area. It turns path-independence from a definition into something you watch succeed or fail. Reference: Riley and Hobson, Mathematical Methods, Ch. 10.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
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

A 2D vector field $\mathbf{F} = (P, Q)$ in the plane, with two paths from $A = (-1, 0)$ to $B = (1, 0)$: the straight chord and the upper semicircular arc. Simpson quadrature evaluates $\int_A^B \mathbf{F} \cdot d\mathbf{r}$ along each path; the closed-loop integral (straight forward, arc reversed) measures the failure of path-independence.

Four fields are available: two conservative ($\mathbf{F} = (2xy, x^2)$ with potential $x^2 y$; $\mathbf{F} = (x, y)$ with potential $\tfrac12(x^2+y^2)$) and two non-conservative ($\mathbf{F} = (-y, x)$ with curl $2$; $\mathbf{F} = (y, 0)$ with curl $-1$).

## Governing equations

Stokes in 2D: $\oint \mathbf{F} \cdot d\mathbf{r} = \iint_S (\partial Q/\partial x - \partial P/\partial y)\,dA$. For the rotation field the enclosed half-disk has area $\pi/2$ and curl $2$, so the closed loop is $\pi$.

## Numerical method

Simpson 1/3 quadrature at $n = 200$ subintervals on each path.

## Controls

- Field selector (four named fields).

## Expected qualitative features

1. Conservative fields: straight and arc integrals coincide; closed loop is zero.
2. Rotation field: closed loop is $\pi$ (up to sign).
3. Shear field: closed loop is the curl times the enclosed area.
4. Vector arrows visually clarify the conservative-vs-rotational structure.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| conservative1: straight = arc | within $10^{-6}$ | invariants test |
| conservative1: $\int = \phi(B) - \phi(A)$ | within $10^{-6}$ | invariants test |
| rotation: straight $\ne$ arc | difference $> 10^{-3}$ | invariants test |
| rotation: closed loop $\approx \pi$ | within $0.01$ | invariants test |
| conservative closed loops are zero | within $10^{-6}$ | invariants test |
| FIELDS object exposes the four named fields | strict | invariants test |
| shear field is non-conservative | closed loop $> 10^{-3}$ | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $\mathbf{F} = 0$: every integral is zero, conservative trivially.
- $\mathbf{F}$ constant: line integral is $\mathbf{F} \cdot (B - A)$, independent of path.
- Endpoints coincide: closed loop equals $\iint \mathrm{curl}\,\mathbf{F}\,dA$ exactly.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the selector still operates.

## Citations

- Riley-Hobson-Bence, *Mathematical Methods for Physics and Engineering*, 3e, Ch. 10 (`riley-hobson`).

## Stretch goals

- Allow the user to drag the endpoints A and B around.
- Show the potential $\phi(x, y)$ as a color background for conservative fields.
- Add a free-form path drawn by the user with the mouse.

## Risk register

- Simpson quadrature at $n = 200$ is more than enough for these smooth fields; convergence is $O(h^4)$.
