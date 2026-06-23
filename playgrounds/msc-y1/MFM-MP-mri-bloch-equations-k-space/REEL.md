# Reel script: MRI: the Bloch Equations, the FID and k-Space Imaging

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: A magnetization vector precessing and relaxing on the Bloch sphere, the free induction decay and its Lorentzian spectrum, and a brain phantom imaged by spin echo or gradient echo and reconstructed from k-space by the 2D inverse Fourier transform, with the contrast set by TR and TE.
Caption: A magnetization vector precessing and rel…

## Beat 2, the reveal (3 to 10s)
VO: An MRI physics playground (Bloch 1946; Liang and Lauterbur 2000).
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The Bloch equations are solved analytically in the rotating frame: after a 90-degree pulse the magnetization precesses while the transverse component decays with T2 and the longitudinal component recovers to M0 with T1, tracing a spiral on the Bloch sphere and producing the free induction decay whose Fourier transform is a Lorentzian. A brain-like phantom is imaged with the spin-echo equation S ~ rho (1 - e -TR/T1) e -TE/T2 or the spoiled gradient-echo Ernst-angle equation; the image is transformed to k-space and reconstructed by a 2D inverse Fourier transform, and discarding the outer k-space lines blurs it.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Switch the weighting (T1, T2, proton density): the same phantom changes contrast as TR and TE move, since each tissue has different T1 and T2.
VO: Reduce the k-space kept (%): the image blurs as you discard the high-frequency outer k-space, the direct trade-off behind fast undersampled acquisition.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The magnetisation magnitude is conserved under pure precession, T1 and T2 relaxation follow the Bloch laws, the spin-echo signal reaches its expected limits at the Ernst angle, and discarding the outer k-space lines blurs the image.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- A magnetization vector precessing and rel…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Liang and Lauterbur, Principles of Magnetic Resonance Imaging; Bloch 1946.
