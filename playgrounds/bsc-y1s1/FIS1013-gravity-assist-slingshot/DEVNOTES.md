# DEVNOTES - FIS1013-gravity-assist-slingshot (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Spacecraft flyby of a moving planet; the trajectory bends
and the Sun-frame speed changes while the planet-frame speed is
unchanged. Inset Sun-frame panel with before/after velocity vectors.
Readout panel (#readout, populated by playground.js). Source: Bate,
Mueller, White, Fundamentals of Astrodynamics, Ch. 8.

## Post-build sweep record (2026-05-18) - reviewer false-blocker adjudicated
- Opus visual-reviewer 5/6, FAIL "no live readout -> blocker".
  FALSE: index.html line 28 has <div id="readout"
  class="readout-panel" role="status"> (the same absolutely-
  positioned panel pattern the heroes use, filled by playground.js).
  The visual gate screenshots only #stage so the panel is not in the
  goldens; the reviewer could not see it. Hard rule 6 satisfied.
  Recorded per CLAUDE.md 12.3.
- Render correct (reviewer PASS on planet+craft+trajectory, slingshot
  bend, velocity-vector change, frame progression, no defects).
- hook/one_paragraph already approachable. Fix: the figcaption was a
  bare "Figure 1. Gravity Assist Slingshot." (too thin for the
  paper-style caption rule); rewrote it with method + a clean
  human-readable source (BMW Ch. 8, the spec's own reference).
  Render-neutral, NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was caption-only).
