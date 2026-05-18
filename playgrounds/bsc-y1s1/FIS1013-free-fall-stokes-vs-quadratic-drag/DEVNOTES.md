# DEVNOTES - FIS1013-free-fall-stokes-vs-quadratic-drag (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Three balls fall: vacuum, Stokes (linear) drag, quadratic
drag; left = falling bodies, right = v(t) with a dashed Stokes
terminal-velocity line. Readout: terminal velocities (Stokes, quad).
RK4 dt=1/240. Pure local sim.js.

## Post-build sweep record (2026-05-18) - reviewer false-blocker adjudicated
- Opus visual-reviewer 5/6, escalated "live invariant readout
  ABSENT" as a hard-rule blocker. FALSE: index.html line 46 has
  <div class="readout" id="readout" role="status"> with
  readout-vts / readout-vtq spans (terminal velocities). The visual
  gate screenshots only #stage, so an HTML readout below the canvas
  is never in the golden PNGs and the reviewer could not see it.
  Hard rule 6 satisfied. Recorded per CLAUDE.md 12.3.
- Render correct (reviewer PASS on all 5 rubric items: curves,
  terminal-velocity separation, frame progression, no defects).
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (three drag laws, terminal velocity, Reynolds number). Removed the
  raw marion-thornton key from the figcaption. Render-neutral, NO
  recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- live-readout check: HTTP-serve (tests/helpers/static-server.mjs),
  read #readout-* textContent; not file:// (ESM CORS).
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
