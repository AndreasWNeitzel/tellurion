# Reel script: ODE Solvers: Euler vs RK4 vs RK45

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Integrate a frictionless oscillator three ways: Euler pumps energy in until it spirals out, RK4 holds, RK45 watches its own error and adjusts.
Caption: Integrate a frictionless oscillator three…

## Beat 2, the reveal (3 to 10s)
VO: What you are seeing: all three methods integrate x¨=−ω2x\ddot x = -\omega^2 xx¨=−ω2x from the same initial condition.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Euler's explicit step pumps energy upward without bound; RK4 stays close to the true orbit at fourth-order accuracy; adaptive RK45 chooses its own step size from local error estimates. The phase-space plot at right shows each trajectory in (x,v)(x, v)(x,v).
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Vary each control and watch the rail readouts respond.
VO: Compare the diagnostic plot against the live scene.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The phase-space plot at right shows each trajectory in (x,v)(x, v)(x,v).
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Integrate a frictionless oscillator three…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
villate-vpython
