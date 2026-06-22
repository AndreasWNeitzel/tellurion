---
title: The IVT and Bisection
slug: intermediate-value-bisection
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M1017
curriculum_year: bsc-y1s1
primary_citation: rudin-pma
primary_chapter: 4
hook: "A continuous function negative at one end and positive at the other must cross zero. Bisection turns that promise into an algorithm: halve, test, repeat."
one_paragraph: "The intermediate value theorem guarantees a root of a continuous f on [a, b] whenever f(a) and f(b) have opposite signs, and its proof is constructive: test the midpoint, keep the half that still shows the sign change (which by the same theorem contains a root), and repeat. The bracket halves each step, w_k = (b0 - a0)/2^k, so the root is pinned to any tolerance in a logarithmic number of steps. The playground animates the bracket closing onto the root with the tested midpoint highlighted, and plots the bracket width and |f(midpoint)| against step on a log axis, where geometric halving is a straight line; the endpoints are draggable as long as they keep opposite signs."
tags: [real-analysis, root-finding, bisection, convergence, animation, interactive]
difficulty: 1
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [fn]
invariants:
  - key: sign
    label: every bracket retains the sign change (f(a) f(b) <= 0)
    tolerance: 1e-12
  - key: halve
    label: the bracket width halves exactly each step
    tolerance: 1e-12
  - key: converge
    label: the iterate converges to the root within half the bracket width
    tolerance: 1e-9
what_to_try:
  - Watch the bracket halve step by step, the midpoint tested and discarded as the band closes onto the root.
  - Read the log plot: the width falls along a straight line, one bit of accuracy per step.
  - Drag the endpoints to bracket the root yourself, keeping f(a) and f(b) opposite in sign.
references:
  - "Rudin, Principles of Mathematical Analysis, 3rd ed., Thm. 4.23 (the intermediate value theorem)."
  - "Burden and Faires, Numerical Analysis, 9th ed., Sec. 2.1 (bisection)."
---

# The IVT and bisection

## Mathematical setup

A continuous function f is sampled on [a, b] with f(a) and f(b) of opposite sign,
so the intermediate value theorem guarantees a root inside.

## Equations

Bisection keeps the half that retains the sign change. The bracket width after k
steps is

$$ w_k = \frac{b_0 - a_0}{2^k}, $$

so the midpoint approximates the root with error at most $w_k/2$, converging
geometrically.

## Numerical method

Repeated midpoint evaluation and sign test. No fabricated values; every f is the
real function. The animation steps once every fixed interval and holds at
convergence before restarting.

## Controls

- Function (cubic, cos x - x, x^2 - 2, sin(3x) - 0.4x); drag the endpoints a, b;
  Reset.

## Expected qualitative features

1. The bracket halves onto the root, the tested midpoint discarded each step.
2. The bracket width and |f(midpoint)| fall geometrically (straight on a log axis).
3. Removing the sign change (both endpoints one side of the root) breaks the
   guarantee.

## Invariants and acceptance thresholds

- Every bracket keeps $f(a)f(b) \le 0$.
- The width halves exactly each step.
- The iterate is within $w_k/2$ of the root.

## Citations

Rudin, Principles of Mathematical Analysis, 3rd ed., Thm. 4.23. Burden and Faires,
Numerical Analysis, 9th ed., Sec. 2.1.
