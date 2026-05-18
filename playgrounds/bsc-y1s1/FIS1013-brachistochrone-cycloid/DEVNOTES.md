# DEVNOTES - FIS1013-brachistochrone-cycloid (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Three frictionless beads race A=(0,0) to B=(4,-2) under
gravity on a straight line, a circular arc, and a cycloid. Cycloid
closed-form (theta linear in t), line uniformly accelerated, arc by
trapezoidal integration (5000 nodes, asymptotic start near the v->0
singularity). Endpoint cycloid R fixed by bisection on theta_B. Pure
local sim.js, no shared engine, no GL.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS: three distinct curves between common
  endpoints, beads constrained to curves, per-curve time bars, cycloid
  decisively first (T~1.139 s vs line 1.428 s vs arc 7.326 s), no
  defects.
- Defects fixed: hook="STATUS: needs_hook",
  one_paragraph="STATUS: needs_paragraph" (rendered literally on the
  card) rewritten approachable (Bernoulli 1696, why the steep early
  dive wins, exact closed-form race). Removed the raw bib key
  "(`marion-thornton`)" from the user-facing figcaption. All
  render-neutral (frontmatter + caption only; #stage unchanged), NO
  recapture; index rebuilt so the card picks up the new hook.
- 8 invariants.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (8 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.
