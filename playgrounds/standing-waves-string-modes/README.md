# Standing waves on a fixed-end string

A uniform string of length L = 1 and wave speed c = 1 fixed at both ends
supports normal modes y_n(x, t) = sin(n pi x / L) cos(2 pi f_n t) with
frequency f_n = n c / (2 L). Mode n has n antinodes (places of maximum
motion, shown as orange dots) and n - 1 interior nodes (vertical tick
marks). Picking the integer n selects which mode oscillates.

Look for: mode 1 is the fundamental, a smooth half-sine pulsation. Mode 5
oscillates five times faster and shows five antinodes. Press the
superpose button to combine mode 1 (amplitude 1.0) and mode 3 (amplitude
0.5); the yellow curve is the sum and the faint cyan and orange traces
show the contributions. The envelope (dashed) is the spatial pattern of
the mode shape.

Use the mode-n slider to pick a single mode. Speed controls animation
rate. Reset returns to t = 0. The superpose button toggles a 1 + 3
combination.

## Reference

- French, Vibrations and Waves Ch. 5 (`french-vibrations`).

## Verification

- Strong invariant: fixed-end boundary y = 0 to 1e-12; harmonic ratios
  f_n / f_1 = n exact; antinode positions analytic.
- Visual gate: SSIM > 0.92 across 5 frames sweeping modes 1 to 5.
- Last verified: see `.verified`.
