# Reel script: Floating-Point Precision Pitfalls

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: A 24-bit copy of 0.1 makes a long-running clock drift 0.34 s in 100 h; the prediction gate walks off a fast object and misses it.
Caption: A 24-bit copy of 0.1 makes a long-running…

## Beat 2, the reveal (3 to 10s)
VO: A long-running tracking system counts time in tenth-of-a-second ticks and multiplies by a 24-bit copy of $0.1$.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: But $0. 1$ has no exact binary form, and chopped to 24 bits it becomes $209715/2097152 = 0.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Just watch: the system clock ages on its own and the catch goes from centered, through edge catches, to a clean miss. The catch-confidence bar slides down continuously, there is no single instant it "switches off".
VO: Grab the uptime slider to hold a moment: the tiny rounding of 0.1 per tick accumulates into the miss distance shown, growing in exact proportion to how long the system has been powered.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: the prediction gate walks off a fast object and misses it.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- A 24-bit copy of 0.1 makes a long-running…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
marked.
