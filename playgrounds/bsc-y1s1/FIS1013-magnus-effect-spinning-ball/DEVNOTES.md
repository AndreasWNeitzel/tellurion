# DEVNOTES - FIS1013-magnus-effect-spinning-ball (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Same launch, three spins (none / chosen / opposite); Magnus
force perpendicular to v and spin, plus gravity + quadratic drag.
Spinning ball with spin arrow; readout: range with vs without spin.
RK4. Pure local sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (three trajectories, topspin shortens
  range 20.59 vs 22.73 m, spin arrow, paper-style caption already
  good). Render correct.
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (Magnus = pressure asymmetry from spin; curveball / knuckleball).
  Removed the raw adair1990 key from the figcaption. Render-neutral,
  NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.
