# Reel script: 1D Radiative Transfer (Uniform Slab)

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Look through a glowing slab: what you see is the background dimmed by absorption plus the slab''s own glow, blended by how thick it is.
Caption: Look through a glowing slab: what you see…

## Beat 2, the reveal (3 to 10s)
VO: The equation of radiative transfer for a uniform slab with constant
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The animation is driven by the real equations, not a canned loop.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag a control and watch the whole picture change, not just a number on the side.
VO: Push it to an extreme and see where the physics breaks down.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The equation of radiative transfer for a uniform slab with constant
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Look through a glowing slab: what you see…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
function S and optical depth tau has a clean closed form: I(tau) = I in e^(-tau) + S(1 - e^(-tau)). The emerging intensity interpolates between the background I in (transparent slab, tau much less than 1) and the slab''s own source function S (opaque slab, tau much greater than 1). The playground sweeps tau and the source contrast and shows the line going into emission or absorption, which is exactly why a spectral line appears bright or dark depending on the temperature structure. Reference: Rybicki and Lightman, Radiative Processes in Astrophysics, Ch. 1.
