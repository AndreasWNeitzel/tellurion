# Reel script: MCMC Sampler Comparator

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Three Markov-chain Monte Carlo samplers race on the same hard target.
Caption: Three Markov-chain Monte Carlo samplers r…

## Beat 2, the reveal (3 to 10s)
VO: Markov-chain Monte Carlo draws from a distribution you can evaluate but not sample directly by building a random walk whose stationary distribution is the target.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Every sampler here uses the Metropolis-Hastings rule, accept a proposal x'' from x with probability min(1, [pi(x'') q(x|x'')] / [pi(x) q(x''|x)]), which enforces detailed balance and so fixes pi as the chain stationary law; the samplers differ only in the proposal q: isotropic random-walk Metropolis, an adaptive-covariance variant, gradient-drifted MALA, and Hamiltonian Monte Carlo, which adds momentum and integrates Hamiltonian trajectories for long, nearly rejection-free moves. On the banana or Neal''s funnel the random-walk methods stall while HMC keeps mixing; the live readout reports per-sampler acceptance, effective sample size per unit time, and a Kolmogorov-Smirnov distance to the true marginal, so efficiency is judged by independent draws per second rather than raw motion.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag a control and watch the whole picture change, not just a number on the side.
VO: Push it to an extreme and see where the physics breaks down.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: the honest scorecard is effective samples per second, not acceptance rate.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Three Markov-chain Monte Carlo samplers r…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Robert and Casella, Monte Carlo Statistical Methods, 2nd ed., Chapter 7; Neal, MCMC using Hamiltonian Dynamics, in the Handbook of Markov Chain Monte Carlo (2011).
