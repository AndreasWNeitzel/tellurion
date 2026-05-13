# Mandelbrot Explorer

The Mandelbrot set is the set of complex parameters c for which the iteration z_{n+1} = z_n^2 + c, starting from z_0 = 0, stays bounded. Each pixel of the canvas is one value of c; the gray level encodes the smooth escape time (how many iterations the orbit takes to leave the disk |z| <= 2). Set members are dark (the canonical cardioid plus its period-doubling bulbs); exterior pixels fade toward the off-white surface in proportion to log-scaled escape count.

Look for the cardioid (the main bulb) plus the round period-2 bulb attached on the left at c = -1. Smaller bulbs along the real axis encode the period-doubling cascade (the same one shown in the logistic-cobweb playground via the variable change c = (1 - r^2)/4). Click anywhere to recenter the view at that pixel; drag the width slider down to zoom into the boundary and watch the self-similar structure emerge.

Controls: click on the canvas to recenter (the clicked point becomes the new center). The width slider sets the visible range of Re c (height scales proportionally to keep the canvas aspect ratio). Double-click resets to the default view (-0.5, 0, width 3.5). Reset button does the same.

## Reference

Primary citation: Newman, "Computational Physics", 2013, Exercise 3.7 "The Mandelbrot set" (bib key `newman2013`, verified in chapter_index). Connection to the real-axis period-doubling cascade: Strogatz, "Nonlinear Dynamics and Chaos", 2nd ed., Section 10.4 "Periodic Windows" (bib key `strogatz2015`).

## Verification

- Strong invariants (5/5 tests at seed 0xC0FFEE; deterministic):
  - c = 0 stays bounded for all 256 iterations.
  - c = -1 stays bounded (period-2 fixed orbit 0 -> -1 -> 0).
  - c = 1 escapes in at most 4 iterations.
  - c = 1 + i escapes in at most 4 iterations.
  - c = -1.75 stays bounded (period-3 bulb on the real axis).
- Visual gate: SSIM > 0.92 against committed golden frames across a zoom sweep from width 3.5 to width 0.5.
- Last verified: see `.verified`.
