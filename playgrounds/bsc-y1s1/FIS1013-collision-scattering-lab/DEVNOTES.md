# DEVNOTES - FIS1013-collision-scattering-lab (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Elastic two-body scattering shown in the lab frame (inset)
and the centre-of-mass frame (main), with the differential cross-
section panel and a Rutherford analytic overlay; readout chi_CM,
theta_lab, impact parameter b, potential, regime. Pure local sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (lab-vs-CM contrast clear, trajectories
  clean, cross-section + Rutherford overlay correct, no defects).
  Health: hook/one_paragraph already approachable. Only fix: removed
  the raw `goldstein` key from the user-facing data-slot caption.
  Render-neutral, NO recapture. Invariants 7/7. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (7 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was caption-only).
