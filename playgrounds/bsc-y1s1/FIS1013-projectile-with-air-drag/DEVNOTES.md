# DEVNOTES - FIS1013-projectile-with-air-drag (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Three projectiles, one launch: vacuum (gold, longest),
Stokes linear drag (blue), quadratic drag (red, shortest/steepest).
RK4 dt=0.01 (stepProjectile); header readout v0/angle/t/vacuum range.
Pure local sim.js.

## Post-build sweep record (2026-05-18) - REAL capture defect fixed
- Opus visual-reviewer 5/6, FAIL on "frames t-050/075/100 identical".
  Objectively confirmed real: committed-golden inter-frame SSIM was
  0.9587, 0.9426, 1.0000, 1.0000 (the last three pixel-identical).
- Root cause: capture used target = round(frac*600) steps, but the
  vacuum flight is only ~288 steps (t_f = 2 v0 sin/g at dt=0.01,
  v0=20, angle=45 -> ~2.88 s). So frac >= 0.5 -> all past landing ->
  three identical post-landing frames; the visual gate would pass
  SSIM=1.0 against duplicates while the reference set fails to show
  the flight.
- Fix: scale capture steps to the vacuum flight time:
  tFlight = 2 v0 sin(angle)/G; stepsLand = tFlight/0.01;
  target = round(frac * stepsLand * 0.96). (Imported G from sim.js.)
  0.96 keeps frac=1.0 just before touchdown so all five frames are
  distinct and in-flight. New inter-frame SSIM 0.98/0.98/0.97/0.96
  (no more 1.0000 duplicates). Verified by my own t-025/t-100
  inspection (early ascent -> full vacuum arc still flying while the
  shorter drag arcs have landed) and a re-dispatched Opus
  visual-reviewer: 6/6, "prior identical-frames defect fully
  resolved". Goldens recaptured; visual gate 5/5 x3.
- Also fixed: placeholder hook/one_paragraph rewritten approachable
  (vacuum parabola vs real asymmetric drag arcs, Reynolds regime).
  Removed the raw marion-thornton key from the figcaption; figcaption
  notes the capture spans the vacuum flight. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- recapture (REQUIRED, capture path changed): node scripts/capture-reference.mjs
  --playground FIS1013-projectile-with-air-drag --deterministic
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
- node scripts/build-index.mjs

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  8 passed + visual 5/5 x3. Shipped.
