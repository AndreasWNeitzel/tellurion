---
title: Pathfinding Dijkstra Astar
slug: pathfinding-dijkstra-astar
status: verified
audience: portfolio
created: 2026-05-16
primary_uc: CC1017
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: cormen2009
primary_chapter: 24
hook: 'Same city, same destination: Dijkstra floods every street while A* drives a tight beam to the goal, both finding the identical optimal route.'
one_paragraph: 'A procedural city grid (streets cost 1, piazzas cost 4, buildings and a diagonal river are walls) is searched by Dijkstra and by A* with an admissible Manhattan heuristic, side by side. Settled cells are painted in the order they were removed from the priority queue (viridis), so Dijkstra''s uniform-cost flood and A*''s goal-directed beam are visible at a glance; when a search reaches the goal its optimal path flashes. At heuristic weight 1 both return the same optimal cost while A* expands far fewer cells; pushing the weight above 1 turns A* greedy, reaching the goal with even fewer scans but a suboptimal (longer) path, the classic speed-versus-optimality trade-off, while Dijkstra always proves the true optimum. Each panel fires its own bolt the instant that search reaches the goal, so A* can finish while Dijkstra is still flooding. Map seed, animation speed and the heuristic weight are adjustable.'
tags: [algorithms, pathfinding, animation, live-readout, interactive]
difficulty: 3
tier: simple
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: []
---

# Dijkstra vs A* on a city grid

## Explainer

### What you are looking at

Dijkstra and A* both find the shortest path on a grid, and both
return the same optimal route. The difference is how much of the map
they have to explore to find it. The playground floods both at once
so you see Dijkstra spreading blindly in all directions while A*
drives straight for the goal.

### Dijkstra: shortest path, no foresight

Dijkstra's algorithm grows a frontier outward from the start, always
expanding the unvisited node with the smallest known distance:

$$g(n) = \text{cost of the cheapest known path from start to }n.$$

It expands nodes in order of $g(n)$. Because it has no idea where the
goal is, it explores in expanding rings, like water filling the map,
and only stops when the goal is finally reached. It is guaranteed
optimal but wastes work exploring away from the target.

### A*: add a heuristic toward the goal

A* expands nodes in order of

$$f(n) = g(n) + h(n),$$

where $h(n)$ is a heuristic estimate of the remaining cost to the
goal (here the Manhattan or Euclidean distance). The $g$ term keeps
it honest (paths actually traveled) while $h$ pulls the search toward
the goal. If $h$ never overestimates the true remaining cost (it is
admissible), A* is still guaranteed to return the optimal path, but
it expands far fewer nodes because it ignores directions leading away
from the target. With $h=0$ it degenerates exactly to Dijkstra; the
more accurate (still admissible) $h$ is, the more directed the search.
A heuristic weight $>1$ trades guaranteed optimality for even more
speed (weighted A*). The playground runs both on the same maze and
shows the explored-node counts and the identical final path.

### Things to try

- Watch Dijkstra flood outward symmetrically while A* lances toward
  the goal; compare the explored-node counts.
- Confirm both return the same path length (both optimal with an
  admissible heuristic).
- Raise the heuristic weight and watch A* explore even less but risk
  a slightly longer path (the speed-vs-optimality trade-off).

### Where this comes from

Dijkstra's algorithm and A* follow Dijkstra, Numer. Math. 1, 269
(1959), Hart, Nilsson and Raphael, IEEE Trans. SSC 4, 100 (1968),
and Cormen, Leiserson, Rivest and Stein, *Introduction to
Algorithms*, Chapter 24.

## Setup
A `cols x rows` grid is generated from a seed: building blocks and a
diagonal river (with two bridges) become walls, a few piazzas cost 4,
all other cells cost 1. Connectivity from start to goal is guaranteed.

## Algorithms
Both are best-first searches over a binary min-heap. Dijkstra orders
the queue by $g(n)$ (path cost so far); A* by $f(n)=g(n)+h(n)$ with
$h$ the Manhattan distance to the goal (admissible because the minimum
edge cost is 1). They share the same relaxation, so both return the
optimum; A* simply settles fewer nodes.

## Numerical method
Discrete graph search; no floating-point integration. The reveal
animation replays the recorded settle order.

## Controls
- `speed`: cells revealed per frame.
- `map seed`: regenerates the city.
- `A* heuristic weight` (1..3): 1 = admissible (optimal, same path as
  Dijkstra); >1 = weighted/greedy A* (scans fewer cells but the
  returned path can be suboptimal). The speed-versus-optimality knob.
- Restart search; Pause / Play.

## Expected qualitative features
1. Dijkstra's settled region is a roughly circular flood.
2. A*'s settled region is a narrow beam toward the goal.
3. Both highlight the same shortest path; it flashes on arrival.
4. The A* cell count is well below Dijkstra's on every seed.

## Invariants and acceptance thresholds
| invariant | threshold | location |
| A* cost = Dijkstra cost | equal (1e-9) across seeds | invariants test |
| A* expands <= Dijkstra | and strictly fewer somewhere | invariants test |
| path is a valid grid path | adjacent, wall-free, cost-consistent | invariants test |
| buildCity seed-deterministic | identical grid | invariants test |
| connectivity guaranteed | finite cost for 25 seeds | invariants test |
| visual SSIM | > 0.92 on five deterministic frames | visual test |

All confirmed in `invariants.test.mjs` (5 tests passing).

## Limiting cases for verification
- $h \equiv 0$: A* reduces exactly to Dijkstra (same expansion).
- Admissible $h$: optimality preserved (asserted vs Dijkstra).
- Disconnected goal: connectivity repair clears a corridor so a path
  always exists.

## Visual fallback
The caption states the flood-vs-beam contrast and the equal-optimum
result so the figure reads without Canvas2D.

## Citations
- Cormen, Leiserson, Rivest, Stein, *Introduction to Algorithms*, 3e,
  ch. 24 (`cormen2009`); Hart, Nilsson, Raphael (1968), A*.

## Stretch goals
- Weighted/inadmissible heuristic slider to show A* losing optimality.
- 8-connectivity with diagonal moves.

## Risk register
- The "city" is procedural, not a real Rome street map (no external
  assets under the stack constraint); the irregular blocks plus the
  river evoke the layout without claiming geographic fidelity.
