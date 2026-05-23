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
invariants:
  - key: quad_bound
    label: O(N^2) comparisons <= 1/2 N(N-1)
    tolerance: 1e-9
  - key: merge_bound
    label: merge comparisons <= N ceil(log2 N)
    tolerance: 1e-9
  - key: merge_faster
    label: merge count <= O(N^2) count
    tolerance: 1e-9
what_to_try:
  - Press Sweep N to fill the complexity plot across many array sizes at once.
  - Switch the O(N^2) algorithm between bubble and insertion sort.
  - Raise N and watch the gap between the quadratic and N log N curves widen.
references:
  - "Cormen, Leiserson, Rivest, Stein, Introduction to Algorithms, 3rd ed., Ch. 2."
  - "Sedgewick and Wayne, Algorithms, 4th ed., Ch. 2."
---
# Big-O empirical scaling

## Explainer

### What you are looking at

"This algorithm is $O(N\log N)$" is an abstract claim, but you can
actually see it. The playground races a slow sort against a fast one
on the same data and plots how their work grows with the input size,
so the difference between $O(N^2)$ and $O(N\log N)$ becomes a visible
gap, not a definition to memorize.

### What Big-O means

Big-O describes how an algorithm's cost scales with input size $N$,
ignoring constants and lower-order terms. For sorting, the natural
cost is the number of comparisons:

- A simple comparison sort (bubble/insertion) does on the order of
  $T(N) = c\,N^2$ operations: every element is compared against many
  others.
- Merge sort divides the list in half $\log_2 N$ times and does
  $O(N)$ work per level, giving $T(N) = c\,N\log_2 N$.

The point of Big-O is that the constant $c$ does not matter for large
$N$: the function's shape wins. A faster computer rescales $c$ but
never turns an $N^2$ curve into an $N\log N$ one.

### Reading the scaling empirically

The playground sorts the same seeded shuffle both ways, counting the
real compare/swap/write operations, and accumulates one measured
point $(N, \text{ops})$ per run. On the log-log scaling panel a power
law $T\propto N^p$ is a straight line of slope $p$, so the quadratic
sort plots with slope $\approx 2$ and merge sort with slope
$\approx 1$ (the $\log N$ factor is a gentle upward bend, not a slope
change). Doubling $N$ roughly quadruples the $O(N^2)$ work but only
slightly more than doubles the $O(N\log N)$ work, which is exactly
why algorithmic complexity, not clock speed, decides what is feasible
at scale. Because both sorts replay from a recorded event stream, the
animation speed is identical and only the operation counts differ,
isolating the complexity.

### Things to try

- Increase $N$ and watch the gap between the two operation counts
  widen dramatically (quadratic vs linearithmic).
- Read the log-log slopes: about 2 for the simple sort, about 1 for
  merge sort.
- Note that speeding up replay does not change the curves: Big-O is
  about growth, not constants.

### Where this comes from

Asymptotic complexity and the analysis of sorting follow Cormen,
Leiserson, Rivest and Stein, *Introduction to Algorithms*,
Chapters 2 to 4.

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

Source: Newman, Computational Physics Ch. 4; Cormen,
Leiserson, Rivest, Stein, Introduction to Algorithms, 3rd ed., Ch. 2.
