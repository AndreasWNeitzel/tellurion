# Reel script: Green's Function: Building a Solution from Tent Responses

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Solve -u'''' = f the smart way: first solve it for a single spike, which gives a tent-shaped Green''s function that is zero at both walls with a kink where the spike sits.
Caption: Solve -u'''' = f the smart way: first sol…

## Beat 2, the reveal (3 to 10s)
VO: A Green's-function playground for the 1D problem -u'' = f on [0, 1] with the ends pinned at zero.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The response to a single point spike is the tent G(x, x'): zero at both walls, peaked at the spike, with a unit downward kink there. Because the equation is linear, the response to any source is the superposition of tents weighted by the source value, u = integral G f.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Click anywhere on the source plot (middle panel) to drop a point source: its Green tent appears instantly in the solution. Right-click drops a negative source; shift-click clears them.
VO: Drag the x' slider: the gold tent slides along, always pinned to zero at both walls with its kink at the source point. That single tent is the response to a unit impulse there.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The Green function is symmetric, vanishes at both pinned ends, has a unit downward slope kink at the source point, and the weighted superposition of tents reproduces the exact solution and the analytic sine series.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Solve -u'''' = f the smart way: first sol…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
is just a pile of spikes, so the full solution is the same pile of tents, each scaled by how strong the source is there: u(x) = integral G(x, x') f(x') dx'.
