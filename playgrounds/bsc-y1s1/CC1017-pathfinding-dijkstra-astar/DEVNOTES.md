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

## Follow-up (2026-05-18, three more complaints)

User: "(a) many seeds give a straight line directly to the goal, very
bad. (b) the bolt should fire as soon as EITHER algorithm reaches its
goal, not both. (c) track steps vs path length (Dijkstra slower but
presumably shorter path?)."

- (a) The old connectivity fallback cleared a STRAIGHT mid-row corridor
  and start/goal shared the mid row, so disconnected seeds were trivial.
  Iterated several geometries (headless seed sweeps 1..40 each time):
  * diagonal corners + meander carve -> still ~Manhattan (15-38/40).
  * full-height comb barriers + serpentine carve -> winding (len ~2.4x
    Manhattan) but A*/Dijkstra ratio collapsed to ~1.16x (a single
    forced corridor removes the heuristic's whole advantage; that is
    the playground's entire pedagogy, so rejected).
  * FINAL: organic block maze + a SINGLE river bridge on the bank
    opposite a same-band start/goal. The only crossing is far from the
    direct line, so every seed takes a deep V detour (len min/avg/max
    77/143/155 vs Manhattan ~71; 39/40 clearly winding) while the open
    banks keep A*'s pruning (ratio min/avg/max 1.3/1.8/5.5x). cost
    equality A*==Dijkstra 40/40. The meander carve remains only as a
    defensive net (one open bridge means it ~never fires).
- (b) rebuild() now caches st.firstGoal = min(order.indexOf(goal)) over
  the two searches and st.firstName; searchEnd() returns firstGoal, so
  the existing k>=searchEnd() transition fires the bolt the moment the
  first (almost always A*) reaches the goal.
- (c) Bottom info strip (dark backdrop, no overlap): during search a
  live "Dijkstra N settled  A* M settled" line; in flash/rest two lines
  giving "X reached first", the identical optimal path length+cost, and
  "Dijkstra Nd  A* Na  (R x fewer for the identical route)" -- which
  also corrects the misconception: both return the SAME optimal path
  (admissible heuristic), A* just settles fewer. Removed the redundant
  per-panel "cells settled" label that was overlapping the strip.
- Re-verified: invariants 5/5, frames inspected, visual gate 5/5 x3.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (5 tests)
- recapture (REQUIRED, #stage + capture changed): node
  scripts/capture-reference.mjs --playground
  bsc-y1s1/CC1017-pathfinding-dijkstra-astar --deterministic
- visual gate: npx playwright test visual.test.mjs (SSIM>0.92 x3)
- node scripts/build-index.mjs

## Per-panel independent bolts + 5s rest (2026-05-18)

User: "(a) you made both finish together, hiding that one scans far
more; (b) the thunder should fire per panel as soon as THAT search
finishes, not wait for the other; (c) rest is too fast, make 5s;
(d) I cannot see which has the shortest path."

- Replaced the single global flash phase with two per-panel timers
  st.djFlashT / st.asFlashT (-1 until that search reaches its goal,
  then 0..FLASH_DUR). drawBolt(pts, ft) is parameterised on the
  panel's own ft. A panel reveals its FULL settled field once it has
  reached (ft>=0) while the other is still min(order,k): A* solves and
  flashes while Dijkstra is visibly still flooding, then Dijkstra
  flashes when it finishes. searchEnd()/the 'flash' phase removed;
  search -> rest when both timers complete.
- REST_DUR 220 -> 300 frames (5 s).
- Per-panel header status (right-aligned, shortened so it no longer
  collides with the shortened titles "Dijkstra (flood)" /
  "A* (heuristic)"): "scan N" while flooding, "done A -> path L" once
  reached. Bottom strip switches to the comparison the moment BOTH
  have reached: same optimal path length+cost, and the effort gap
  (A* scanned Na, Dijkstra Nd, ratio x more work). The honest point
  is effort, not path length (admissible heuristic -> identical path).
- Capture: 5 frames = flood / A*-bolt-while-Dijkstra-floods /
  A*-steady-while-Dijkstra-floods / Dijkstra-bolt / 5s rest. Inspected
  directly; invariants 5/5 (sim untouched); visual gate 5/5 x3.
- NOTE for #256 still open: with an admissible heuristic A* returns the
  SAME optimal path as Dijkstra by construction; a heuristic-weight
  (greedy / weighted A*) control is needed to show the genuine
  speed-vs-optimality trade-off.
