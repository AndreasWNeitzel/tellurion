# DEVNOTES - FIS1013-projectile-drag-magnus-3d (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D pseudo-3D. Vacuum / drag / drag+Magnus projectile arcs over
a perspective ground grid; spinning ball with a spin-axis arrow;
readout range/apex/side/tof/spin. Pure local sim.js.

## History
Earlier this session a NaN / negative-index crash in the trajectory
phase indexing + an unclamped frame dt were fixed (commit be6f62a);
re-verified 6/6 invariants + visual 5/5 x3 then. Render deterministic.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (three arcs, Magnus lateral offset,
  spin arrow, no NaN/garble; the harsh NaN-focused pass found none).
  Render correct and stable.
- hook/one_paragraph already approachable (this one was not a
  placeholder). Only fix: removed the raw marion-thornton key from
  the user-facing data-slot caption. Render-neutral, NO recapture.
  Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was caption-only;
  the render itself was verified earlier when the NaN bug was fixed).
