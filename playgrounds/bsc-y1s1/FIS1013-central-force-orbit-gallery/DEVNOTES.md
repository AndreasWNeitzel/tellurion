# DEVNOTES - FIS1013-central-force-orbit-gallery (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Orbit under a central force F ~ r^p with a live effective-
potential V_eff(r) panel (energy line + turning points) and a readout
(E, L, p, r, class). 5 presets: Kepler ellipse, harmonic, precessing
rosette, unbound escape, near-circular. Pure local sim.js, no shared
engine, no GL.

## Post-build sweep record (2026-05-18) - capture gallery fix
- Opus visual-reviewer: 5/6, PARTIAL on "frames show only the Kepler
  preset, not the gallery contrast" (render correct; the capture path
  `if (CAPTURE_NAME) advance(1.0 + CAPTURE_FRAC*6.0)` only ever used
  the default Kepler preset). A real pedagogical gap for a *gallery*.
- Fix: capture now picks a preset by CAPTURE_FRAC index
  (Object.assign(st, PRESETS[idx]); rebuild(); advance(6.0)), so the
  five goldens step Kepler ellipse / harmonic / precessing rosette /
  unbound escape / near-circular. Deterministic. New inter-frame SSIM
  0.87..0.91 (was ~all-Kepler). Verified by my own inspection (t-000
  bound ellipse, t-050 rosette p=-2.5, t-100 near-circular E at the
  V_eff minimum) and a re-dispatched Opus visual-reviewer: 6/6,
  "prior single-preset defect resolved". Visual gate 5/5 x3.
- Also removed the raw `goldstein` bib key from the user-facing
  data-slot caption. hook/one_paragraph were already approachable.
- Minor polish (NOT a blocker, recorded for hero-promotion): the
  rosette frame traces only a short arc at advance(6.0); a longer
  trace would show the full flower. The frame is still correct and
  distinct, and the live page traces the full rosette over time.
- Index rebuilt.

## Invariants
6 tests (orbit closure for p=-1/Hooke, V_eff turning points, E/L
conservation via the symplectic step, escape classification). Plus
in-page __physicsCheck (dE<1e-4, dL<1e-7 over 2e4 steps). All
unaffected by the capture change.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (6 tests)
- recapture (REQUIRED, capture path changed): node scripts/capture-reference.mjs
  --playground FIS1013-central-force-orbit-gallery --deterministic
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
- node scripts/build-index.mjs
