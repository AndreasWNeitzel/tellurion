# MCMC Sampler Comparator

Three Markov-chain Monte Carlo samplers run in parallel on a chosen 2D target density. Each sampler lays down its accepted-state trail in a distinct categorical colour over a monochrome contour map of the target. The right-hand panel reports per-sampler acceptance, effective sample size, and a Kolmogorov-Smirnov statistic against the analytic marginal where available.

Four targets ship out of the box (Gaussian, banana, Gaussian mixture, Neal's funnel) and four samplers (RWM, adaptive RWM, MALA, HMC). Mix them to see where each method shines: HMC traverses the banana valley efficiently, MALA fights against the funnel's curvature, and RWM gets stuck in the funnel's neck.

Controls: target dropdown, three sampler dropdowns, HMC leapfrog-step slider, sample-count slider, restart and play/pause buttons.

## Reference

Primary citations: MacKay, "Information Theory, Inference, and Learning Algorithms", 2003, Sections 29.4 (Metropolis-Hastings) and 30.1 (HMC); Robert and Casella, "Monte Carlo Statistical Methods", 2nd ed., 2004, Sections 7.2 and 7.6 (adaptive RWM); Bishop and Bishop, "Deep Learning: Foundations and Concepts", 2024, Section 14.3 (MCMC); Gelman BDA3 Section 11.6 (HMC). All bib keys carry chapter_index entries with these subsections.

## Verification

- Strong invariants (engine-level): RWM mean/var within 5 percent of analytic; HMC ESS > 3x RWM on the banana; detailed balance probe |p0 forward - p1 reverse| < 1e-3; KS < 0.05 against N(0, 1) for all four samplers at n = 1e5.
- Playground-level: capture-mode integration runs five thousand samples on each of three chains for the banana target; HMC ESS / RWM ESS observed at 6.5x.
- Reproducibility: bit-identical first-1000-sample state at fixed seed.
- Visual gate: SSIM > 0.92 across all five frames spanning 200 to 5000 samples.
- Last verified: see `.verified`.
