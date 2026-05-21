---
title: Epsilon-Delta Continuity Visualizer
slug: epsilon-delta-continuity-visualizer
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M1017
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: arfken-weber
primary_chapter: 1
hook: "Continuity has a precise meaning: for any vertical tolerance epsilon you demand on the output, a horizontal tolerance delta on the input keeps the function inside it. Shrink epsilon and watch the required delta shrink with it."
one_paragraph: "A function is continuous at a point c if, for every epsilon > 0, there is a delta > 0 such that every x within delta of c lands within epsilon of f(c). The playground draws the curve with a box: an epsilon band of height 2 epsilon around f(c) and a delta band of width 2 delta around c, and it solves for the largest delta that keeps the curve inside the epsilon band over that interval. Increase epsilon and the box grows and a larger delta works; shrink epsilon toward zero and the admissible delta shrinks too, but for a continuous function it always exists. The readout prints epsilon and the maximal delta. This makes the abstract definition concrete: continuity is a game you always win, the challenger picks epsilon, you answer with delta."
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
# Epsilon-delta continuity visualizer
Slider for $x_0$ and $\epsilon$. The accent-yellow box shows the maximum $\delta_{\max}(\epsilon)$ such that $|x - x_0| < \delta$ implies $|f(x) - f(x_0)| < \epsilon$ for $f = \sin$. Demonstrates continuity at every point. Source: Arfken-Weber Ch. 1 (`arfken-weber`).

## Explainer

### What you are looking at

The epsilon-delta definition of continuity is famously the first
"real" proof students meet, and it is much clearer as a picture: you
name a tolerance on the output, and the definition challenges you to
find a tolerance on the input that guarantees it. The playground is
that challenge, made interactive: pick a target band and watch the
input window that fits inside it.

### The definition as a game

A function $f$ is continuous at $x_0$ if

$$\forall\,\epsilon>0\ \ \exists\,\delta>0:\quad
  |x - x_0| < \delta \;\Longrightarrow\;
  |f(x) - f(x_0)| < \epsilon.$$

Read it as a two-move game. Your adversary picks an output tolerance
$\epsilon$ (a horizontal band of half-height $\epsilon$ around
$f(x_0)$). You must respond with an input tolerance $\delta$ (a
vertical strip of half-width $\delta$ around $x_0$) so that the entire
graph over that strip stays inside the band. If you can always answer,
no matter how small $\epsilon$, the function is continuous there.

### Reading the visual

The yellow box is the largest such $\delta$. The key intuitions it
makes visible:

- Shrink $\epsilon$ and the required $\delta$ shrinks too: continuity
  is a statement about a limit, not a single point.
- Where the graph is steep (large $|f'|$) you need a narrow $\delta$;
  where it is flat you can afford a wide one. Quantitatively
  $\delta\approx\epsilon/|f'(x_0)|$ for a smooth function, so the
  slope controls the trade-off.
- If $f$ had a jump, then for a small enough $\epsilon$ no $\delta$
  works (the box collapses): that is exactly what discontinuity
  means, and uniform continuity is the stronger statement that one
  $\delta$ works for all $x_0$ at once.

The playground uses $f=\sin$ (continuous everywhere) and lets you
move $x_0$ and $\epsilon$ to feel how $\delta_{\max}$ tracks the local
slope.

### Things to try

- Shrink $\epsilon$ and watch the $\delta$ box shrink in step (the
  limit is being taken).
- Move $x_0$ to a steep part of $\sin$ (near a zero crossing) and to
  a flat part (near a peak); compare how wide $\delta$ can be.
- Note that a $\delta$ can always be found here, the signature of
  continuity at every point.

### Where this comes from

The epsilon-delta definition of continuity and limits follows Rudin,
*Principles of Mathematical Analysis*, Chapter 4, and Spivak,
*Calculus*, Chapter 6.
