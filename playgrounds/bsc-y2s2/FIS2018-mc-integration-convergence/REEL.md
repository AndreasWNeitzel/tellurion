# Reel script: Monte Carlo Integration Convergence

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Throw random darts at a shape and the fraction inside is its area; the error falls only as 1/sqrt(N), so ten times the accuracy costs a hundred times the darts.
Caption: Throw random darts at a shape and the fra…

## Beat 2, the reveal (3 to 10s)
VO: Monte Carlo integration by hit-or-miss sampling: a shape lives in the unit square, uniform random darts are thrown, and the fraction landing inside estimates the shape''s area, which is the integral of its indicator function.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The darts accumulate continuously so the estimate refines in front of you, and because the hit count is a Binomial random variable the standard error shrinks as 1/sqrt(N) regardless of the shape. The playground offers several shape presets (a quarter disk that estimates pi, an ellipse, an annulus, a four-petal rose) and plots the absolute error against N on log-log axes next to the 1/sqrt(N) reference.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag a control and watch the whole picture change, not just a number on the side.
VO: Push it to an extreme and see where the physics breaks down.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: the error falls only as 1/sqrt(N), so ten times the accuracy costs a hundred times the darts.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Throw random darts at a shape and the fra…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
MacKay, Information Theory, Inference, and Learning Algorithms, Ch. 29; Press et al., Numerical Recipes, Ch. 7.
