---
title: Divergence and Curl Visualizer
slug: vector-field-div-curl-visualizer
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M2037
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: riley-hobson
primary_chapter: 10
hook: 'Divergence asks how much a field spreads out of a point; curl asks how much it swirls around it. Pick a field and watch both numbers light up.'
one_paragraph: 'Divergence and curl are the two local derivatives of a vector field: divergence measures the net outflow from a point, curl measures the local rotation. The playground draws four parameterized families as an arrow grid (a pure source with divergence 2a and zero curl, a pure rotation with curl 2a and zero divergence, a shear, and a mix) and reports the analytic divergence and curl as you tune the parameter. Seeing the arrows splay versus circulate while the two numbers update makes the operators concrete instead of formulas. They are the building blocks of Maxwell''s equations and of fluid flow. Reference: Riley and Hobson, Mathematical Methods, Ch. 10.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Divergence and curl of a 2D vector field

## Explainer

### What you are looking at

Divergence and curl are the two local questions you can ask of any
flow: is fluid being created here, and is it spinning here? The
playground draws a 2D vector field and a probe that reports both at
the point you place it, turning the formulas into something you can
see by dropping a tiny paddlewheel into the stream.

### Divergence: sources and sinks

The divergence measures the net outflow per unit area:

$$\nabla\cdot\mathbf F
  = \frac{\partial F_x}{\partial x}
  + \frac{\partial F_y}{\partial y}.$$

Positive divergence is a source (arrows on net pointing outward, a
faucet); negative is a sink (arrows converging, a drain); zero means
whatever flows into a small box also flows out (incompressible). By
the divergence theorem the local divergence integrated over a region
equals the total flux through its boundary.

### Curl: rotation

The (2D, $z$-component of the) curl measures the local circulation
per unit area:

$$(\nabla\times\mathbf F)_z
  = \frac{\partial F_y}{\partial x}
  - \frac{\partial F_x}{\partial y}.$$

Nonzero curl means a paddlewheel placed there would spin; its sign is
the spin direction. A field can have zero curl everywhere yet still
circulate globally only if the domain has a hole (the basis of
conservative vs non-conservative fields). By Stokes' theorem the curl
integrated over a region equals the line integral (circulation)
around its boundary.

### Why the split matters

The Helmholtz decomposition says any well-behaved field is the sum of
a curl-free part (a gradient, like an electrostatic field) and a
divergence-free part (a rotation, like a magnetic field). Divergence
and curl are exactly the two probes that separate them, which is why
Maxwell's equations are written entirely in terms of div and curl.
The playground lets you pick a field (source, vortex, shear, saddle)
and move the probe to read $\nabla\cdot\mathbf F$ and
$(\nabla\times\mathbf F)_z$ with a little expanding/spinning glyph.

### Things to try

- Put the probe in a radial source field: large positive divergence,
  zero curl.
- Put it in a vortex field: zero divergence, large curl (the
  paddlewheel spins).
- Find a saddle/shear where one is zero and the other is not, and a
  point where both vanish.

### Where this comes from

Divergence, curl, and the divergence/Stokes theorems follow Griffiths,
*Introduction to Electrodynamics*, Chapter 1, and Arfken and Weber,
*Mathematical Methods for Physicists*, Chapter 3.

## Physical setup

A parameterized 2D vector field $\mathbf{F}(x, y; a)$ visualized as a grid of arrows on a $\pm 3 \times \pm 2$ region. Four families:

- source: $\mathbf{F} = a(x, y)$, $\nabla \cdot \mathbf{F} = 2a$, $\nabla \times \mathbf{F} = 0$.
- rotation: $\mathbf{F} = a(-y, x)$, $\nabla \cdot \mathbf{F} = 0$, $\nabla \times \mathbf{F} = 2a$.
- shear: $\mathbf{F} = a(y, 0)$, $\nabla \cdot \mathbf{F} = 0$, $\nabla \times \mathbf{F} = -a$.
- saddle: $\mathbf{F} = a(x, -y)$, both zero everywhere.

The readout reports divergence and curl evaluated at the origin (which equals every other point for these families).

## Numerical method

Closed-form analytic derivatives. The invariants test cross-checks against centered finite differences with $h = 10^{-5}$.

## Controls

- Family selector (four options).
- Parameter $a$ slider (-2 to 2).

## Expected qualitative features

1. Source family: arrows point radially outward (a > 0) or inward (a < 0); divergence positive or negative everywhere.
2. Rotation family: arrows wrap counterclockwise (a > 0) or clockwise (a < 0).
3. Shear family: arrows all horizontal, magnitude proportional to $y$; no divergence, constant negative curl.
4. Saddle family: stretches the unit square along x, compresses along y; div and curl both zero.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| source: $\nabla \cdot \mathbf{F} = 2a$, $\nabla \times \mathbf{F} = 0$ | exact | invariants test |
| rotation: $\nabla \cdot \mathbf{F} = 0$, $\nabla \times \mathbf{F} = 2a$ | exact | invariants test |
| shear: $\nabla \cdot \mathbf{F} = 0$, $\nabla \times \mathbf{F} = -a$ | exact | invariants test |
| saddle: both zero | exact | invariants test |
| analytic and FD divergence agree | within $10^{-8}$ | invariants test |
| analytic and FD curl agree | within $10^{-8}$ | invariants test |
| FAMILIES exposes the four families | strict | invariants test |
| source div is constant in position | exact | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $a = 0$: every field collapses to zero; div and curl both zero.
- Source vs saddle: source has $\nabla \cdot \mathbf{F} > 0$ everywhere; saddle has $\nabla \cdot \mathbf{F} = 0$ but a visually similar stretching pattern. The animation contrasts them sharply.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the selector and slider still operate.

## Citations

- Riley-Hobson-Bence, *Mathematical Methods for Physics and Engineering*, 3e, Ch. 10 (`riley-hobson`).

## Stretch goals

- Mouse-driven sampling: click a point, get div and curl at that point.
- Field-line integration through the field to visualize the local geometry.
- Heatmap overlay for non-constant div / curl families (e.g., $\mathbf{F} = (x^2, y^2)$).

## Risk register

- The renderer skips arrows of nearly-zero magnitude to avoid noise at the origin for source/rotation families.
