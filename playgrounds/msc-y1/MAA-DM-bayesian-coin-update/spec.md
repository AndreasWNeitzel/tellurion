---
title: Bayesian Coin Update
slug: bayesian-coin-update
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-DM
supporting_ucs: [MAA-ST]
curriculum_year: msc-y1
primary_citation: gelman-bda3
primary_chapter: 2
hook: 'Start believing a coin is fair, flip it a few times, and watch a belief curve slide and sharpen toward the truth. This is Bayes theorem with the algebra done in closed form.'
one_paragraph: 'A coin has an unknown bias theta (probability of heads). Belief about theta is a Beta(alpha, beta) density. The prior Beta(alpha_0, beta_0) is your state before data; observing k heads in n flips multiplies it by the binomial likelihood, and because the Beta family is conjugate to the binomial the posterior is again Beta, with parameters alpha_0 + k and beta_0 + (n - k). No integral is approximated for the update itself: counting heads and tails is the entire computation. The playground draws the prior, the normalized likelihood and the posterior on the same axes, shades the 95 percent equal-tailed credible interval, and prints the posterior mean and standard deviation. Sliders set the prior pseudo-counts alpha_0, beta_0 and the data k, n; a button flips five more times from a biased coin (true bias 0.7) so you watch the posterior tighten and walk toward 0.7 as evidence accumulates.'
tags: [numerics, statistical-physics, interactive-drag, live-readout]
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
references:
  - "Gelman et al., Bayesian Data Analysis, 3rd ed., Ch. 2."
---

# Bayesian Coin Update

## Explainer

### What you are looking at

A coin of unknown fairness. The horizontal axis is the bias
$\theta$, the probability it lands heads, running from a coin that
never gives heads ($\theta = 0$) to one that always does
($\theta = 1$). A fair coin sits at $\theta = 0.5$. You do not know
$\theta$; you only get to flip and count. The curves on screen are
not the coin, they are your *belief about* $\theta$: how plausible you
find each possible bias before and after seeing flips. The blue curve
is the prior (belief before data), the orange curve is what the data
alone say (the likelihood), and the green curve is the posterior
(belief after combining the two). Each flip slides and sharpens the
green curve. That sharpening, made exact, is the whole playground.

### Belief as a probability density

A single number cannot express "I think it is roughly fair but I am
not sure." A whole distribution over $\theta$ can. The natural choice
for a bias in $[0,1]$ is the Beta distribution,

$$p(\theta\mid\alpha,\beta)
   = \frac{\theta^{\alpha-1}(1-\theta)^{\beta-1}}{B(\alpha,\beta)},
   \qquad
   B(\alpha,\beta)=\frac{\Gamma(\alpha)\,\Gamma(\beta)}
                        {\Gamma(\alpha+\beta)} ,$$

where $B(\alpha,\beta)$ is the normalizing constant (the Beta
function, computed here from the log-gamma function so it stays
accurate even for large counts). Read $\alpha-1$ as a count of heads
already imagined and $\beta-1$ as imagined tails. $\mathrm{Beta}(1,1)$
is flat: every bias equally plausible, total ignorance.
$\mathrm{Beta}(2,2)$ is a gentle bump at $0.5$: a mild belief the coin
is fair. Large equal $\alpha,\beta$ is a tall narrow spike at $0.5$: a
strong prior conviction of fairness. The mean and spread are

$$\mathbb E[\theta]=\frac{\alpha}{\alpha+\beta},
  \qquad
  \operatorname{Var}[\theta]
    =\frac{\alpha\beta}{(\alpha+\beta)^2(\alpha+\beta+1)} .$$

The variance has $\alpha+\beta$ in the denominator, so the more total
pseudo-counts you have, the narrower the curve: more (imagined or
real) evidence means more certainty.

### The likelihood: what the flips alone say

Flips are independent, each heads with probability $\theta$. Seeing
$k$ heads in $n$ flips has probability (as a function of $\theta$)

$$p(k\mid\theta)=\binom{n}{k}\,\theta^{k}(1-\theta)^{n-k} .$$

