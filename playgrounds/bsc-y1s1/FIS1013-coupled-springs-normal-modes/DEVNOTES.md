# DEVNOTES - FIS1013-coupled-springs-normal-modes (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Wall-mass-mass-wall, three equal springs; symmetric and
antisymmetric normal modes (frequency ratio sqrt(3)); general IC gives
beats. Spring chain, x1(t)/x2(t) traces, phase portrait (straight
eigen-line for a pure mode, quasi-periodic orbit for a mix).
Velocity-Verlet + analytic eigenmode decomposition. Pure local sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (chain + springs drawn, beats in
  traces, phase portrait evolves, energy-drift readout, no defects).
- Fixed: placeholder hook/one_paragraph rewritten approachable (two
  carts, march-in-step vs bounce-apart, superposition). Removed raw
  `goldstein2001` key from the user-facing figcaption. Render-neutral,
  NO recapture. Invariants 5/5. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (5 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.
