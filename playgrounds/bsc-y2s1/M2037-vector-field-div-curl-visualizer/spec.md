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
---

# Divergence and curl of a 2D vector field

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
