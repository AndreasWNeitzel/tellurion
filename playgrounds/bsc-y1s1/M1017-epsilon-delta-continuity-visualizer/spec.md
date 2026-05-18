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
---
# Epsilon-delta continuity visualizer
Slider for $x_0$ and $\epsilon$. The accent-yellow box shows the maximum $\delta_{\max}(\epsilon)$ such that $|x - x_0| < \delta$ implies $|f(x) - f(x_0)| < \epsilon$ for $f = \sin$. Demonstrates continuity at every point. Source: Arfken-Weber Ch. 1 (`arfken-weber`).
