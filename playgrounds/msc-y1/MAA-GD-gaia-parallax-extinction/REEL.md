# Reel script: Gaia Parallaxes: Distance, Bias, and Extinction

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Inverting a noisy Gaia parallax to a distance is biased and skewed.
Caption: Inverting a noisy Gaia parallax to a dist…

## Beat 2, the reveal (3 to 10s)
VO: A parallax is the small angular wobble of a star as the Earth orbits the Sun, and it gives the distance: $d = 1/\varpi$ with $\varpi$ in arcseconds and $d$ in parsecs.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The catch is that the measured parallax is noisy, and inverting a noisy number is treacherous: $1/\varpi$ is a nonlinear transformation, so the distance you get is biased and skewed once the fractional error $f = \sigma_\varpi/\varpi$ is no longer tiny, and the noise can even push the measured parallax negative, where $1/\varpi$ is meaningless. The fix, central to working with Gaia data in Galactic archaeology, is to treat distance as a Bayesian inference: combine the Gaussian parallax likelihood with a distance prior to get a proper posterior $p(d\,|\,\varpi,\sigma) \propto \text{prior}(d)\,\mathcal{N}(\varpi; 1/d, \sigma)$.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Raise the fractional error: the Monte Carlo histogram of $1/\varpi$ skews to a long tail toward large distances, and the naive distance (red) drifts away from the posterior median (green).
VO: Toggle the prior between EDSD and flat: with a flat prior the posterior tail runs away at high error, while the exponentially-decreasing-density prior tames it (that is why Gaia distance catalogues use it).
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The example stars are real Gaia DR3 measurements.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Inverting a noisy Gaia parallax to a dist…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
bailerjones2015
