---
title: EM on a 2D Gaussian Mixture
slug: em-on-gmm-2d
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-DM
supporting_ucs: []
curriculum_year: msc-y1
hook: 'A cloud of points secretly blends a few overlapping Gaussian bumps; watch Expectation-Maximization recover their shapes and weights by alternating soft guesses and refits until the ellipses snap onto the data.'
one_paragraph: 'The data is modeled as a Gaussian mixture: each point is drawn from one of K Gaussians with mixing weight pi_k, but the assignment of points to components is hidden, so the likelihood cannot be maximized directly. Expectation-Maximization alternates an E-step (given the current parameters, compute each point''s soft responsibility gamma_ik for every component) and an M-step (refit each component as a responsibility-weighted mean and covariance), a loop that provably increases the data log-likelihood every iteration and converges to a local optimum. The playground animates the component ellipses translating and reshaping onto the blobs while the log-likelihood climbs monotonically in the live readout. Reference: Dempster, Laird and Rubin 1977; Bishop, Pattern Recognition and Machine Learning, Chapter 9.'
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

# EM on a 2D Gaussian mixture

## Explainer

### What you are looking at

You are given a cloud of points that is secretly a blend of a few
overlapping Gaussian blobs, but you are told neither which point came
from which blob nor the blobs' shapes. Expectation-Maximization
recovers both by a chicken-and-egg loop: guess the blobs, softly
assign points, refit the blobs, repeat. The playground animates the
ellipses snapping onto the data.

### The model

The data is modeled as a Gaussian mixture: each point comes from one
of $K$ Gaussians chosen with probability $\pi_k$,

$$p(\mathbf x) = \sum_{k=1}^{K}\pi_k\,
  \mathcal N\!\big(\mathbf x \mid \boldsymbol\mu_k,\Sigma_k\big).$$

We want the parameters $\{\pi_k,\boldsymbol\mu_k,\Sigma_k\}$ that
maximize the data likelihood, but the hidden assignment of points to
components makes the direct maximization intractable.

### The EM loop

EM iterates two steps that each strictly increase the likelihood:

E-step (soft assignment): given current parameters, compute the
responsibility of component $k$ for point $i$,

$$\gamma_{ik}
  = \frac{\pi_k\,\mathcal N(\mathbf x_i\mid
  \boldsymbol\mu_k,\Sigma_k)}
  {\sum_{j}\pi_j\,\mathcal N(\mathbf x_i\mid
  \boldsymbol\mu_j,\Sigma_j)}.$$

M-step (refit): re-estimate each component as a responsibility-
weighted fit, with $N_k=\sum_i\gamma_{ik}$,

$$\boldsymbol\mu_k = \frac{1}{N_k}\sum_i\gamma_{ik}\mathbf x_i,
  \quad
  \Sigma_k = \frac{1}{N_k}\sum_i\gamma_{ik}
  (\mathbf x_i-\boldsymbol\mu_k)(\mathbf x_i-\boldsymbol\mu_k)^\top,
  \quad
  \pi_k = \frac{N_k}{N}.$$

The log-likelihood is guaranteed to increase (or stay equal) every
iteration, so the ellipses converge, but only to a local optimum,
which is why the result depends on the initialization (a key
practical caveat, and why k-means++ style seeding matters). The
playground shows the soft responsibilities as point coloring and the
covariance ellipses tightening onto the true blobs.

### Things to try

- Watch the ellipses start as round guesses and converge to the true
  tilted, scaled blobs as the log-likelihood climbs monotonically.
- Re-initialize from a bad guess and watch EM get stuck in a poor
  local optimum (label-swapped or merged components).
- Note the soft (not hard) assignment: points between two blobs are
  colored a blend, unlike k-means.

### Where this comes from

The EM algorithm for Gaussian mixtures and its monotone-likelihood
guarantee follow Dempster, Laird and Rubin (1977) and Bishop,
*Pattern Recognition and Machine Learning*, Chapter 9.

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

- Bishop 2006, PRML, Section 9.2.
- Murphy 2022, Probabilistic Machine Learning Vol. 1, Section 17.2.
- Dempster, Laird, Rubin 1977, "Maximum Likelihood from Incomplete Data via the EM Algorithm", J. Royal Stat. Soc. B 39, 1.

## Stretch goals

- Add a BIC / AIC penalty trace so the user can see the optimal K from data.
- Add cluster-merge animation for K > number of true clusters.

## Risk register

- K-means-style init is poor for highly overlapping clusters; the user can re-roll with the seed slider.
- N = 600 keeps the per-iteration cost low (~ 5 ms / iter); larger N would still be fast.
