# DEVNOTES - msc-y1/MAA-CO-cosmic-distance-ladder (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Revamp 2026-05-19 (live-review #276)
User verdict on the old build: "no physical units, methods conveniently do
not overlap (unrealistic), changing sigma just widens an unlabelled y axis,
incomplete and boring, needs a complete revamp; e.g. a logarithmic distance
render of the universe." Old playground.js was 4 vignette panels + per-rung
reach bars + unexplained error whiskers (a plot, not the physics).

Rebuilt playground.js (render-only; sim.js / invariants / __physicsCheck
byte-identical):
- Primary view is one log10(distance) ruler of the universe, 1 pc to
  10 Gpc, with labelled unit ticks (pc, kpc, Mpc, Gpc).
- Each rung is its real working RANGE, not a point: parallax 1 pc-3.16 kpc,
  Cepheid 1 kpc-31.6 Mpc, SN Ia 3.16 Mpc-3.16 Gpc, Hubble 31.6 Mpc-10 Gpc.
  Ranges deliberately overlap; the overlap is shaded and labelled
  "calibration handed up" (the actual point of the ladder).
- cumErr(logpc): chain of rungs to that distance combined in quadrature
  (each rung calibrated on the one below, so errors compound). Surfaced as
  a labelled "+/- N%", an error band of true dex half-width, a readout
  "cum. error", and a diagnostic strip of the growing error budget.
- Draggable target cursor across the whole axis; pointerdown/move/up name
  the reaching method and its fractional error. Real signposts (Proxima,
  Hyades, LMC, M31, Virgo, Coma, distant SN) at true distances.
- Slider-driven anchors: ladder(state)[i] dot marks where each rung's
  physics is set on its bar.
- Polish: rung yc spacing widened off the tick row; cursor label clamped
  clear of the HTML readout panel; lbl() dark-halo so text stays legible
  over the coloured bars (deterministic, no RNG).
- Capture sweep: targetLog = 1 + f*8.5 -> 5 distinct rungs/errors.
Gate: 6 invariants + smoke + visual 5/5 x3 PASS. Shipped.
