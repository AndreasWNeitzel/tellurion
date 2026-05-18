# DEVNOTES - FIS1013-lissajous-figures (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. x=A sin(a t+delta), y=B sin(b t). Main panel traces the
Lissajous figure with a moving pen; two side strips show x(t), y(t).
Readout: a, b, delta, ratio, period. Closed-form parametric. Pure
local sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (3:5 figure, component strips,
  progressive trace, render correct). Health: render correct.
- Fixed: placeholder hook/one_paragraph rewritten approachable (XY
  oscilloscope, small-integer ratio closes, phase morphs). Removed
  the raw crawford-waves key from the figcaption. Render-neutral, NO
  recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).
