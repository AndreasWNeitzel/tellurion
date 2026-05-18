---
title: "Catenary: Shape of a Hanging Chain"
slug: catenary-hanging-chain
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
hook: "Hang a chain from two points and it makes neither a parabola nor a circle: it settles into a catenary, y = a cosh(x/a). Drag a tower of this suspension bridge and watch the fixed-length cable re-solve into its new hanging shape."
one_paragraph: "A perfectly flexible cable carrying only its own weight hangs in a catenary, y = a cosh(x/a). It is set up here as a suspension bridge: two towers with a fixed-length main cable and vertical hangers down to a deck. Grab either tower and slide it; the cable length stays fixed, so the catenary re-solves for the new support positions (a two-point solve). The parameter a = T0 / (mu g) is the ratio of horizontal tension to weight per unit length: a small a means a deep sag and a slack, low-tension cable; a large a means a shallow, taut, nearly straight one. The readout reports a, the span, the sag and the peak tension. Pull the towers far enough apart that the cable cannot reach and it goes taut, snapping to a straight line (no catenary solution exists). A shallow cable looks almost parabolic, which is the classical suspension-bridge approximation, but the exact free-hanging shape is always the cosh."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Catenary: shape of a hanging chain

## Physical setup

A perfectly flexible, uniform cable hangs under gravity between two
support towers. Carrying only its own weight, its equilibrium shape is the
catenary

  y(x) = a cosh(x / a) - a,

with catenary parameter a = T_0 / (mu g): horizontal tension T_0, linear
mass density mu, gravity g. The towers are draggable and the cable length
is fixed, so moving a support re-solves the two-point catenary through the
new endpoints (the symmetric y = a cosh(x/a) - a form is retained for the
invariant tests).

## Governing equations

Equilibrium of a cable element of length ds gives

  dT_x / ds = 0    (T_x = constant horizontal tension)
  dT_y / ds = mu g  (vertical reaction balances weight)

Combining with dy/dx = T_y / T_x yields

  d^2 y / dx^2 = (1 / a) sqrt(1 + (dy/dx)^2),

whose solution is y = a cosh(x / a) - a. Derived quantities: arc length
s(x, a) = a sinh(x / a); slope dy/dx = sinh(x / a); tension
T(x) = mu g (a + y) = T_0 + mu g y (largest at the supports).

## Numerical method

Closed-form catenary, plus a one-dimensional root solve for the two-point
problem: given the two support positions and the fixed cable length,
solve for the catenary parameter and offset that pass through both
supports with the prescribed arc length (`solveCatenary2pt` in sim.js).

## Controls

- Cable-length slider (the `a` slider, relabelled): sets the fixed cable
  length / slack relative to the support chord; more slack means a deeper
  sag and a smaller a.
- speed: gentle sway animation rate (0 means static).
- Drag either tower to move a support; the cable re-solves. Reset
  restores the symmetric layout; Pause / Play toggles the sway.
- Live readout: a, cable length L, span, sag, peak tension T_max.

## Expected qualitative features

1. A clear hanging cable with the characteristic catenary droop, with
   vertical hangers to a straight deck (suspension bridge).
2. Dragging a tower re-solves the curve through the new endpoints; the
   cable length stays fixed.
3. Slack cable: deep sag, small a, low tension. Taut cable: shallow,
   large a, high tension; pulled past reach it snaps to a straight line.
4. A shallow cable is visually close to a parabola (the classical bridge
   approximation), but the computed shape is always the exact cosh.
5. The five reference frames differ (support asymmetry and slack vary).

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline), on the closed-form symmetric API:

1. y(0) = 0 to 1e-12.
2. y(x, a) = a cosh(x / a) - a to 1e-12.
3. Arc length s(x, a) = a sinh(x / a).
4. Slope = sinh(x / a) verified by finite difference.
5. Parabola limit: for a = 50, y(x, a) is within 1 percent of x^2 / 2a
   (a mathematical property of the shallow-cable limit; the parabola is
   not drawn as a separate on-screen curve).
6. Tension increases linearly with height (T - T_0 = mu g y).
7. Sampled curve has the correct length and all y >= 0.

## Limiting cases for verification

- Large a (taut, shallow): the cosh is within 1 percent of the parabola
  x^2 / 2a over the span.
- Small a (very slack): deep, near-singular sag.
- Cable shorter than the span: no catenary solution, the cable is taut
  and straight.

## Visual fallback

Canvas2D only: the gold catenary main cable, two draggable towers, the
deck, the vertical hangers, and the a / L / span / sag / T_max readout.
The static readout plus the invariants define correctness without motion.

## Citations

- Lemos, Analytical Mechanics, Ch. 2: the catenary variational problem.
- Goldstein, Classical Mechanics, Ch. 2: the Euler-Lagrange formulation.

## Risk register

- The cable-length slider has a lower bound so an extreme sag does not
  dominate the frame.
- The earlier spec described a pegs-and-parabola comparison; the
  playground was reworked into the draggable suspension bridge described
  here, and the spec/README now match the implementation (the parabola
  remains a mathematical limiting case, invariant 5, not a drawn curve).
