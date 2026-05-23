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

### The integral theorems

The differential div and curl are the local-density forms of two
integral identities. The DIVERGENCE THEOREM (Gauss):

$$\boxed{\;\iint_A (\nabla \cdot \mathbf F)\,dA
       = \oint_{\partial A} \mathbf F \cdot \hat n\,d\ell,\;}$$

where $\hat n$ is the outward unit normal: the total source strength
inside equals the net flux out across the boundary. STOKES' THEOREM
in 2D (the same identity as the *circulation* playground):

$$\boxed{\;\iint_A (\nabla \times \mathbf F)_z\,dA
       = \oint_{\partial A} \mathbf F \cdot d\boldsymbol\ell.\;}$$

The differential div and curl are these integral statements made
local by shrinking the region $A$ to zero area.

### Helmholtz decomposition: why div and curl are enough

Helmholtz's theorem (1858) says any smooth, decaying-at-infinity
2D or 3D vector field can be uniquely decomposed as

$$\mathbf F = -\nabla\phi + \nabla \times \vec A,$$

with $\phi$ a scalar "irrotational" potential ($\nabla \times \nabla\phi
\equiv 0$) and $\vec A$ a "solenoidal" vector potential
($\nabla \cdot (\nabla \times \vec A) \equiv 0$). The two pieces are
exactly what divergence and curl probe:

- $\nabla \cdot \mathbf F = -\nabla^2 \phi$ comes only from the
  irrotational part.
- $\nabla \times \mathbf F = \nabla \times \nabla \times \vec A$
  comes only from the solenoidal part.

This is why Maxwell's equations are written entirely in terms of div
and curl. The electrostatic field has $\nabla \times \mathbf E = 0$
(it is a gradient $-\nabla\phi$); the magnetostatic field has
$\nabla \cdot \mathbf B = 0$ (it is a curl $\nabla \times \vec A$).

### A worked example: the central field

Take $\mathbf F = (x, y) = r\hat r$. Then

$$\nabla \cdot \mathbf F = \frac{\partial x}{\partial x}
       + \frac{\partial y}{\partial y} = 2.$$

So the divergence is the constant $2$ everywhere: every point is a
source. The curl is

$$(\nabla \times \mathbf F)_z = \frac{\partial y}{\partial x}
       - \frac{\partial x}{\partial y} = 0 - 0 = 0,$$

a pure source with no rotation. The vortex field $\mathbf F = (-y, x)$
has $\nabla \cdot \mathbf F = 0$ and
$(\nabla \times \mathbf F)_z = 2$: pure rotation.

### Symbols, at a glance

- $\mathbf F = (F_x, F_y)$, the 2D vector field.
- $\nabla \cdot \mathbf F = \partial_x F_x + \partial_y F_y$, divergence
  (units of $\mathbf F$ per length).
- $(\nabla \times \mathbf F)_z = \partial_x F_y - \partial_y F_x$,
  scalar curl.
- $\phi$, scalar potential of the irrotational part.
- $\vec A$, vector potential of the solenoidal part.
- $A$, planar region; $\partial A$, its boundary.

### Things to try

- Put the probe in a radial source field: large positive divergence,
  zero curl.
- Put it in a vortex field: zero divergence, large curl (the
  paddlewheel spins).
- Find a saddle/shear where one is zero and the other is not, and a
  point where both vanish.

### Bibliographic origin

The Helmholtz decomposition: Helmholtz, *Crelle's Journal* **55**
(1858) 25. Divergence and Stokes' theorems were established by Gauss
(1813), Ostrogradsky (1828), Kelvin (1850) and Stokes (1854). Modern
treatment: Griffiths, *Introduction to Electrodynamics* (5th ed.,
Cambridge 2024), Ch. 1; Arfken, Weber and Harris, *Mathematical
Methods for Physicists* (7th ed., Academic 2012), Ch. 3, 4; Spivak,
*Calculus on Manifolds* (Westview 1971), Ch. 4 for the modern
differential-forms generalisation $\int_M d\omega = \int_{\partial M} \omega$.

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

- Riley-Hobson-Bence, *Mathematical Methods for Physics and Engineering*, 3e, Ch. 10.

## Stretch goals

- Mouse-driven sampling: click a point, get div and curl at that point.
- Field-line integration through the field to visualize the local geometry.
- Heatmap overlay for non-constant div / curl families (e.g., $\mathbf{F} = (x^2, y^2)$).

## Risk register

- The renderer skips arrows of nearly-zero magnitude to avoid noise at the origin for source/rotation families.
