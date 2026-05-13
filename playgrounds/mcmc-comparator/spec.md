---
title: MCMC Sampler Comparator
slug: mcmc-comparator
status: in-progress
audience: portfolio
created: 2026-05-13
---

# MCMC Sampler Comparator

## Physical setup

A 2D target density rendered as a contour map, with three Markov-chain Monte Carlo samplers running in parallel and laying down their accepted-state traces on the same plot. The user picks the target from a small bank (Gaussian, banana, Gaussian mixture, Neal's funnel) and the sampler triplet from {random-walk Metropolis, adaptive RWM, MALA, HMC}. A live readout reports per-sampler acceptance, ESS per second of wall time, and a Kolmogorov-Smirnov statistic against the analytic target's first marginal.

## Governing equations

Each sampler simulates a Markov chain with stationary distribution equal to the target $\pi(x) \propto \exp(\log p(x))$. The four samplers share a unified target interface $\{ \log p(x),\ \nabla \log p(x) \}$ and differ in the proposal:

- Random-walk Metropolis (RWM): $x' = x + \sigma\,\xi$ with $\xi \sim \mathcal{N}(0, I_d)$.
- Adaptive RWM: $x' = x + \mathrm{chol}(\hat{\Sigma}_n)\,u$ where $\hat{\Sigma}_n$ is the running covariance after a warmup period and $u \sim \mathcal{N}(0, (2.38)^2 / d \cdot I_d)$ (Roberts and Rosenthal optimal scaling, Robert-Casella Section 7.6).
- Metropolis-adjusted Langevin (MALA): $x' = x + \frac{1}{2}\epsilon^2 \nabla \log p(x) + \epsilon\,\xi$.
- Hamiltonian Monte Carlo (HMC): $L$ leapfrog steps with step size $\epsilon$ on $H(x, p) = -\log p(x) + \tfrac{1}{2}\|p\|^2$, then Metropolis-correct on $\Delta H$.

Accept with the Metropolis-Hastings ratio $\min(1, p(x') q(x | x') / (p(x) q(x' | x)))$.

## Numerical method

- **Engine**: `shared/js/engine/mcmc-harness.js`, four samplers as above. Each chain is seeded independently from `0xC0FFEE` so the three live chains are statistically independent.
- **Targets**: `gaussian2d`, `banana`, `mixture2d`, `funnel`. Defined in `shared/js/engine/mcmc-harness.js`.
- **Discretization**: pure event-driven update. The samplers do not advance in physical time; the playground advances them at a fixed rate of `SAMPLES_PER_FRAME = 30` updates per requestAnimationFrame call, regardless of monitor refresh, so the visible "chain rate" is the same across sampler choices.
- **Burn-in handling**: the first `WARMUP = 200` samples per chain are kept in state but excluded from the ESS, KS, and trace plot. The user sees a "burn" badge until that count is reached.
- **Diagnostics**: acceptance is a running counter. ESS uses the initial monotone sequence estimator in `shared/js/invariants/ess.js`. KS uses `ks1D` against the marginal CDF of the analytic target where available.
- **Seed**: `0xC0FFEE` throughout. Each sampler's RNG is derived from `seed XOR samplerIndex` so the three live samplers exhibit independent variability while staying deterministic per repaint.

## Controls

| name | type | sets |
|------|------|------|
| Target | select | one of gaussian2d, banana, mixture2d, funnel |
| Sampler A, B, C | select | one of rwm, adaptive-rwm, mala, hmc |
| Sampler step size (knob) | knob | sigma for RWM, eps for MALA/HMC |
| HMC leapfrog steps | slider | integer count L, 1..40 |
| Sample count | slider | integer, 100..50000 (target chain length) |
| Pause/Play, Reset | buttons | standard |

## Expected qualitative features

### In the default golden frames

The captureFraction sweep holds the target = banana, samplers = (rwm, mala, hmc) at default step sizes, and varies the running sample count: `t-000` = 200 (burn-in done), `t-100` = 50000. Every frame shows:

- A monochrome contour plot of the banana density underneath the trace plot.
- Three accepted-state trails in cat-1, cat-2, cat-3 (one color per sampler).
- A right-side panel with three rows: sampler name, acceptance, ESS / sample, KS, and "burning" indicator.

### Through interaction

- Switch target so contours redraw, all three chains restart from the origin.
- Switch sampler so the chosen sampler's trail is overwritten with the new trajectory.
- Adjust knob so step size updates; acceptance and ESS responses are visible in the live readout.

## Invariants and acceptance thresholds

| invariant | strong / medium | threshold | notes |
|-----------|-----------------|-----------|-------|
| RWM on gaussian2d | strong | mean / var within 5 percent of analytic after 10^5 samples | engine test verified |
| HMC ESS / sample > 3x RWM on banana | strong | ratio > 3 | engine test verified |
| Detailed balance on 2-state toy | strong | abs(p0 forward minus p1 reverse) below 1e-3 | engine test verified |
| KS to gaussian2d marginal | medium | KS < 0.05 at n = 1e5 post-burn for every sampler | engine test verified |

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| Target = gaussian2d, sampler = HMC, infinite L | exact sampling (zero autocorrelation) | textbook |
| Target = funnel, sampler = RWM | mixing breaks (chain stuck in neck) | Neal 2003 |
| Target = banana, sampler = HMC | chain traverses the valley | Bishop-Bishop Section 14.3 |

## Aesthetic waivers

1. **Three categorical colours used at once.** Each sampler must be visually distinguishable; the cat-1/-2/-3 categorical scale serves this. Approved.
2. **Canvas 2D text hard-coded at 11 px.** Same as other playgrounds; ctx.font does not inherit CSS variables.

## Citations

1. **MacKay, D. J. C.** "Information Theory, Inference, and Learning Algorithms", 2003. Bib key `mackay2003`. Sections 29.4 (Metropolis-Hastings), 29.5 (Gibbs sampling), 30.1 (HMC).
2. **Robert, C. P. and Casella, G.** "Monte Carlo Statistical Methods", 2nd ed., 2004. Bib key `robertcasella2004`. Sections 7.2 (Metropolis-Hastings), 7.6 (Adaptive MCMC).
3. **Bishop, C. M. and Bishop, H.** "Deep Learning: Foundations and Concepts", 2024. Bib key `bishopbishop2024`. Section 14.3 (Markov Chain Monte Carlo).
4. **Gelman, A. et al.** "Bayesian Data Analysis", 3rd ed., 2013. Bib key `gelman2013`. Section 11.6 (Hamiltonian Monte Carlo).

All cited subsections verified in chapter_index.

## Stretch goals

- Add NUTS as a fifth sampler.
- Add a Gibbs sampler for the mixture target (block-coordinate updates).
- Plot ESS / sec on a small inset instead of just ESS / sample.
- Per-chain step-size auto-tuner during warmup with on-the-fly visualization.
