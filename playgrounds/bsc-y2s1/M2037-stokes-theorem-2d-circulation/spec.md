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

In 2D, Green's / Stokes' theorem states

$$\oint_{\partial A}\mathbf F\cdot d\boldsymbol\ell
  = \iint_A (\nabla\times\mathbf F)_z\,dA,$$

where the left side is the circulation, the work done going once
around the loop, and the right side sums the local rotation
$(\nabla\times\mathbf F)_z = \partial_x F_y - \partial_y F_x$ over
the enclosed area. The boundary "sees" only what the interior does.

### Reading the three fields

- Unit-curl field (rigid rotation): curl is a constant, so the
  circulation grows exactly proportional to the rectangle's area,
  the cleanest illustration of the theorem.
- Shear field: nonzero constant curl as well; circulation still
  equals curl times area regardless of where you place the loop.
- Conservative field (a gradient): curl is zero everywhere, so every
  closed-loop circulation is exactly zero, the field is
  path-independent and has a potential. This is the 2D special case
  that underlies "conservative force does no net work around a loop"
  and is the test for whether a field is a gradient.

The deep point is that local rotation and global circulation are the
same information, which is why Maxwell's equations and fluid vorticity
are written with curl, and why a vanishing curl certifies a potential
exists. The playground shows the drag-rectangle's measured loop
integral equalling the enclosed curl-area to numerical precision for
all three fields.

### Things to try

- Drag the rectangle in the unit-curl field and watch the
  circulation scale linearly with the enclosed area.
- Move the loop around in the conservative field and confirm the
  circulation is always zero (path independence, a potential exists).
- Compare: same area, different placement gives the same circulation
  for uniform-curl fields (it depends only on enclosed curl).

### Where this comes from

Green's and Stokes' theorems and the circulation/curl equivalence
follow Riley, Hobson and Bence, *Mathematical Methods for Physics and
Engineering*, Chapter 10, and Griffiths, *Introduction to
Electrodynamics*, Chapter 1.
