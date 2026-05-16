# Dijkstra vs A* on a city grid

The same shortest-path problem is solved twice on a procedural city:
streets cost 1, piazzas cost 4, and buildings plus a diagonal river
are walls. On the left Dijkstra orders its queue purely by distance
travelled, so it floods outward in every direction. On the right A*
adds a Manhattan-distance estimate of the remaining trip, which steers
a tight beam straight toward the goal. Cells are painted in the order
they are settled, so the difference in search shape is immediate.

Both algorithms return the identical optimal route, and it flashes
gold once a search reaches the goal, but the settled-cell counters
show A* doing a fraction of the work. That is the whole point of an
admissible heuristic: same answer, far less exploration.

Controls: speed sets how fast the frontier is revealed, the map-seed
slider regenerates the city, Restart replays the search, Pause/Play
holds it. Reference: Cormen, Leiserson, Rivest, Stein, Introduction to
Algorithms 3e ch. 24 (`cormen2009`); Hart, Nilsson, Raphael 1968.

## Verification

- Strong invariants: A* cost equals Dijkstra cost; A* expands no more
  (and strictly fewer somewhere); paths are valid and cost-consistent;
  the city is seed-deterministic; connectivity is guaranteed (5 tests).
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE (frontier growth and the path flash across the frames).
- Last verified: see `.verified`.
