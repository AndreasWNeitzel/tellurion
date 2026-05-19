# DEVNOTES - bsc-y2s2/FIS2006-dipole-radiation-3d (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  7 passed + visual 5/5 x3. Shipped.

## Hero-promotion 2026-05-19
The sin^2 pattern is a surface of revolution about z, so the old yaw spin about z was a visual no-op and the headline 3D object looked static. Replaced it with a pitch sweep so the donut visibly tumbles from edge-on torus to face-on disk; converted the wire-cage surface to a glowing solid lobe (depth-lit fill, additive equatorial bloom), densified the mesh (46x40 to 56x52) and brightened the outgoing wavefronts. Triage verdict: was below bar (thin sparse wireframe, motion barely perceptible); now at bar (frame-filling, luminous, legible tumble). Recaptured 5 distinct goldens; sin^2 pattern, omega^4 power and D=3/2 unchanged (invariants 7/7), rAF ~16.7 ms (60 fps).
invariants Tests  7 passed + visual 5/5 x3. Shipped.
