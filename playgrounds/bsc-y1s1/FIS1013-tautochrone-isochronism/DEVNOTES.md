# DEVNOTES - FIS1013-tautochrone-isochronism (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Five beads released from different heights on a cycloid;
all reach the bottom at T/4 = pi sqrt(R/g) regardless of amplitude
(isochronism). Closed-form s(t)=s0 cos(wt), w=sqrt(g/4R), mapped
through the cycloid. Progress bar marks quarter/half/three-quarter.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (beads converge at the bottom at the
  quarter period, return at the full period, render correct).
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (Huygens cycloidal clock, period independent of amplitude). Removed
  the raw huygens1673 key from the figcaption. Render-neutral, NO
  recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  6 passed + visual 5/5 x3. Shipped.
