# Quadtree Collision Detection

Equal hard disks bounce inside a unit box and collide elastically. The
blue squares are a quadtree: the box is recursively split into four until
each cell holds at most a handful of disks, so the partition stays coarse
in the empty gaps and subdivides finely wherever the disks crowd
together. It is rebuilt every frame and follows the crowd.

To detect collisions, each disk only tests the few others in its own and
neighbouring cells, found by querying the tree with a small box around it.
That is O(N log N). The "all pairs" method instead checks every pair,
N(N-1)/2 of them, which is O(N^2). Switch the method select between them
and read the pair-checks per step in the lower plot: the all-pairs curve
is a parabola, the quadtree curve barely lifts off the axis. At N = 500
the quadtree already does on the order of a hundred times fewer checks,
and the gap widens with N. (The grid is hidden in all-pairs mode, since
no partition is used.)

The metric is the number of candidate pair-checks, not wall-clock time,
so the speedup is exact and reproducible rather than hostage to the
browser's tight-loop optimisations.

## Reference

- Barnes and Hut, Nature 324 (1986) 446 (`barnes-hut1986`)
- Samet, The Design and Analysis of Spatial Data Structures (`samet1990`)

## Verification

- Strong invariants: elastic collisions and walls conserve kinetic energy
  (drift < 1e-6 over 600 steps); the quadtree detects exactly the same
  colliding pairs as the all-pairs check; the quadtree's check count is
  under a fifth of N(N-1)/2 at N = 1200; the leaf cells tile the unit box.
- Disks never leave the box.
