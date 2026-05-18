---
title: Cauchy Sequence Convergence Monitor
slug: cauchy-sequence-convergence-monitor
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M1017
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: arfken-weber
primary_chapter: 1
hook: "A sequence converges if its tail eventually fits inside any band you choose, however thin. Pick an epsilon, watch the band shrink, and see how far out you must go before every later term is trapped inside it."
one_paragraph: "A sequence is Cauchy if, for every tolerance epsilon, there is an index N beyond which all terms lie within epsilon of each other; for real numbers this is exactly convergence. The playground plots a sequence on a number line with an epsilon tube around its limit and reports the smallest N(epsilon) for which the entire tail stays inside. Convergent examples (a geometric sequence, the Leibniz partial sums for arctan) show the tube tightening and the tail captured; the harmonic sequence is shown as a counterexample whose tail no finite tube ever traps (it diverges). The readout gives the tail diameter, the current epsilon and N. The point is operational: convergence is not a vague approach but a precise promise. Name your epsilon and the monitor names the N that delivers it."
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Cauchy sequence convergence monitor
Partial sums of four series; Cauchy width $w(N_0) = \max |a_n - a_m|$ for $n, m \ge N_0$. Geometric, $\zeta(2)$, and Leibniz arctan converge; harmonic does not. Source: Arfken-Weber Ch. 1 (`arfken-weber`).
