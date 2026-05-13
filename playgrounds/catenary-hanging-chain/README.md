# Catenary: shape of a hanging chain

A uniform, perfectly flexible chain suspended between two pegs at
(plus minus 1, 0) hangs in the shape y(x) = a cosh(x / a) - a, where a is
the catenary parameter (horizontal tension over linear-mass-density times
g). As a grows, the chain pulls taut and the curve flattens toward a
parabola y approx x^2 / 2a; as a shrinks, the chain sags more. The
parabola approximation works for taut chains (a >> 1) but underestimates
the true shape for large sag because cosh grows faster than its quadratic
Taylor expansion.

Look for: the cyan catenary curve and the orange dashed parabola coincide
for a > 2, then diverge as a decreases. The chain beads are spaced
uniformly in arc length, so they bunch up where the chain is steepest
(near the pegs). The endpoint tangent arrows have slope sinh(1 / a).

Use the a slider to set the catenary parameter. The speed slider drives a
back-and-forth sweep over a; set speed to 0 to lock on the slider value.
Reset returns to a = 0.6.

## Reference

- Lemos, Analytical Mechanics Ch. 2 (`lemos-analytical`).

## Verification

- Strong invariant: y = a cosh(x/a) - a to 1e-12; arc length s = a sinh
  (x/a); slope dy/dx = sinh(x/a) verified by finite difference; parabola
  limit at a = 50 within 1 percent.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
