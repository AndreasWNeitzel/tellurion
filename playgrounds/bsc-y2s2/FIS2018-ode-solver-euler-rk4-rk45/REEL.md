# Reel script: ODE Solvers: Euler vs RK4 vs RK45

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Integrate a frictionless oscillator three ways: Euler pumps energy in until it spirals out, RK4 holds, RK45 watches its own error and adjusts.
Caption: Integrate a frictionless oscillator three…

## Beat 2, the reveal (3 to 10s)
VO: On the simple harmonic oscillator, where the exact orbit is a closed ellipse in phase space, the integrator choice is laid bare.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Forward Euler is only first order and systematically injects energy, so its orbit spirals outward; classical RK4 is fourth order and tracks the true ellipse for a long time; RK45 carries two solutions of different order, uses their difference to estimate the local error, and adapts its step size. The playground runs all three and shows the phase-space orbits and the energy drift.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Watch the energy: explicit Euler spirals outward, pumping energy in without bound, while RK4 hugs the true orbit and RK45 adapts its step to a tolerance.
VO: Enlarge the time step: every method degrades, but Euler blows up first. Accuracy and stability are bought with smaller steps or higher order.
VO: Read the energy-drift readout: for a Hamiltonian system the conserved energy is the honest scorecard, exposing which integrator is quietly lying.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: It is the cleanest argument for why order and adaptivity matter.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Integrate a frictionless oscillator three…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Villate, Numerical Methods (VPython), Ch. 5.
