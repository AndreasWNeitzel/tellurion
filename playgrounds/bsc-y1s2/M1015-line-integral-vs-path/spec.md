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
