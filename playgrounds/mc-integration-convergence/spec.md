---
title: Monte Carlo Integration Convergence
slug: mc-integration-convergence
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2018
supporting_ucs: [MAA-NM, MAA-ST]
curriculum_year: bsc-y2s2
---

# Monte Carlo integration and 1/sqrt(N) convergence

## Physical setup

Estimate integral_{0}^{1} f(x) dx with f(x) = 1 + 10 (x - 1/2)^4. Exact
value: 1.125. Two estimators:
- Plain: I_hat = (1/N) sum f(U_i), U_i ~ U(0, 1).
- Importance: I_hat = (1/N) sum f(X_i) / q(X_i), X_i ~ Beta(2, 2).

Both unbiased; standard error decays as sigma / sqrt(N).

## Numerical method

Seedable Mersenne Twister via shared rng module. Beta(2, 2) via simple
rejection. Closed-form Beta(2, 2) pdf 6 x (1 - x).

## Controls

- log2(N): sample count, 4 to 18 (16 to 262144 samples).
- speed: auto-sweep over log2(N).
- Reset / Pause / Play.

## Expected qualitative features

1. Plain estimator: error ~ 1 / sqrt(N), bouncing around the trend line.
2. Importance with Beta(2, 2): worse than plain for this function (proposal
   misses endpoints where f is largest).
3. The 1 / sqrt(N) reference line shows the canonical MC scaling.

## Invariants and acceptance thresholds

1. Plain MC: |I_hat - EXACT| < 0.05 at N = 1e5.
2. SE shrinks as 1/sqrt(N): ratio at N=1000 to N=10000 in [2, 5].
3. Both methods give finite estimates within 0.1 / 0.15 of EXACT at N = 1e4.
4. Convergence array shape matches log2 spec.
5. Test-function exact integral 1.125.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- IS with optimal q (proportional to |f|): zero variance.
- IS with q far from |f|: increased variance.

## Visual fallback

Canvas2D only. Top: f(x) curve with EXACT level. Bottom: log-error vs
log-N for plain (cyan), IS (orange), and 1/sqrt(N) reference (dashed).

## Citations

- MacKay, Information Theory, Inference, and Learning Algorithms Ch. 29.
- Press et al., Numerical Recipes 3e Ch. 7.

## Stretch goals

- Stratified sampling.
- Quasi-random (Sobol) sequence overlay.
- Multi-dimensional MC.

## Risk register

- Beta(2, 2) rejection sampling is wasteful (factor 1.5); fine for the
  small N we sample.
