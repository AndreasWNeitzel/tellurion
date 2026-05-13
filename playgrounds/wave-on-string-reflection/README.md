# Wave on a string: fixed vs free end reflection

Two parallel strings simulating the 1D wave equation y_tt = c^2 y_xx
with different boundary conditions. The top string has fixed ends
(y = 0), the bottom has free ends (y_x = 0). A Gaussian pulse is
launched rightward in each. Three-point finite-difference stencil with
CFL number 0.5.

Look for: when the pulse reaches the right boundary, the fixed-end
version (top) reflects with INVERTED sign (negative bump returns),
while the free-end version (bottom) reflects with PRESERVED sign
(positive bump returns). This is the universal pattern for boundary
reflections off impedance discontinuities.

Speed controls how fast the simulation runs. Reset re-launches both
pulses.

## Reference

- French, Vibrations and Waves Ch. 7 (`french-vibrations`).

## Verification

- Strong invariant: fixed-end y = 0 to 1e-12; free-end neighbor-mirror
  to 1e-12; sign behavior after reflection.
- Visual gate: SSIM > 0.92 across 5 frames showing pulse travel and
  reflection.
- Last verified: see `.verified`.
