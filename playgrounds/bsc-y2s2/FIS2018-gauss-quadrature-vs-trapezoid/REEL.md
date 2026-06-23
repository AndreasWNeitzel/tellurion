# Reel script: Gauss-Legendre vs Trapezoid Quadrature

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: The trapezoid rule needs hundreds of points where Gauss-Legendre nails a smooth integral with a handful, just by choosing where to sample.
Caption: The trapezoid rule needs hundreds of poin…

## Beat 2, the reveal (3 to 10s)
VO: Both rules approximate an integral as a weighted sum of samples, but they differ in where the samples go.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The trapezoid rule uses n + 1 equispaced points and converges slowly; Gauss-Legendre places n nodes at the roots of the Legendre polynomial and integrates polynomials up to degree 2n - 1 exactly, so for smooth functions it converges far faster. The playground evaluates both on several test integrands and plots the error against the number of points, so the gap, and where Gauss loses its edge (on non-smooth functions like sqrt|x|), is explicit.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Raise the node count n: the trapezoid error falls slowly as 1/n-squared, while Gauss-Legendre plunges to machine precision within a handful of nodes.
VO: Note where Gauss puts its nodes: clustered, unequally weighted, and never at the endpoints, which is how n points integrate polynomials up to degree 2n-1 exactly.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The playground evaluates both on several test integrands and plots the error against the number of points, so the gap, and where Gauss loses its edge (on non-smooth functions like sqrt|x|), is explicit.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- The trapezoid rule needs hundreds of poin…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Press et al., Numerical Recipes, Ch. 4.
