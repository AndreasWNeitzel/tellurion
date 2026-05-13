---
title: Catenary: Shape of a Hanging Chain
slug: catenary-hanging-chain
status: verified
audience: portfolio
created: 2026-05-13
---

# Catenary: shape of a hanging chain

## Physical setup

A perfectly flexible, uniform chain hangs under gravity between two pegs at
(plus minus 1, 0). The hanging shape is the catenary
  y(x) = a cosh(x / a) - a

with catenary parameter a = T_0 / (mu g), horizontal tension T_0, linear
mass density mu, gravity g.

## Governing equations

Equilibrium of a chain element of length ds gives
  dT_x / ds = 0    (T_x = constant horizontal tension)
  dT_y / ds = mu g  (vertical reaction balances weight)
Combining with the geometric constraint dy/dx = T_y / T_x yields the ODE
  d^2 y / dx^2 = (1 / a) sqrt(1 + (dy/dx)^2)
whose solution is y = a cosh(x / a) - a (offset so y(0) = 0).

Derived quantities:
- Arc length: s(x, a) = a sinh(x / a).
- Slope: dy/dx = sinh(x / a).
- Tension: T(x) = mu g (a + y(x)) = T_0 + mu g y.

## Numerical method

None. Closed-form evaluation.

## Controls

- a: catenary parameter, 0.3 to 3.0.
- speed: parameter sweep rate, 0 to 5 (0 means slider-only).
- Reset / Pause / Play.

## Expected qualitative features

1. Small a: deep sag, exponential-looking curve.
2. Large a: nearly flat, indistinguishable from parabola y = x^2 / 2a.
3. Beads spaced uniformly in arc length show how chain mass distributes.
4. Endpoint tangent arrows visualize the slope sinh(1 / a).

## Invariants and acceptance thresholds

1. y(0) = 0 to 1e-12.
2. y(x, a) = a cosh(x / a) - a to 1e-12.
3. Arc length s(x, a) = a sinh(x / a).
4. Slope = sinh(x / a) verified by finite difference.
5. Parabola limit: for a = 50, y(x, a) within 1 percent of x^2 / 2a.
6. Tension increases linearly with height (T - T_0 = mu g y).
7. Sample curve correct length and all y >= 0.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- a large: parabola.
- a small: chain hangs nearly straight down (singular).

## Visual fallback

Canvas2D only. Catenary (cyan), parabolic approximation (orange dashed),
chain beads spaced in arc length, endpoint tangent arrows.

## Citations

- Lemos, Analytical Mechanics Ch. 2 (`lemos-analytical`).
- Goldstein, Classical Mechanics Ch. 2 (Euler-Lagrange formulation).

## Stretch goals

- Unequal-height pegs.
- Non-uniform mass density.
- Loading the chain with point weights.

## Risk register

- a slider lower bound 0.3 to avoid extreme sag dominating the figure.
- Parabola plotted only over [-1, 1]; outside that range the approximation
  diverges from the chain.
