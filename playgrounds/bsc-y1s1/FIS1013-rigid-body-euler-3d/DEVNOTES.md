# DEVNOTES - FIS1013-rigid-body-euler-3d (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
WebGL2. Torque-free Euler rigid-body: Phong-shaded inertia ellipsoid,
three principal axes, omega (white) circulating the space-fixed L
(gold), polhode traced on the surface; intermediate-axis (Dzhanibekov)
flip. Readout: E_rot, |L|, omega.e2, t, state.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS; my own t-050 inspection confirms a
  correct shaded ellipsoid + polhode + axes + readout (E=26.5873,
  |L|=12.6305, omega.e2=-3.882 = the sign flip of the intermediate-
  axis instability, t=6.50, state=intermediate). WebGL2 renders fine
  under the capture harness; NOT stale (unlike the black-hole hero).
- hook/one_paragraph already approachable (ph=0). Only fix: removed
  the raw landau-mechanics key from the user-facing data-slot caption.
  Render-neutral, NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was caption-only).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
