---
title: Least-Squares Orbit Fit (Gauss Heritage)
slug: least-squares-orbit-fit-gauss
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST3015
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: bmw
primary_chapter: 5
hook: 'Fit a circle to noisy orbit points and you get a clean answer that is quietly wrong: any real eccentricity biases the radius and centre.'
one_paragraph: 'Gauss made his name recovering the lost asteroid Ceres from a short, noisy arc by least squares. The playground shows the simplest version: scatter noisy positions along a true Kepler ellipse and fit a circle by linear least squares. The fit is well posed and converges, but when the orbit''s eccentricity is nonzero the circular model is wrong, so the recovered centre and radius are systematically biased. It is a concrete lesson that a tight fit to the wrong model is still wrong. Reference: Bate, Mueller and White, Fundamentals of Astrodynamics, Ch. 5.'
tags: [exoplanets, numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Toy least-squares orbit fit
Noisy positions along a Kepler orbit; fit a circle by least squares. The fit is biased when $e > 0$. Source: Bate-Mueller-White Ch. 5 (`bmw`).
