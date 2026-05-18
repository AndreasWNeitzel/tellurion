---
title: Multiple Integral Fubini
slug: multiple-integral-fubini
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: M1015
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: riley-hobson
primary_chapter: 10
hook: 'Add up a function over a rectangle column by column, or row by row; Fubini''s theorem promises the same total, and here both orders are computed side by side.'
one_paragraph: 'A double integral over a rectangle can be done as an iterated integral in either order: integrate over x first then y, or y first then x. Fubini''s theorem guarantees the two agree when the integrand is well behaved. The playground evaluates both orders numerically for f(x, y) = sin x cos y over an adjustable rectangle and shows the running partial sums converging to the same value. Watching the two accumulations fill the region in different directions yet meet at the same answer makes the theorem concrete instead of a line taken on faith. Reference: Riley and Hobson, Mathematical Methods, Ch. 10.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Fubini's theorem in 2D
Iterated integrals over a rectangle in two orders match numerically. Demonstrated on $f(x, y) = \sin x \cos y$. Source: Riley-Hobson Ch. 10 (`riley-hobson`).
