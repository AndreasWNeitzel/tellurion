# Reel script: MOSFET Operation: Channel, Pinch-off and I-V Regions

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: An n-channel MOSFET stays off until the gate passes the threshold, then carries a current that first rises with drain voltage and then clamps flat once the inversion channel pinches off at the drain.
Caption: An n-channel MOSFET stays off until the g…

## Beat 2, the reveal (3 to 10s)
VO: An interactive n-channel enhancement MOSFET using the square-law (level-1) model with a subthreshold exponential tail (Neamen, Semiconductor Physics and Devices, 4th ed., Ch.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: 10-11; Sze and Ng). Below threshold ($V_{GS} \lt V_{th}$) the device is off and the drain current is a tiny subthreshold exponential; above threshold the inversion channel forms and, for $V_{DS} \lt V_{ov} = V_{GS} - V_{th}$, the device is in the triode region with $I_D = k_n[V_{ov} V_{DS} - V_{DS}^2/2]$; at $V_{DS} = V_{ov}$ the channel pinches off at the drain and the device saturates at $I_D = (k_n/2) V_{ov}^2 (1 + \lambda V_{DS})$.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Vary each control and watch the rail readouts respond.
VO: Compare the diagnostic plot against the live scene.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The output panel draws the $I_D$-$V_{DS}$ family for several gate voltages with the pinch-off locus $V_{DS} = V_{GS} - V_{th}$, the cross-section panel animates the inversion channel tapering and pinching off as $V_{DS}$ sweeps, and the transfer panel shows $I_D$-$V_{GS}$ with the threshold, so the gate-controlled switch and the saturated current source the device acts as are both visible.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- An n-channel MOSFET stays off until the g…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
shichman-hodges1968
