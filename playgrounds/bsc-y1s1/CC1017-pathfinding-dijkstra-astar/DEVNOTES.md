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

## Live-feedback rework (2026-05-18) - three user complaints

User: "(1) solved in ~0.5 s on default params, make the grid higher-res
so the search struggles longer. (2) the winning path only pulsates;
I want a single dramatic flash like thunder that then dissipates,
leaving just the path. (3) it resets immediately, give the user time
to appreciate the result."

- (1) Grid 40x26 -> 72x48 (~3.3x cells). sim.js: wall-block divisor
  36 -> 26, piazzas fixed 5 -> floor(cols*rows/320) with random
  sizes, so the maze is denser and Dijkstra's uniform-cost flood
  visibly bulges. Headless (seeds 1/7/40): Dijkstra settles
  1580/1627/1929 cells vs A* 70/1119/630 (up to 22.6x contrast),
  sameOptimum=true. Default speed 8 -> 6, slider max 30 -> 60. At
  speed 6 the flood is ~4-5 s, not 0.5 s.
- (2) Replaced the `0.5+0.5*sin(k*0.25)` path pulsation with a phase
  machine: search -> flash -> rest. FLASH (58 frames): a white-hot
  head sweeps start->goal (attack, 26 f, additive 'lighter' core +
  radial halo), then the whole path blazes and an exp(-t/11) glow
  decays to a steady amber line (32 f). One event, not a loop.
- (3) REST phase holds the solved map static for REST_DUR = 220 f
  (~3.7 s) with a "shortest path solved cost N new map in X s"
  caption and a shrinking progress bar, then reseeds (seed -> seed%40
  +1) and rebuilds. Restart button / seed slider reset to search.
- Capture rewritten: 5 frames = early flood / mid (A*-vs-Dijkstra
  contrast) / full frontier / flash bolt peak / rest steady path.
  All distinct. Inspected directly; visual gate 5/5 x3. Invariants
  unaffected (5/5) - sim.js search logic unchanged, only map density.
- Removed the now-unused DEFAULT_SEED import from playground.js.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (5 tests)
- recapture (REQUIRED, #stage + capture changed): node
  scripts/capture-reference.mjs --playground
  bsc-y1s1/CC1017-pathfinding-dijkstra-astar --deterministic
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
- node scripts/build-index.mjs
