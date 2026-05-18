---
title: Fourier vs Laplace Transform Pairs
slug: fourier-vs-laplace-transform-pair
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: M3012
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: arfken-weber
primary_chapter: 15
hook: 'Fourier asks which frequencies a signal contains; Laplace adds growth and decay, so a signal''s poles in the s-plane say whether it blows up or dies out.'
one_paragraph: 'The Fourier transform decomposes a signal into pure oscillations; the Laplace transform generalizes this with a complex frequency s = sigma + i omega that also captures exponential growth and decay, which is why it solves initial-value ODEs. The playground shows a time-domain signal next to its Fourier power spectrum and its Laplace transform as a pole map, so you see directly how a pole in the left half-plane means decay and one in the right half-plane means instability. It is the link between signal analysis and control theory. Reference: Arfken and Weber, Mathematical Methods for Physicists, Ch. 15.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Fourier vs Laplace transforms
Side-by-side time-domain, $|F(\omega)|^2$ and $F(s)$ with pole map. Source: Arfken-Weber Ch. 15 (`arfken-weber`).
