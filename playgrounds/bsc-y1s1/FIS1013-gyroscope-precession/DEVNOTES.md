# DEVNOTES - FIS1013-gyroscope-precession (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Steady gyroscopic precession: Omega_p = M g r /
(I_s omega_s). Spinning disc on a tilted rod, spin axis L (gold),
weight W (red), torque tau=r x W (green), precession cone trace, plus
an Omega_p-vs-omega_s (1/omega_s) panel with the operating point.
Readout: omega_s, theta, Omega_p, T_p. Pure local sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS; confirmed by my own t-050
  inspection (disc + L/W/tau arrows, precession cone, 1/omega_s curve
  with dot, full readout). Render correct. Steady-precession model
  only (omega_s >> Omega_p); nutation intentionally not modelled,
  stated in the rewritten copy.
- Fixed: placeholder hook/one_paragraph rewritten approachable (top
  that will not fall, faster spin -> slower precession, bicycle /
  gyrocompass). Removed the raw marion-thornton key from the
  figcaption. Render-neutral, NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).
