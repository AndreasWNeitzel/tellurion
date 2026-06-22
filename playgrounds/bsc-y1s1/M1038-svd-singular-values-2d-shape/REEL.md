# Reel script: SVD as Rotate-Scale-Rotate

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Every matrix, no matter how lopsided, is just rotate, then stretch along clean perpendicular axes, then rotate again.
Caption: Every matrix, no matter how lopsided, is…

## Beat 2, the reveal (3 to 10s)
VO: Every 2x2 matrix does the same three things in sequence, no matter how tangled its entries look: it rotates, it stretches along two perpendicular axes, then it rotates again.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: That is the singular value decomposition $M = U\Sigma V^T$. Watch a unit circle ride through the three steps and come out an ellipse: first $V^T$ turns it, then $\Sigma$ stretches it by the singular values $\sigma_1 \ge \sigma_2$, then $U$ turns the result.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Set b = c = 0 and vary a, d: V^T and U do nothing, the circle just stretches along the axes and the singular values are |a| and |d|.
VO: Make the rows nearly parallel (for example a=1.5, b=1.5, c=1, d=1): σ₂ shrinks toward zero, the ellipse flattens to a sliver, and the condition number blows up.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The diagnostic plots that stretch against the input direction, so the peak is $\sigma_1$ and the trough is $\sigma_2$.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Every matrix, no matter how lopsided, is…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
arfken-weber
