# DEVNOTES - bsc-y2s1/FIS2014-heat-equation-2d-gpu (hidden dev ref)

Repo-only.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Fix 2026-05-19 (live-review #282)
User: "heat source is invisible, needs some kind of bounding box
hitbox so we know where it is." The boundary conditions (fixed-T
cells g.fixed/g.val) and the volumetric source (g.src) only showed as
a viridis colour, indistinguishable from diffused heat. Render only
(sim.js, __physicsCheck, invariants byte-identical):
- bbox()/boxRect()/drawSourceBoxes(): a labelled dashed hitbox around
  each region: orange "heat (fixed T)", cyan "cold sink (T=0)",
  gold "heat source S"; drawn after the streamlines, halo on labels.
- drawBrushCursor(): a live brush-footprint ring (radius 3 cells, in
  the brush colour) follows the mouse so you see where painting lands
  before clicking; mousemove now always tracks st.mx/my/over, cleared
  on mouseleave (not drawn in capture, no mouse).
Recaptured 5 goldens (composite preset now shows the hot left column
and cold right column boxed). Gate 6 inv + smoke + visual 5/5 x3 PASS.
