# DEVNOTES - bsc-y3s1/AST3015-least-squares-orbit-fit-gauss (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286)
Was a frozen still: render() regenerated the same seeded data every
frame and redrew an identical picture (no animation, no residuals),
and at e=0.3 over a full orbit the circle fit was actually decent,
so the spec's headline ("converges and stays wrong") was invisible.
Rebuilt render-only (sim.js generateData/fitCircle/rms + the 3
invariants byte-identical):
- The Gauss/Ceres story made live: an observer logs noisy positions
  along a true Kepler ellipse one at a time; the arc grows 3 -> N
  and the LS circle is refit every frame, then holds and regrows.
- Default e 0.3 -> 0.56 so the structural bias dominates: the cyan
  circle visibly cannot hug the orange ellipse, recovered R settles
  to a biased 0.909 (not true a=1) and stays there as N grows. The
  verdict text is keyed to |R - a| (set by e, not 1/sqrt N).
- Residual sticks point -> nearest spot on the fitted circle
  (coherent two-lobe pattern: the only tell of misspecification, as
  the spec demands). Demoted strip: recovered R vs arc length,
  flattening below the dashed true-a line.
- Capture sweeps the arc (3/36 exact-but-wrong, RMS 0, |R-a| 0.277
  -> 36/36 biased R 0.909, |R-a| 0.091) -> 5 byte-distinct goldens.
Live-verified at e=0.56 (arc grows and loops; physically exact).
Gate: 3 invariants + smoke + visual 5/5 x3 PASS. Shipped.
