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

## True-3D rebuild (2026-05-18) - user: "doesn't look 3D to me at all"

The old projection was a fixed oblique shear
`[ox + x*sc + y*0.5*sc, oy - z*sc + y*0.28*sc]`: no perspective, no
camera, no depth cues, so the near-planar arcs read as a flat plot.
sim.js physics is correct (vacuum == analytic parabola, invariants
6/6) and was NOT touched. playground.js render fully rewritten:

- Real perspective pinhole camera: eye orbits the scene centre at
  (azimuth, elevation); view basis fwd/right/up; per-point divide by
  camera depth cz; an auto-fit pass reframes every frame so the
  orbiting scene stays composed.
- Depth cues: perspective ground grid (lines converge, fade with
  depth); a soft black ground shadow under each of the 3 flights;
  vertical stems from the Magnus arc to its shadow; painter's-order
  far-to-near draw; ball radius scales with 1/depth; world-axis
  gnomon drawn from the camera basis so it re-orients with the orbit.
- Controls added (built in playground.js, no index.html control
  change): camera azimuth, camera height, auto-orbit on/off.
- Capture: 5 deterministic frames at distinct (az, el, flight phase)
  so the orbit and 3D framing are obvious; inspected directly (t-050
  oblique, t-100 steep/behind with the gnomon visibly re-oriented).
  Visual gate 5/5 x3. Invariants 6/6 (sim.js unchanged).

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (6 tests)
- recapture (REQUIRED, render rewritten): node
  scripts/capture-reference.mjs --playground
  bsc-y1s1/FIS1013-projectile-drag-magnus-3d --deterministic
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
- node scripts/build-index.mjs
