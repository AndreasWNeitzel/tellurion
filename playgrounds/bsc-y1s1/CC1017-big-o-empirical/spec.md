---
title: Big-O Empirical Scaling
slug: big-o-empirical
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: CC1017
supporting_ucs: [FIS2018]
curriculum_year: bsc-y1s1
primary_citation: newman2013
primary_chapter: 4
hook: 'Watch bubble sort and merge sort race the same shuffle; their comparison counts land exactly on the N^2 and N log N curves.'
one_paragraph: 'The same seeded shuffle is sorted by an O(N^2) comparison sort and by merge sort, O(N log N), side by side and replayed from a recorded comparison/write event stream so the speed is decoupled from the physics. Every comparison is counted live. Each finished race drops a measured point on a lower panel, on top of the theoretical 1/2 N(N-1) and N log2 N curves; the points sit on the curves, so the abstract complexity plot is the mechanism the viewer just watched. A Sweep control runs the full set of N at once to fill the curve.'
tags: [numerics, algorithms, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: []
---
# Big-O empirical scaling

## What it shows
The same seeded shuffle of $[1..N]$ is sorted twice at once: an
$O(N^2)$ comparison sort (bubble or insertion) on the left, merge sort
$O(N\log_2 N)$ on the right. Both are replayed from a recorded event
stream (compare / swap / write), so replay speed is independent of the
algorithm. The lower panel accumulates one measured point per finished
race on top of the theoretical $\tfrac{1}{2}N(N-1)$ and $N\log_2 N$
curves. Measured comparison counts fall on the predicted curves: the
asymptotic plot is the mechanism, not a separate abstraction.

## Method
`recordSort(kind, arr)` instruments textbook bubble, insertion, and
merge sort, emitting an event list and the exact comparison count.
`shuffledArray(n, seed)` is a Fisher-Yates shuffle on the project
seeded RNG (no `Math.random`), so every run and every deterministic
capture is reproducible. The theory references are the worst-case
comparison envelope $\tfrac{1}{2}N(N-1)$ for the quadratic sort and
$N\log_2 N$ for merge sort (Cormen et al. Ch. 2; merge upper bound
$N\lceil\log_2 N\rceil$).

## Controls
- `array size N` (8..128): size of the shuffle being raced.
- `speed` (1..40): comparisons advanced per animation frame.
- `O(N^2) sort`: bubble or insertion sort for the left panel.
- Pause / Play, Reset (reshuffle), Sweep N (run all N at once).

## Invariants (see invariants.test.mjs)
- `shuffledArray` is a permutation of $[1..n]$ and seed-reproducible.
- Every sort kind returns a correctly sorted permutation.
- Replaying the event stream reproduces the sorted array.
- Merge comparisons $\le N\lceil\log_2 N\rceil$; the quadratic sort
  exceeds $4\times$ the merge count at $N=256$.
- The $O(N^2)/O(N\log N)$ comparison ratio grows with $N$.

## Acceptance thresholds
- Visual SSIM > 0.92 on the five reference frames (deterministic).
- 9/9 invariant tests pass.

Source: Newman, Computational Physics Ch. 4 (`newman2013`); Cormen,
Leiserson, Rivest, Stein, Introduction to Algorithms, 3rd ed., Ch. 2
(`cormen2009`).
