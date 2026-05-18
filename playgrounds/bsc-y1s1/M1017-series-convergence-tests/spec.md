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
---
# Series convergence tests
Four series (geometric, p-series 2, harmonic, alternating Leibniz) with partial sums plotted and the limit as a dashed line where finite. Source: Arfken-Weber Ch. 1 (`arfken-weber`).
