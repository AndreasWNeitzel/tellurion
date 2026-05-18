# DEVNOTES - FIS1013-coupled-pendulums-normal-modes (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Two spring-coupled pendulums; symmetric (sqrt(g/L)) and
antisymmetric (sqrt(g/L + 2 k d^2 / m L^2)) normal modes; asymmetric
IC gives full energy beating, period 2 pi/(omega_- - omega_+).
Energy-share bar, phase portrait, angle traces. RK4 on the linearised
EOM. Pure local sim.js.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (coupled pendulums + spring drawn,
  energy sloshes 94%->2%->86%, phase portrait sym/anti, beat envelope
  in traces, no defects).
- Fixed: placeholder hook/one_paragraph (rendered literally on the
  card) rewritten approachable (energy-sloshing intuition, the two
  modes, beat period). Removed raw `french-waves` key from the
  user-facing figcaption. Render-neutral, NO recapture. Invariants
  8/8. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (8 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
