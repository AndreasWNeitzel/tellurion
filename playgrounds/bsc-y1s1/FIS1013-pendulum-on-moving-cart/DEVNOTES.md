# DEVNOTES - FIS1013-pendulum-on-moving-cart (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Cart free on a rail with a hanging pendulum; horizontal
momentum conserved (p_x = 0), cart recoils as the bob swings. Phase
portrait (x_cart, theta); readout: t, theta, x, E_drift, p_x, M, m,
L. RK4 on the coupled Euler-Lagrange equations. Pure local sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (cart recoils opposite the swing,
  p_x=0 to machine precision across frames, phase portrait, render
  correct). Render correct.
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (momentum bookkeeping, walking on a raft / rocket recoil). Removed
  the raw marion-thornton key from the figcaption. Render-neutral,
  NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.