As a curve over $\theta$ this is peaked at the empirical frequency
$k/n$. The binomial coefficient does not depend on $\theta$, so up to
normalization the likelihood has the same algebraic shape as a
$\mathrm{Beta}(k+1,\,n-k+1)$ density; that is exactly the orange curve
the playground draws. Note what it cannot do alone: with $n=0$ it is
flat (no data, no information); with $k=n=1$ it pushes all weight to
$\theta=1$, which is clearly an overreaction to one flip. The prior is
what tempers that.

### Bayes theorem, and why it stays Beta (conjugacy)

Bayes theorem multiplies prior by likelihood and renormalizes:

$$p(\theta\mid\text{data})
  \;\propto\;
  \underbrace{\theta^{\alpha_0-1}(1-\theta)^{\beta_0-1}}_{\text{prior}}
  \;\times\;
  \underbrace{\theta^{k}(1-\theta)^{n-k}}_{\text{likelihood}}
  \;=\;
  \theta^{(\alpha_0+k)-1}(1-\theta)^{(\beta_0+n-k)-1}.$$

The right-hand side is, by inspection, another Beta density. This is
**conjugacy**: a Beta prior with a binomial likelihood gives a Beta
posterior, with no integral to evaluate. The update is pure counting,

$$\boxed{\;\alpha = \alpha_0 + k,\qquad
         \beta  = \beta_0 + (n-k)\;}$$

add observed heads to $\alpha_0$, observed tails to $\beta_0$. That is
why $\alpha_0,\beta_0$ are called prior pseudo-counts: the prior acts
exactly like having already seen $\alpha_0-1$ heads and $\beta_0-1$
tails. With a lot of real data $k,\,n-k$ swamp the pseudo-counts and
the posterior forgets the prior; with little data the prior dominates.
This is the cleanest example in all of Bayesian inference, which is
why it is the standard first one taught.

### Reporting a belief: the credible interval

The posterior is a full curve, but a summary is useful. The playground
prints the posterior mean $\alpha/(\alpha+\beta)$ and standard
deviation, and shades the 95 percent equal-tailed credible interval
$[\theta_{2.5\%},\theta_{97.5\%}]$: the central band that holds 95
percent of the posterior probability. Unlike a frequentist confidence
interval, the Bayesian statement is direct: given the prior and the
data, there is a 95 percent probability the bias lies in the shaded
band. The interval needs the Beta cumulative distribution, which has
no elementary closed form, so it is integrated numerically (Simpson's
rule on the Beta density) and inverted by bisection to find the two
tail quantiles. The update is exact; only this reporting step is
numerical.

### Things to try

- Set $\alpha_0=\beta_0=1$ (flat prior, total ignorance): the
  posterior is just the normalized likelihood, peaked at $k/n$.
- Set a strong fair prior (large equal $\alpha_0,\beta_0$) and a small
  amount of skewed data: the posterior barely moves; a strong prior
  resists weak evidence.
- Press "Flip 5" repeatedly: each batch comes from a biased coin
  (true bias 0.7). Watch the posterior march from your prior toward
  $0.7$ and its width shrink roughly like $1/\sqrt{n}$, the credible
  interval visibly tightening.
- Raise $n$ at fixed $k/n$: same peak location, much narrower curve.
  More data is more certainty, not a different answer.

### Where this comes from

The Beta-binomial conjugate analysis, the pseudo-count reading of the
prior and the credible interval follow Gelman et al., *Bayesian Data
Analysis*, 3rd ed., Section 2.2, and Murphy, *Probabilistic Machine
Learning: An Introduction*, Section 11.2. The Lanczos approximation
for the gamma function used to normalize the Beta density is from
Press et al., *Numerical Recipes*, Section 6.1.

## Physical setup

A coin (a Bernoulli source) has an unknown success probability
$\theta\in[0,1]$. Belief about $\theta$ is represented by a Beta
density. The prior $\mathrm{Beta}(\alpha_0,\beta_0)$ encodes belief
before data; the data are $k$ heads in $n$ independent flips. There is
no dynamics and no time stepping; the "evolution" is the change of the
posterior as data are added (the Flip button) or the controls move.

## Governing equations

- Prior: $p(\theta)\propto\theta^{\alpha_0-1}(1-\theta)^{\beta_0-1}$.
- Likelihood: $p(k\mid\theta)\propto\theta^{k}(1-\theta)^{n-k}$, drawn
  normalized as $\mathrm{Beta}(k+1,\,n-k+1)$.
