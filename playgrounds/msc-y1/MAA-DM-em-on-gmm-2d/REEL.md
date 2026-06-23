# Reel script: EM on a 2D Gaussian Mixture

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: A cloud of points secretly blends a few overlapping Gaussian bumps; watch Expectation-Maximization recover their shapes and weights by alternating soft guesses and refits until the ellipses snap onto the data.
Caption: A cloud of points secretly blends a few o…

## Beat 2, the reveal (3 to 10s)
VO: The data is modeled as a Gaussian mixture: each point is drawn from one of K Gaussians with mixing weight pi k, but the assignment of points to components is hidden, so the likelihood cannot be maximized directly.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Expectation-Maximization alternates an E-step (given the current parameters, compute each point''s soft responsibility gamma ik for every component) and an M-step (refit each component as a responsibility-weighted mean and covariance), a loop that provably increases the data log-likelihood every iteration and converges to a local optimum. The playground animates the component ellipses translating and reshaping onto the blobs while the log-likelihood climbs monotonically in the live readout.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Pick two overlapping clusters or unequal weights: EM soft assignments blur where the clusters overlap, and the fitted ellipses settle onto the true faint ones over a few E and M steps.
VO: Change the init seed: EM is non-convex, so a bad seed converges to a wrong local optimum (one cluster swallowing two).
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: watch Expectation-Maximization recover their shapes and weights by alternating soft guesses and refits until the ellipses snap onto the data.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- A cloud of points secretly blends a few o…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Dempster, Laird and Rubin 1977; Bishop, Pattern Recognition and Machine Learning, Chapter 9.
