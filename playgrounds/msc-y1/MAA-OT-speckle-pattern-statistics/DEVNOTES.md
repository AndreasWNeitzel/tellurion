# DEVNOTES - msc-y1/MAA-OT-speckle-pattern-statistics (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  3 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Real card text (hook + one_paragraph) sourced from the spec body; render-neutral.
invariants Tests  3 passed + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286)
Below hero: the speckle was frozen (render() recomputed the identical
fixed-seed field every frame, so it never boiled despite the hook),
no statistics despite the title, wasteful. sim.js APPENDED
(speckleField + expectedSpeckleCount byte-identical so the 3 original
invariants pass): boilField(N,D_r0,w,t,seed) advances each mode's
phase at its own seeded rate (genuine turbulence boiling; t=0 ==
static draw, decorrelates with t), and negExpPdf(I,Ibar). invariants
3 -> 5 (boil non-negative + same-seed-same-t identical + decorrelates;
negExp normalised with mean Ibar). playground.js rebuilt: live
boiling short-exposure image, a long-exposure accumulator forming the
seeing disk, and a full-width intensity-statistics histogram vs
exp(-I/Ibar) with the speckle-contrast readout V=sigma/mean -> 1.
Modes capped at 90 for frame cost (true (D/r0)^2 still labelled);
relayout fixed a histogram/long-exposure overlap (now stacked below).
Capture sweeps D/r0 2..14 with a deterministic 24-frame long
exposure. Gate: 5 invariants + smoke + visual 5/5 x3 PASS. Shipped.
