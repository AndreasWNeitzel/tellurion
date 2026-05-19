# DEVNOTES - bsc-y2s1/FIS2002-elastic-wave-modes-solid (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Fix 2026-05-19 (user: colormap, escapes box, no redo)
- Field map rdbu (white at zero) -> shared divBlack (black at zero).
- The strained grid and growing P/S wavefront rings spilled past the
  panel. Field, grid, rings and station marker are now clipped to
  the FX,FY,FPX box; the border + caption drawn after restore.
- HORIZON 150 -> 360 (long enough for the slower S front to reach
  the station) and the loop auto-replays at HORIZON instead of
  halting, so the strike -> P -> S -> seismogram cycle runs
  continuously and the lambda/mu sliders visibly re-run it.
Render/loop only; sim.js + 6 invariants byte-identical; goldens
recaptured. Gate 6 + smoke + 5/5 x3.
