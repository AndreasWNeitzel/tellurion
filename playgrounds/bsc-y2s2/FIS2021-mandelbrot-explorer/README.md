# Mandelbrot Rainbow Explorer

The Mandelbrot set rendered with a continuous rainbow palette. Click anywhere on the canvas to recenter on that complex coordinate; press auto-zoom to drive into the click point until the double-precision floor is reached. The iteration cap rises with zoom depth so boundary structure stays resolved out to zoom ~ 1e9x.

Six preset targets land you at named zoom points: Seahorse Valley, a spiral on the boundary, a satellite mini-set, Elephant Valley, the triple-spiral cusp, and a Misiurewicz point. Each gives a different visual character at depth.

Controls: click to recenter; auto-zoom toggles a geometric width decrease per frame (factor 0.97); zoom out doubles the width; reset returns to the full set.

## Reference

Primary citation: Newman, "Computational Physics", 2013, Exercise 3.7 "The Mandelbrot set". Bib key `newman2013`, chapter_index lists Section 3.7. The cardioid and period-2 bulb membership shortcut is a geometric optimisation common in fractal-renderer literature.

## Verification

- Strong invariants: classical set membership (c = 0, -1, -1.75 inside; c = 1, 1+i, |c|>2 escape); cardioid and bulb shortcuts at known interior points; smooth escape time bounded by iter + 1.5 for fast escapes; bit-identical determinism.
- Medium invariant: maxIter adaptive scaling (256 at full view, > 2000 at deep zoom).
- Visual gate: SSIM > 0.92 across five frames of an exponential zoom into Seahorse Valley.
- Last verified: see `.verified`.
