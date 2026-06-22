# Reel script: Attention as Soft Retrieval

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Attention is a differentiable lookup table.
Caption: Attention is a differentiable lookup tabl…

## Beat 2, the reveal (3 to 10s)
VO: Single-head dot-product attention over a small key-value bank.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Each key is a point in 2D; values are scalars rendered as bar heights. Drag the query around the $(k_x, k_y)$ plane to recompute the attention weights, then watch the output bar approach the weighted average of the value bars.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Vary each control and watch the rail readouts respond.
VO: Compare the diagnostic plot against the live scene.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: As temperature $\tau$ drops to zero the attention collapses to one-hot retrieval of the nearest key; as $\tau$ grows the distribution flattens toward uniform.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Attention is a differentiable lookup tabl…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
vaswani2017
