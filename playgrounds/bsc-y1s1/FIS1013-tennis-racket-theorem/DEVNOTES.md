# DEVNOTES - FIS1013-tennis-racket-theorem (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D pseudo-3D. Free rigid body, I1 < I2 < I3, spun about the
intermediate axis: periodic Dzhanibekov flips. RK4 on Euler's
equations + quaternion kinematics. Readout: spin axis, |L| drift
(0.0e+0, exact). Caption: energy and |L| conserved, the flip is free.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS; my own t-075 inspection confirms a
  3D bar mid-flip, |L| drift 0.0e+0, the intermediate-axis instability
  reads. Render correct.
- hook/one_paragraph already approachable (ph=0). Only fix: removed
  the raw goldstein-mech key from the figcaption. Render-neutral, NO
  recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was caption-only).
