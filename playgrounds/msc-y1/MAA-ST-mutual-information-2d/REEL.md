# Reel script: Mutual Information of a Bivariate Gaussian

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Correlation only sees straight-line dependence; mutual information sees all of it, in nats.
Caption: Correlation only sees straight-line depen…

## Beat 2, the reveal (3 to 10s)
VO: Mutual information I(X;Y) measures how much knowing one variable reduces uncertainty about the other: it is the Kullback-Leibler divergence between the true joint density and the product of the marginals, equivalently I = H(X) - H(X|Y), zero exactly when X and Y are independent and positive otherwise.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: For a bivariate Gaussian with correlation coefficient rho everything collapses to the closed form I(X;Y) = -1/2 ln(1 - rho 2), which depends only on rho 2 (positive and negative correlation carry the same information) and rises slowly then diverges as |rho| approaches 1. The playground renders the joint density as a heatmap with its marginals, sweeps rho and the marginal widths, and tracks both the exact I and a grid-integrated estimate, the workhorse quantity behind feature selection, the information bottleneck and channel analysis.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag a control and watch the whole picture change, not just a number on the side.
VO: Push it to an extreme and see where the physics breaks down.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: mutual information sees all of it, in nats. For two correlated Gaussians it is exactly -1/2 ln(1 - rho 2): zero when independent, diverging as one variable comes to determine the other.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Correlation only sees straight-line depen…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Cover and Thomas, Elements of Information Theory, 2nd ed., Chapters 2 and 8; MacKay, Information Theory, Inference, and Learning Algorithms, Chapter 2.
