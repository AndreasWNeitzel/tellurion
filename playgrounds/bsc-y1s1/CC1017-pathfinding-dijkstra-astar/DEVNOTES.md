# DEVNOTES - CC1017-pathfinding-dijkstra-astar (hidden dev reference)

Repo-only. NOT linked from index.html, NOT in the gallery, never shown
to site users.

## What it is
Canvas2D. A procedural city grid (streets cost 1, piazzas cost 4,
buildings and a diagonal river are walls) searched by Dijkstra and by
A* with an admissible Manhattan heuristic, side by side. Settled cells
painted in pop order (viridis); on reaching the goal the optimal path
flashes. Both return the same optimal cost; A* expands far fewer
cells (counts live). Map seed and animation speed adjustable.

## Numerics / engine
Pure local sim.js (no shared engine, no GL). Admissible Manhattan
heuristic guarantees A* optimality; the visual contrast (uniform-cost
flood vs goal-directed beam, same path) is the whole pedagogical
point. CAPTURE_FRAC drives search progress for the 5 frames.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer: 6/6 PASS. Confirmed by my own inspection of
  t-050: Dijkstra broad viridis flood (331 settled) vs A* tight
  goal-directed beam with the yellow optimal path drawn (201
  settled); grids aligned, counts legible, contrast reads instantly.
- Health: hook/one_paragraph already approachable; primary_citation
  cormen2009 valid. Only fix: removed the raw "(`cormen2009`)" bib
  key from the user-facing figcaption (kept the human-readable
  Cormen et al. source; spec Citations keeps the `key` cross-ref per
  repo convention). Render-neutral, NO recapture / visual-gate rerun.
- 5 invariants. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (5 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was figcaption-only).
