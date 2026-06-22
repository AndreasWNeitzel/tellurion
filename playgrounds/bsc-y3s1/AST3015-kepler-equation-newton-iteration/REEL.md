# Reel script: Kepler Equation Newton Iteration

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: To find where a planet is at a given time you must solve M = E - e sin E, which has no closed form; Newton''s method nails it in a handful of steps.
Caption: To find where a planet is at a given time…

## Beat 2, the reveal (3 to 10s)
VO: What you are seeing: the orbit of a planet in a Keplerian ellipse (left) and the Newton-iteration history for the Kepler equation M=E−esin⁡EM = E - e \sin EM=E−esinE (right).
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: At each rAF frame the mean anomaly M=2πt/TM = 2\pi t / TM=2πt/T ticks forward; the solver iterates on EEE until ∣En+1−En∣<10−12|E_{n+1} - E_n| \lt 10^{-12}∣En+1​−En​∣<10−12 and the planet is placed at (a(cos⁡E−e),bsin⁡E)(a(\cos E - e), b \sin E)(a(cosE−e),bsinE) on the ellipse.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Vary each control and watch the rail readouts respond.
VO: Compare the diagnostic plot against the live scene.
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
carroll-ostlie
