# Reel script: Kepler Equation Newton Iteration

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: To find where a planet is at a given time you must solve M = E - e sin E, which has no closed form; Newton''s method nails it in a handful of steps.
Caption: To find where a planet is at a given time…

## Beat 2, the reveal (3 to 10s)
VO: Kepler''s equation, M = E - e sin E, links the uniformly ticking mean anomaly M to the eccentric anomaly E that fixes the planet''s position on its ellipse.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: It is transcendental, so there is no formula for E; you iterate. The playground solves it by Newton''s method from the seed E 0 = M + e sin M and shows the iteration converging quadratically, the error roughly squaring each step, in 4-6 iterations for mild eccentricity and slowing only as e approaches 1.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Raise the eccentricity toward 1: the planet races through perihelion and crawls through aphelion, and the transcendental Kepler equation M = E - e sin E grows harder to invert.
VO: Watch the Newton iteration on the right: from a guess it converges on the eccentric anomaly in a few steps, doubling the correct digits each time.
VO: At high eccentricity a naive starting guess can stall: this little root-find, solved billions of times a day, is the workhorse behind every ephemeris and spacecraft trajectory.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: Newton''s method nails it in a handful of steps.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- To find where a planet is at a given time…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Murray and Dermott, Solar System Dynamics, Ch. 2.