- Posterior (conjugate update):
  $\alpha=\alpha_0+k$, $\beta=\beta_0+(n-k)$.
- Posterior mean $\alpha/(\alpha+\beta)$; variance
  $\alpha\beta/[(\alpha+\beta)^2(\alpha+\beta+1)]$.
- 95 percent equal-tailed credible interval from the Beta CDF.

## Numerical method

The conjugate update is exact closed-form arithmetic (parameter
addition), so the posterior carries zero approximation error. The Beta
function is evaluated through the log-gamma function (Lanczos
approximation, accurate to about 1e-10 over the argument range here)
so the density stays stable for large alpha, beta. The Beta CDF,
needed only for the credible-interval band, is computed by composite
Simpson's rule over the density and inverted by bisection (60
iterations) for the two tail quantiles. All quantities are
deterministic functions of the slider values; the only stochastic
element is the "Flip 5" button, which draws five Bernoulli outcomes
from a fixed-seed RNG (seed `0xC0FFEE`).

## Controls

- alpha_0 (0.5 to 20): prior heads pseudo-count.
- beta_0 (0.5 to 20): prior tails pseudo-count.
- k (0 to 50): observed heads (clamped to at most n).
- n (0 to 50): observed flips.
- Reset: returns to Beta(2, 2) prior with 7 heads in 10 flips.
- Flip 5 (random): adds five flips from a coin of true bias 0.7,
  extending the k and n ranges as needed.
- Live readout (monospace): k / n, posterior mean, posterior sigma,
  95 percent credible-interval bounds.
- share_state_keys: none (the state is fully set by the four sliders).

## Expected qualitative features

1. With a flat prior (alpha_0 = beta_0 = 1) the posterior coincides
   with the normalized likelihood, peaked at k / n.
2. Adding data (Flip 5, or raising n at fixed k/n) narrows the
   posterior and tightens the shaded credible interval.
3. A strong prior plus weak data leaves the posterior close to the
   prior; weak prior plus strong data leaves it close to the
   likelihood.
4. Repeated biased flips walk the posterior mean toward 0.7.
5. The five reference frames differ (prior-dominated, few flips,
   moderate data, data-dominated tight posterior).

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. Conjugate update: posteriorParams gives a = alpha_0 + k and
   b = beta_0 + (n - k) exactly.
2. Beta(1, 1) is the uniform density (pdf = 1 to 1e-10) everywhere.
3. Posterior mean and variance match the closed-form formulae to
   1e-12.
4. Posterior concentrates: variance for n = 100 is roughly 10x
   smaller than for n = 10 at the same k/n (ratio in [6, 15]).
5. The 95 percent credible interval brackets the posterior mean and
   has width in (0, 1).
6. betaPdf is deterministic (identical inputs reproduce the value).

Visual gate: SSIM > 0.92 against the five committed deterministic
golden frames.

## Limiting cases for verification

- Beta(1, 1) prior: posterior equals the normalized likelihood.
- n = 0: posterior equals the prior (no data, no update).
- Large n at fixed k/n: posterior mean fixed, variance shrinks like
  1/n, recovering the law of large numbers.

## Visual fallback

Canvas2D only. Three curves over theta in [0, 1] (prior, normalized
likelihood, posterior) with the 95 percent credible interval shaded
under the posterior and a monospace summary readout. No GPU path.

## Citations

- Gelman et al., Bayesian Data Analysis, 3rd ed., Section 2.2:
  Beta-binomial conjugate analysis.
- Murphy, Probabilistic Machine Learning: An Introduction, Section
  11.2: the Beta-Bernoulli model.
- Press et al., Numerical Recipes, Section 6.1: Lanczos log-gamma.

## Stretch goals

- Sequential mode: animate the posterior one flip at a time.
- Highest-posterior-density interval as an alternative to the
  equal-tailed band.
- Prior-predictive and posterior-predictive overlays for the next
  flip.

## Risk register

- The Beta CDF is numerically integrated; at extreme parameters
  (alpha or beta above a few hundred) the Simpson grid would lose
  accuracy. The slider ranges and the Flip increments keep the
  parameters well inside the validated regime.
