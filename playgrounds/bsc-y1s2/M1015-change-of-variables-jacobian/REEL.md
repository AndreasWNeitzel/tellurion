# Reel script: Change of Variables and the Jacobian

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Switch coordinates in a double integral and areas do not carry over: a cell du dv becomes a parallelogram of area |J| du dv.
Caption: Switch coordinates in a double integral a…

## Beat 2, the reveal (3 to 10s)
VO: When you switch coordinates inside a double integral, areas do not carry over unchanged: a small rectangle $du\,dv$ in the source plane becomes a small parallelogram in the target plane, and its area is scaled by the Jacobian determinant $|J| = |\partial(x,y)/\partial(u,v)|$.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: That is the whole content of $dx\,dy = |J|\,du\,dv$ and of the change-of-variables theorem $\iint_R f\,dx\,dy = \iint_S f(T)\,|J|\,du\,dv$. This playground pushes a real grid through a real map and colours each mapped cell by its local $|J|$, so you can see where the map stretches (bright, $|J|\gt 1$) and where it squeezes (dark, $|J|\lt 1$).
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag the probe (orange) around the source grid and watch the Jacobian parallelogram in the mapped plane grow and shrink; its area is exactly $|J|$ times the source cell.
VO: Stay on the polar map: the cells far from the origin are bright and large because $|J| = r$ grows with radius, the geometric meaning of $r\,dr\,d\theta$.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The classic case is polar coordinates, where $|J| = r$: the famous $r$ in $r\,dr\,d\theta$ is just the area stretch that grows with distance from the origin.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Switch coordinates in a double integral a…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
region.
