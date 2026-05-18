# DEVNOTES - FIS1013-inverted-pendulum-kapitza (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Kapitza pendulum: pivot driven vertically; inverted state
stable when a^2 omega^2 / (2 g l) > 1. Left = driven pendulum, right =
effective potential U_eff(theta); readout prints the stability number
+ STABLE flag. RK4 on theta-double-dot = ((g - a w^2 cos(w t))/l) sin
theta. Pure local sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (driven pendulum + U_eff well +
  in-canvas readout, render correct). Health: render correct.
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (vibrational stabilization, a^2 w^2/(2gl)>1, ion traps). Removed
  the raw landau-lifshitz-mechanics key from the figcaption.
  Render-neutral, NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).
