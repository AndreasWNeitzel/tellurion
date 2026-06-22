# Reel script: Gram-Schmidt Orthogonalization

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Take a set of skewed vectors and straighten them into a perpendicular frame without changing the space they span.
Caption: Take a set of skewed vectors and straight…

## Beat 2, the reveal (3 to 10s)
VO: Two vectors that lean on each other, turned into a clean perpendicular pair.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Gram-Schmidt keeps the first direction, $q_1 = v_1/|v_1|$, then strips out of $v_2$ everything that points along $q_1$: it subtracts the projection $(v_2\cdot q_1)\,q_1$, and what is left, the residual, is perpendicular to $q_1$ by construction. Normalize it and you have $q_2$.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Watch the projection (the part of v₂ along q₁) get subtracted off, leaving the perpendicular residual that becomes q₂.
VO: Turn v₂ toward v₁: the residual shrinks. When they are parallel it hits zero, and the orthogonalization fails (the vectors are linearly dependent).
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: what is left is orthogonal. That is Gram-Schmidt.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Take a set of skewed vectors and straight…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
arfken-weber
