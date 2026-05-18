---
title: "Root Finding: Bisection, Newton, Secant"
slug: root-finding-bisect-newton-secant
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2018
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: villate-vpython
primary_chapter: 4
hook: 'Three ways to hunt a root: bisection never fails but crawls, Newton races when it has the derivative, the secant splits the difference.'
one_paragraph: 'Root-finding trades robustness against speed. Bisection only needs a sign change and halves the bracket every step, guaranteed but linear. Newton-Raphson uses the derivative and converges quadratically near a root, but can diverge from a bad start. The secant method replaces the derivative with a finite difference, converging superlinearly without needing f-prime. The playground runs all three on a selectable function and plots the error per iteration, so the convergence orders and the failure modes (Newton overshooting, bisection''s slow crawl) sit side by side. Reference: Villate, Numerical Methods (VPython), Ch. 4.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Root-finding shootout
Bisection, Newton-Raphson, and the secant method on a selectable test function. Source: Villate VPython Numerical Methods Ch. 4 (`villate-vpython`).
