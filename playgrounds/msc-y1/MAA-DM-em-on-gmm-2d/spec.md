---
title: EM on a 2D Gaussian Mixture
slug: em-on-gmm-2d
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-DM
supporting_ucs: []
curriculum_year: msc-y1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# EM on a 2D Gaussian mixture

## Physical setup

A 2D scatter of N = 600 points drawn from a 3-component Gaussian mixture with known means, covariances, and mixing weights. The EM algorithm tries to recover those parameters using only the data, alternating soft cluster assignment (E-step) and parameter refit (M-step).

## Governing equations

Latent z_n in {1, ..., K}; observed x_n in R^2.

Joint: p(x_n, z_n | theta) = pi_{z_n} N(x_n; mu_{z_n}, Sigma_{z_n}).
Log-likelihood: L(theta) = sum_n log sum_k pi_k N(x_n; mu_k, Sigma_k).

E-step: gamma_{nk} = pi_k N(x_n; mu_k, Sigma_k) / sum_j pi_j N(x_n; mu_j, Sigma_j).
M-step:
  N_k = sum_n gamma_{nk}
  mu_k = (1 / N_k) sum_n gamma_{nk} x_n
  Sigma_k = (1 / N_k) sum_n gamma_{nk} (x_n - mu_k) (x_n - mu_k)^T
  pi_k = N_k / N.

L(theta_{t+1}) >= L(theta_t) (Dempster, Laird, Rubin 1977).

## Numerical method

Closed-form M-step; soft-assignment E-step. Tiny regularization 1e-6 added to Sigma_k diagonal to prevent singular covariance under low responsibility.

Ellipse rendering: 2-sigma confidence region by 2x2 covariance eigen-decomposition.

## Controls

- K: number of components (2 to 5)
- init seed: PRNG seed for K-means-style init (0 to 20)
- Step: one EM iteration
- Run 20 iters: batch step
- Reset: re-init at current K, seed

## Expected qualitative features

1. Step 0: random init has the ellipses scattered far from the true clusters.
2. By iter 10: ellipses lock onto modes; colors stabilize.
3. By iter 30: estimated means match true means within ~ 0.3 (with N = 600).
4. Log-likelihood trace is monotone non-decreasing.

## Invariants and acceptance thresholds

- Log-likelihood non-decreasing for 30 iters.
- Sum of responsibilities across k = 1 for every n.
- After 60 iters, each true mean has an estimated mean within 0.6.
- Mixing weights sum to 1 to 1e-8.
- det Sigma_k > 0 for all iterations.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- K = 1: EM degenerates to fitting a single Gaussian; mu = mean of data, Sigma = sample covariance.
- Singular covariance: regularization prevents divergence even if a cluster collapses onto one point.
- Bad init: an unlucky init seed can have EM converge to a local optimum with the wrong number of effective clusters (known limitation, not a bug).

## Visual fallback

Canvas2D only.

## Citations

- Bishop 2006, PRML, Section 9.2 (`bishop2006`).
- Murphy 2022, Probabilistic Machine Learning Vol. 1, Section 17.2 (`murphy2022pml`).
- Dempster, Laird, Rubin 1977, "Maximum Likelihood from Incomplete Data via the EM Algorithm", J. Royal Stat. Soc. B 39, 1.

## Stretch goals

- Add a BIC / AIC penalty trace so the user can see the optimal K from data.
- Add cluster-merge animation for K > number of true clusters.

## Risk register

- K-means-style init is poor for highly overlapping clusters; the user can re-roll with the seed slider.
- N = 600 keeps the per-iteration cost low (~ 5 ms / iter); larger N would still be fast.
