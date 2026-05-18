# DEVNOTES - CC1017-floating-point-precision-pitfalls (hidden dev ref)

Repo-only. NOT linked from index.html, NOT in the gallery, never shown
to site users.

## What it is
Canvas2D. The Patriot/Dhahran (25 Feb 1991) range-gate failure as a
drivable floating-point pitfall: the fire-control clock multiplies
counts by a 24-bit chop of 0.1, losing ~9.537e-8 s/tick, accumulating
linearly with uptime; after ~100 h the 0.34 s error displaces the
range gate ~0.5 km, the Scud track drops, no interceptor fires. Drag
uptime; toggle the patched build; lower panel shows the 24-bit chop
and the linear error growth.

## Numerics / engine
Pure local sim.js (no shared engine, no GL). Exact IEEE 24-bit chop
error per tick times uptime times closing speed. CAPTURE_FRAC drives
the uptime for the 5 reference frames.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer: 6/6 on the visual rubric (clear scene,
  error-vs-uptime panel, monotonic drift, legible labels, no blow-up,
  story reads). One PARTIAL it raised, "cannot confirm a live
  monospace numeric readout from static PNGs", is a static-frame
  limitation, not a render defect; the 24-bit chop value and
  error/tick ARE shown as text in-frame, and the spec's live-readout
  is the on-page panel.
- Verified by my own inspection of t-100: "TRACK LOST" banner, gate
  walked off to the barracks (impact burst), Patriot turret, the
  "0.1 ~ 209715/2097152 = 0.0999999046, error/tick 9.537e-8 s"
  explainer, and the linear clock-error graph. Minor cosmetic: at the
  terminal frame the "range gate" / "barracks" labels are partly over
  the impact burst (does not obscure the physics story; recorded as a
  hero-promotion polish nicety, NOT a blocker; reviewer rated 6/6).
- Health: hook/one_paragraph already approachable. Only fix: removed
  the raw "(`goldberg1991`)" bib key from the user-facing figcaption
  (kept the human-readable GAO / Skeel / Goldberg sources; spec
  Citations keeps the `key` cross-refs per repo convention).
  Render-neutral, NO recapture.
- 12 invariants. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (12 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was figcaption-only).
