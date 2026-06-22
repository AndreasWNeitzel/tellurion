---
title: The Galton Board and the Central Limit Theorem
slug: galton-board-central-limit
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS2018
curriculum_year: bsc-y2s2
primary_citation: press2007
primary_chapter: 7
hook: "Drop thousands of balls through a peg array and a bell curve no single ball intended emerges. The central limit theorem, built one coin flip at a time."
one_paragraph: "Each ball through a Galton board makes R independent left/right choices, so its landing bin (the number of rights) is binomial, P(k) = C(R,k) p^k (1-p)^(R-k), and for large R the binomial tends to a Gaussian of mean Rp and variance Rp(1-p), the central limit theorem. The playground drops balls live into bins forming the binomial histogram, and the diagnostic normalizes the histogram against the exact binomial and its Gaussian limit, tracking the total-variation distance as it shrinks toward zero with more balls."
tags: [computational-physics, probability, central-limit-theorem, binomial, monte-carlo, statistics, interactive, animation, live-readout]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [R, p]
invariants:
  - key: norm
    label: the binomial mass sums to 1 with mean Rp and variance Rp(1-p)
    tolerance: 1e-9
  - key: symmetry
    label: the binomial is symmetric at p = 1/2
    tolerance: 1e-12
  - key: converge
    label: the empirical histogram converges to the binomial as balls accumulate
    tolerance: 0.03
what_to_try:
  - Let it run; the histogram fills the binomial shape and the distance falls toward zero.
  - Add rows R; the bell hugs the Gaussian limit ever more closely.
  - Bias the pegs (p not 1/2); the distribution shifts to mean Rp.
  - Compare the binomial points and the Gaussian curve; nearly identical for large R.
references:
  - "Press, Teukolsky, Vetterling, Flannery, Numerical Recipes, 3rd ed., Cambridge, 2007, Ch. 7."
  - "Galton, Natural Inheritance, Macmillan, 1889 (the quincunx)."
---

# The Galton board and the central limit theorem

## Physical setup

A quincunx (Galton board): R rows of pegs through which balls fall, each ball deflecting
right with probability p and left with probability 1-p at every row.

## Equations

The landing bin k (number of rights) is binomial,

$$ P(k) = \binom{R}{k}p^k(1-p)^{R-k}, \quad \mu = Rp, \quad \sigma^2 = Rp(1-p), $$

and for large R it approaches the Gaussian $\frac{1}{\sqrt{2\pi\sigma^2}}e^{-(k-\mu)^2/2\sigma^2}$.

## Numerical method

Each ball makes R seeded Bernoulli(p) choices; counts accumulate into the histogram. The
binomial and Gaussian are evaluated in closed form, and the total-variation distance
measures the histogram's approach to the binomial.

## Controls

- Number of rows R; right-probability p; play / pause.

## Expected qualitative features

1. The histogram fills the binomial shape as balls accumulate.
2. The distance to the binomial shrinks toward zero (law of large numbers).
3. Larger R sharpens the Gaussian agreement (central limit theorem).
4. Biasing p shifts the mean to Rp.

## Invariants and acceptance thresholds

- Binomial mass sums to 1, mean Rp, variance Rp(1-p).
- Symmetric at p = 1/2.
- The empirical histogram converges to the binomial (total variation below 0.03 after many drops).

## Citations

Press et al., Numerical Recipes, 3rd ed., Ch. 7.
Galton, Natural Inheritance, 1889.
