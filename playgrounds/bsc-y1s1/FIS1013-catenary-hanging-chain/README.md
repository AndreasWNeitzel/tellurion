# Catenary: shape of a hanging chain

A perfectly flexible cable carrying only its own weight hangs in a
catenary, y(x) = a cosh(x/a) - a, where a = T0/(mu g) is the horizontal
tension over weight per unit length. It is shown here as a suspension
bridge: two towers, a fixed-length main cable, vertical hangers and a
deck. A small a is a deep, slack, low-tension sag; a large a is a
shallow, taut, nearly straight cable.

Look for: drag either tower and the fixed-length cable re-solves through
the new endpoints (a two-point catenary solve). Slacken it (the
cable-length slider) for a deep droop; pull the towers apart until the
cable cannot reach and it snaps taut to a straight line. A shallow cable
looks almost parabolic (the classical bridge approximation), but the
computed shape is always the exact cosh. The readout tracks a, the cable
length, span, sag and the peak tension (largest at the supports).

Controls: the cable-length slider sets the slack; the speed slider drives
a gentle sway (0 to freeze it); drag a tower to move a support; Reset
restores the symmetric layout.

## Reference

- Lemos, Analytical Mechanics, Ch. 2.

## Verification

- Strong invariant: y = a cosh(x/a) - a to 1e-12; arc length
  s = a sinh(x/a); slope dy/dx = sinh(x/a) by finite difference;
  parabola limit at a = 50 within 1 percent (a mathematical limit, not a
  drawn curve).
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
