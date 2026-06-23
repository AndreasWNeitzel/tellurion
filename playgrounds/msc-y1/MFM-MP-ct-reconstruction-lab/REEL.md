# Reel script: CT Reconstruction: Radon, Filtered Back-Projection and MLEM

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: A Shepp-Logan phantom, its Radon transform built up by a rotating gantry, and the image recovered by filtered back-projection with the Ram-Lak ramp filter or by the iterative MLEM algorithm: few angles give streaks, more angles and more iterations sharpen the image.
Caption: A Shepp-Logan phantom, its Radon transfor…

## Beat 2, the reveal (3 to 10s)
VO: A computed-tomography reconstruction playground (Kak and Slaney 1988; Shepp and Vardi 1982).
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: A Shepp-Logan phantom is projected by the parallel-beam Radon transform into a sinogram, filled angle by angle by a rotating gantry. The image is recovered either by filtered back-projection, applying the discrete Ram-Lak ramp filter (or the Shepp-Logan apodisation, or none) and smearing each projection back across the field, or by the Shepp-Vardi MLEM iteration.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag a control and watch the whole picture change, not just a number on the side.
VO: Push it to an extreme and see where the physics breaks down.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: Panel A shows the phantom and the sinogram; Panel B the reconstruction; Panel C the error against the number of projection angles and, for MLEM, against iteration.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- A Shepp-Logan phantom, its Radon transfor…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
exactly, the reconstruction error falls as more projection angles are added, and the MLEM iteration converges monotonically. Reference: Kak and Slaney, Principles of Computerized Tomographic Imaging; Shepp and Vardi 1982.
