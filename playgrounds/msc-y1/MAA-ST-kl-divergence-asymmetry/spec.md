---
title: KL Divergence Asymmetry (Mass-Covering vs Mode-Seeking)
slug: kl-divergence-asymmetry
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-ST
supporting_ucs: [MAA-DM]
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

# KL divergence asymmetry: mass-covering vs mode-seeking

## Physical setup

Two probability densities on a 1D axis. Target P is a bimodal mixture of two Gaussians at +/- sep; approximation Q is a single Gaussian with controllable (mu_q, sigma_q). The playground computes the two directions of KL divergence and shows how their argmins differ qualitatively.

## Governing equations

  D(P || Q) = integral p(x) log(p(x) / q(x)) dx     [forward, mass-covering]
  D(Q || P) = integral q(x) log(q(x) / p(x)) dx     [reverse, mode-seeking]

Mass-covering: minimizing D(P||Q) over Q forces Q to put nonzero mass wherever P does, because q -> 0 where p > 0 makes the integrand diverge to +infinity.

Mode-seeking: minimizing D(Q||P) over Q has the opposite character: q can be zero where p > 0 (those regions contribute 0 * log(0/p) = 0). The only penalty is q > 0 where p = 0. So Q concentrates inside ONE mode of P.

## Numerical method

Trapezoidal integration on a 600-point uniform grid covering [-8, +8]. Closed-form Gaussian and mixture pdfs. The argmin search is a 81 x 10 grid scan over (mu_q, sigma_q).

## Controls

- Q mu: mean of the single-Gaussian Q, slider -5 to 5, default 0
- Q sigma: std of Q, slider 0.3 to 4.0, default 2.5
- mode sep: separation +/- mu of the two P modes, slider 1.0 to 4.0, default 2.0
- Snap Q to argmin D(P||Q): jump Q to the forward-KL minimizer
- Snap Q to argmin D(Q||P): jump Q to the reverse-KL minimizer

## Expected qualitative features

1. D(P||Q) -> large when Q misses one mode of P (q -> 0 where p > 0).
2. D(Q||P) -> small when Q sits on one mode, even if the other mode of P is ignored.
3. At sep = 2.0: forward argmin has mu_q near 0 (covers both modes); reverse argmin has |mu_q| near sep (sits on one mode).

## Invariants and acceptance thresholds

- D(P || P) = 0 (Gibbs).
- D(P || Q) >= 0 for all tested Q.
- Closed form D(N(0,1) || N(1,1)) = 0.5 matched to 4 digits.
- Asymmetry: |D(P||Q) - D(Q||P)| > 0.1 for sep = 2.5, Q = N(0, 1).
- forward-KL argmin sigma > reverse-KL argmin sigma (mass-covering vs mode-seeking).
- reverse-KL argmin |mu| in [1.5, 2.5] at sep = 2.0.
- forward-KL argmin |mu| < 0.5 at sep = 2.0.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- sep -> 0: P collapses to a single Gaussian; both KL minimizers coincide.
- sep -> large: forward-KL argmin sigma grows (Q must span both peaks); reverse-KL argmin sigma stays small (sits on one peak only).

## Visual fallback

Canvas2D only.

## Citations

- MacKay 2003, Information Theory, Inference, and Learning Algorithms, Chapter 2 and Section 33.7 (`mackay2003`).
- Bishop 2006, Pattern Recognition and Machine Learning, Section 10.1 (`bishop2006`).
- Murphy 2022, Probabilistic Machine Learning Vol. 1, Section 6.3.5.

## Stretch goals

- Add gradient-descent ascent of mu, sigma toward each argmin with an animated path.
- Add a "Renyi alpha-divergence" interpolation between the two extremes.
- Sweep the alpha-family from forward (alpha = 1) to reverse (alpha = 0).

## Risk register

- The argmin grid is 81 x 10 = 810 evaluations of KL with 600 grid points each: ~ 5e5 ops per refresh. Cached per sep change; not per Q slider tick.
- Numerical KL with eps = 1e-30 avoids log(0) at the cost of biased finite values when q << p. The bias is invisible at the displayed precision.
