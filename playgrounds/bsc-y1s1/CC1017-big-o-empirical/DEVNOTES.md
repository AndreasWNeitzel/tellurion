# DEVNOTES - CC1017-big-o-empirical (hidden dev reference)

Repo-only. NOT linked from index.html, NOT in the gallery, never shown
to site users.

## What it is
Canvas2D. Same seeded shuffle of [1..N] sorted by an O(N^2)
comparison sort (bubble/insertion) and merge sort O(N log N) side by
side, replayed from a recorded comparison/write event stream (speed
decoupled from the sort). Each finished race drops a measured point on
a lower panel over the theoretical 1/2 N(N-1) and N log2 N curves; a
Sweep control fills the whole curve. N=256.

## Numerics / engine
Pure local sim.js (no shared engine, no GL). Deterministic seeded
shuffle, recorded event stream replayed by CAPTURE_FRAC for capture.
The point of the piece is that the measured counts land exactly on
the closed-form curves (the abstract Big-O plot IS the mechanism just
watched).

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer: 6/6 PASS. Confirmed by my own direct
  inspection of t-100: both arrays sorted, red measured points sit on
  1/2 N(N-1), cyan on N log2 N, counts 21507 vs 1349, no overlap,
  story reads at a glance.
- Health: hook and one_paragraph were already approachable (this
  playground was built properly, unlike the _heroes which had
  STATUS placeholders). primary_citation newman2013 valid.
- Only defect: the user-facing index.html figcaption showed a raw
  bib key "(`newman2013`)". Removed it (kept the human-readable
  Cormen source, which is the correct primary for sorting Big-O; the
  spec Citations section keeps the `key` cross-refs, which is the
  in-repo convention and is fine). Render-neutral (figcaption is
  below-canvas HTML; the visual gate screenshots #stage only), so NO
  recapture / visual-gate rerun.
- 9 invariants. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (9 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was figcaption-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  9 passed + visual 5/5 x3. Shipped.
