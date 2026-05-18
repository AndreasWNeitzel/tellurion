# DEVNOTES - FIS1013-tennis-racket-theorem (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## Enhancement 2026-05-18 (user feedback)

User: "make it more visually impressive, the path more noticeable; add
a physics-context plot; add object selection (a real racket, a phone,
etc.)." sim.js (Euler + RK4 + quaternion) is correct and was NOT
touched, so its 5 invariants still pass.

- Object presets in playground.js: T-handle, tennis racket, smartphone,
  hardback book, each a small assembly of axis-aligned boxes. The
  principal moments are computed from that geometry (uniform-density
  box inertia + parallel axis, symmetric layouts so the off-diagonal
  vanishes). Verified numerically that every preset has I1 < I2 < I3,
  so body-axis index 1 is always the genuine intermediate axis and the
  Dzhanibekov instability is physically correct, not faked:
  thandle [0.012,0.044,0.054], racket [0.004,0.020,0.024],
  phone [0.014,0.052,0.066], book [0.078,0.160,0.231].
- Visuals: per-part depth-sorted shaded faces (recognizable object,
  not a generic slab); three labelled body-axis arrows with the spin
  axis thickened; a bright widening trail of the +x long-axis tip
  that sweeps a large arc on every flip.
- Physics panel (right third of the canvas): body-frame w1,w2,w3 vs
  time. The intermediate-axis case shows the textbook signature, w2
  swinging through zero and reversing sign while w1,w3 spike; the
  conserved I, E and |L| are printed below (flat = exact solver).
- Capture cycles the four objects across the five frames; text fitted
  inside the canvas (earlier the conserved-quantities line clipped the
  right edge). Visual gate 5/5 x3, frames inspected directly.

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
