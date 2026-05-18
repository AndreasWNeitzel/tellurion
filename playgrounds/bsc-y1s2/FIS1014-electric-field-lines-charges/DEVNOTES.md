# DEVNOTES - FIS1014-electric-field-lines-charges (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.
Lives under playgrounds/bsc-y1s2/ (FIS1014 = year-1 semester-2 E&M).

## What it is
Canvas2D. Field lines of point-charge presets (dipole / two-plus /
quadrupole / mono-plus), tangent to E = sum q_i (r-r_i)/|r-r_i|^3,
arc-length Euler streamline tracing (ds=0.04). Draggable charges;
"shoot test charge" follows F=qE (Euler dt=0.005). Readout on-canvas.

## Post-build sweep (2026-05-18) - consumed a deep-audit REVIEW.md
- The chunk-0 DEEP audit (REVIEW.md, "deep audit; supersedes")
  verified the governing equation against Griffiths Introduction to
  Electrodynamics Ch. 2 (sim.js lines 17-27) and three limiting
  cases against invariants.test.mjs (dipole axial; two-like null at
  midpoint; monopole 1/r^2 far field) -> physics faithful, audited.
  It SUPERSEDED the shallow first pass which had over-escalated this
  to "NEEDS CODE FIX + RECAPTURE": the deep verdict is RENDER-NEUTRAL
  TEXT FIX ONLY.
- My own inspection of t-075 and t-100: both are the mono-plus
  preset; the test charge DOES advance slightly between them (rail
  dot + a nearby arrow differ). So it is a minor reference-set
  redundancy (last two frames same preset), NOT a frozen animation
  and NOT a render bug. The 5 goldens still show 4 distinct field
  configs + test-charge motion. Render-correct.
- Fixed: placeholder hook/one_paragraph (the real blocker; renders
  literally on the gallery card) rewritten approachable (field lines
  tangent to E, Gauss density, the four presets, F=qE test charge).
  No raw bib keys in index.html/README (verified clean). NO
  recapture (render-neutral, physics verified, frames correct).
- Optional future polish (NOT a blocker, recorded for hero-promotion
  / a later capture tweak): make t-100 a fifth distinct preset
  instead of a second mono-plus so the reference set has no repeated
  configuration.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  7 passed + visual 5/5 x3. Shipped.
