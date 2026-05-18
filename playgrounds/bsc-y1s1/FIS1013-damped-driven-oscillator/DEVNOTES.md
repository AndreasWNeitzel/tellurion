# DEVNOTES - FIS1013-damped-driven-oscillator (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. x'' + 2 gamma x' + omega_0^2 x = F0 cos(omega t). Top: live
x(t) vs drive; bottom: steady-state amplitude-vs-frequency curve with
a cursor at the current omega; readout omega, gamma, Q, omega_r. RK4
of the ODE + analytic steady-state curve. Pure local sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (x(t) and drive traces, sharp
  resonance curve with cursor, transient->steady evolves across
  frames, readout legible, no defects).
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (swing-pushing intuition, resonance, Q sets peak sharpness).
  Removed raw `marion-thornton` key from the user-facing figcaption.
  Render-neutral, NO recapture. Invariants 6/6. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (6 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).
