# Reel script: GP Kernel Zoo

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: A Gaussian process is a probability distribution over whole functions; pick a kernel and watch the prior fog of plausible curves collapse onto a handful of data points with calibrated uncertainty (wide between points, tight on them).
Caption: A Gaussian process is a probability distr…

## Beat 2, the reveal (3 to 10s)
VO: A Gaussian process places a prior over functions: any finite set of values is jointly Gaussian with mean zero and covariance set by a kernel k(x, x''), which encodes how smooth, wiggly or periodic the function is.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Conditioning on noisy observations gives a closed-form Gaussian posterior, with mean mu(x*) = k(x*,X)[K + sigma n 2 I]^-1 y and variance k(x*,x*) minus k(x*,X)[K + sigma n 2 I]^-1 k(X,x*). The playground lets you switch among kernels (squared-exponential, Matern, periodic, linear) and see how each reshapes both the prior sample functions and the data-conditioned posterior with its uncertainty band.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Switch the kernel: RBF gives smooth curves, Matern rougher ones, periodic repeating ones. The prior fog of sample functions takes on exactly the character the kernel encodes.
VO: Shorten the length scale: the prior wiggles faster and the posterior band snaps back to the data sooner, so the fit trusts only nearby points.
VO: Add observations: the posterior band pinches to zero at each one and balloons between them, the calibrated uncertainty that makes a Gaussian process more than a curve fit.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: pick a kernel and watch the prior fog of plausible curves collapse onto a handful of data points with calibrated uncertainty (wide between points, tight on them).
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- A Gaussian process is a probability distr…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Rasmussen and Williams, Gaussian Processes for Machine Learning, Chapters 2 and 4.
