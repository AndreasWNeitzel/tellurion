---
title: Series Convergence Tests
slug: series-convergence-tests
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M1017
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: arfken-weber
primary_chapter: 1
hook: "Add infinitely many shrinking terms and the running total either settles on a number or runs off to infinity. Watch the partial sums of four classic series while the ratio and root tests decide, live, which way each one goes."
one_paragraph: "A series converges if its partial sums approach a finite limit. The playground steps through canonical cases: a geometric series (converges fast), the p-series with p = 2 (converges to pi^2 / 6), the harmonic series (diverges, even though its terms tend to zero) and the alternating Leibniz series for ln 2 (converges slowly, oscillating). The large panel plots the partial sum S_N against N, flattening to a limit line or growing without bound; the upper panels show the individual terms and the ratio |a_{n+1}/a_n| and root |a_n|^{1/n}, whose limits below 1 certify convergence. The readout names the series, the current partial sum and the verdict. The harmonic case teaches the sharp lesson: terms shrinking to zero is necessary but not sufficient for a series to converge."
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---
# Series convergence tests
Four series (geometric, p-series 2, harmonic, alternating Leibniz) with partial sums plotted and the limit as a dashed line where finite. Source: Arfken-Weber Ch. 1 (`arfken-weber`).

## Explainer

### What you are looking at

Whether an infinite sum settles on a number or grows without bound is
decided by how fast its terms shrink. The playground plots the
running partial sums of four classic series so you can watch two
level off at a finite limit and one wander off to infinity even
though its terms go to zero.

### The partial sums and the convergence tests

A series $\sum a_n$ converges if its partial sums
$s_N=\sum_{n=1}^{N}a_n$ approach a limit. The four series each
illustrate a standard test:

- Geometric $\sum r^n = \dfrac{1}{1-r}$ for $|r|<1$ (ratio test):
  terms shrink geometrically, $s_N$ races to the limit.
- $p$-series $\sum 1/n^p$ converges iff $p>1$ (integral test). With
  $p=2$ it converges to $\zeta(2)=\pi^2/6$, but slowly (the tail
  falls only as $1/N$).
- Harmonic $\sum 1/n$ is the $p=1$ borderline: it diverges, $s_N\sim
  \ln N$, the canonical proof that $a_n\to 0$ does not imply
  convergence.
- Alternating Leibniz $\sum(-1)^{n+1}/(2n+1)\to\pi/4$ (alternating-
  series test): the partial sums oscillate around the limit with the
  error bounded by the first omitted term. This converges
  conditionally; its absolute version (the harmonic-like
  $\sum 1/(2n+1)$) diverges, the distinction between absolute and
  conditional convergence.

The dashed line marks the limit where finite, so you see geometric
snap onto it, $p=2$ creep up to it, Leibniz spiral into it, and
harmonic climb past any line you draw.

### Things to try

- Compare how fast each converging series reaches its dashed limit:
  geometric (fast), $p=2$ (slow), Leibniz (oscillating, medium).
- Watch the harmonic partial sum keep rising past every level (it
  diverges like $\ln N$).
- Note Leibniz converging while its terms are the same size as the
  divergent $\sum 1/(2n+1)$: alternation is what saves it.

### Where this comes from

The convergence tests (ratio, integral, alternating series) and
absolute vs conditional convergence follow Rudin, *Principles of
Mathematical Analysis*, Chapter 3, and Arfken and Weber,
*Mathematical Methods for Physicists*, Chapter 1.
