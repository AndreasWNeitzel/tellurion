# DEVNOTES - bsc-y2s2/FIS2003-quantum-double-slit-accumulator (hidden dev ref)

Repo-only.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Fix 2026-05-19 (live-review #282)
User: "the sliders don't actually change the visualization of the
slits themselves (positioning, width, detector, etc.)." Root cause:
the drawn slit gap was (st.d*1e-4)/Y*(SCH/2)*0.5 + 16, the physical
micron term against a 0.07 m screen window evaluating to ~0.1 px, so
the slits were pinned at ~16 px for the whole d range; no width
control existed. The fringe physics (sim.P()) responded but the
apparatus the user looks at did not. Render/state only (sim.js,
__physicsCheck and invariants byte-identical):
- slitGapPx() = 10 + 46*st.d (33..125 px), slitHalfPx() = 3 + 6*st.a;
  barrier openings, ray paths, which-path glyphs use them, plus a
  dashed separation caliper and live "d=Nx"/"a=Nx" labels.
- Added a real "slit width a" slider; P() now uses BASE.a*st.a so the
  single-slit envelope visibly responds (sim.intensity already takes
  P.a; default st.a=1 keeps default physics and __physicsCheck
  identical). Reset restores a=1.
interaction-probe: all four controls drive the canvas. Recaptured 5
goldens (new apparatus). Gate 6 inv + smoke + visual 5/5 x3 PASS.
