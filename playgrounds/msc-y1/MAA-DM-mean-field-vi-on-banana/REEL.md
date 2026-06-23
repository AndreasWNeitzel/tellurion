# Reel script: Mean-Field VI on a Banana

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Variational inference turns Bayesian inference into optimization; watch a mean-field Gaussian squeeze itself into a curved banana posterior and see exactly what that approximation gets wrong.
Caption: Variational inference turns Bayesian infe…

## Beat 2, the reveal (3 to 10s)
VO: The true posterior is a long curved Rosenbrock valley, p(x,y) proportional to exp[-(x 2 + 10(y - x 2) 2)/2].
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Variational inference replaces sampling with optimization: it fits the closest member of a simple family, here the mean-field Gaussian q(x,y) = N(x | mu x, sigma x 2) N(y | mu y, sigma y 2), which by construction cannot represent any x-y correlation. Maximizing the evidence lower bound (equivalently minimizing the reverse KL divergence from q to p) is mode-seeking: q collapses onto one region and underestimates the variance rather than averaging over the whole curved ridge, the canonical failure mode the visible mismatch makes obvious.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Watch the axis-aligned Gaussian try to fit the curved banana: mean-field VI cannot tilt, so it collapses onto one part of the valley and underestimates the variance.
VO: Raise K (Monte Carlo samples): the ELBO gradient gets less noisy and the fit settles more smoothly, at higher cost per step.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: watch a mean-field Gaussian squeeze itself into a curved banana posterior and see exactly what that approximation gets wrong.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Variational inference turns Bayesian infe…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Bishop, Pattern Recognition and Machine Learning, Chapter 10; Blei, Kucukelbir and McAuliffe 2017.
