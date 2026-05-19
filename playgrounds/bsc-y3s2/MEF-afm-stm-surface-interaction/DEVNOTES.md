# DEVNOTES - bsc-y3s2/MEF-afm-stm-surface-interaction (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  7 passed + visual 5/5 x3. Shipped.

## Rework 2026-05-19 (user: want an EM-style 3D bumpy micrograph; STM plot boring + escapes)
sim.js 1D exports byte-identical; surfaceProfile2D appended (square
atomic lattice, exactly a-periodic, bounded by amp) + 1 invariant.
- Replaced the 1D side-view with a greyscale relief-shaded
  micrograph: Lambert shading of the 2D corrugation under a raking
  light + fine grain (electron-microscope look), pre-rendered once;
  the tip raster-scans top-down with the un-acquired region dimmed
  (the scan in progress). 8 -> ... invariants 7 -> 8.
- STM law panel: the curve escaped the box when I > I0 (py beyond
  the top). Now a clamped log axis with explicit decade gridlines
  (a decade per angstrom, the headline) inside a clip rect, plus
  the AFM F(d) clamped likewise; more informative.
- Scan-trace panel is the profile along the current scan row (ties
  the trace to the visible row), clipped/auto-ranged.
Gate 8 + smoke + visual 5/5 x3.
