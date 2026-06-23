# Reel script: Two-Stream Instability (1D PIC)

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Two counter-streaming electron beams are unstable: density ripples grow exponentially at the analytic rate omega p/(2 sqrt 2), the beams wind into phase-space electron-hole vortices, and a spectrogram shows mode 1 dominating then spawning harmonics at saturation.
Caption: Two counter-streaming electron beams are…

## Beat 2, the reveal (3 to 10s)
VO: A 1D-1V particle-in-cell simulation of the two-stream instability: two cold counter-streaming electron beams against a neutralising ion background, 10000 macro-particles, NGP deposit, DFT Poisson solve, leapfrog push (Hockney and Eastwood 1988).
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The upgraded scene shows the (x, v) phase space drawn with persistence so the electron-hole vortices leave trails, a density-mode spectrogram (|rho hat[k]| for k = 1..
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag a control and watch the whole picture change, not just a number on the side.
VO: Push it to an extreme and see where the physics breaks down.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The upgraded scene shows the (x, v) phase space drawn with persistence so the electron-hole vortices leave trails, a density-mode spectrogram (|rho hat[k]| for k = 1..
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Two counter-streaming electron beams are…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
of slope gamma = omega p/(2 sqrt 2) (Krall and Trivelpiece) plus a live measured-vs-analytic readout. The default beam speed v0 = 0.6 places the fundamental near the peak-growth wavenumber, so the measured linear-regime growth rate tracks the closed-form value to a few percent. The closed-form dispersion gives maximum growth exactly omega p/(2 sqrt 2) at k 2 v0 2 = 3 omega p 2/8, with instability for k v0 < omega p, and the measured linear-regime growth tracks it to a few percent. Reference: Krall and Trivelpiece, Principles of Plasma Physics, Chapter 9; Birdsall and Langdon, Plasma Physics via Computer Simulation.
