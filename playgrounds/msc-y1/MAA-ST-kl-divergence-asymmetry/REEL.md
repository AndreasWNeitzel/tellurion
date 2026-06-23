# Reel script: KL Divergence Asymmetry (Mass-Covering vs Mode-Seeking)

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: The KL divergence is not symmetric: fitting a simple Gaussian to a two-bump target one way covers both bumps, the other way collapses onto one, and the two answers are qualitatively opposite.
Caption: The KL divergence is not symmetric: fitti…

## Beat 2, the reveal (3 to 10s)
VO: The Kullback-Leibler divergence KL(P || Q) = integral P log(P/Q) is the expected extra code length from using Q when the truth is P; it is non-negative, zero only when P = Q, and asymmetric.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Fitting an approximating Q to a bimodal target P by minimizing the forward KL(P || Q) is mass-covering (zero-avoiding): Q is penalized wherever P has mass but Q does not, so it spreads to span both modes. Minimizing the reverse KL(Q || P) is mode-seeking (zero-forcing): Q is penalized for mass where P is small, so it collapses onto a single mode and underestimates variance, which is exactly why variational inference is mode-seeking.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag a control and watch the whole picture change, not just a number on the side.
VO: Push it to an extreme and see where the physics breaks down.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The playground fits one Gaussian to a two-bump target both ways and shows the opposite outcomes side by side.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- The KL divergence is not symmetric: fitti…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Cover and Thomas, Elements of Information Theory, Chapter 2; Bishop, Pattern Recognition and Machine Learning, Chapter 10.
