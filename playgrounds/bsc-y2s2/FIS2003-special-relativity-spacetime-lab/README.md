# Special Relativity Spacetime Lab

This playground turns the Lorentz transformation into something you
watch. A rod-train of rest length L0 runs out to a distance L and back
at speed beta = v/c. The solid rod is drawn Lorentz-contracted to
L0/gamma against its dashed rest length, and two twin clocks tick: the
one riding the train accumulates proper time more slowly than the one
at the home station. The side panel is the Minkowski diagram, with the
45-degree light cone, the boosted lines of simultaneity, and the bent
twin worldline.

Push the speed slider toward 1 and the effects become dramatic: at
beta = 0.866 (gamma = 2) the rod is half its rest length and the
travelling twin returns having aged exactly half as much as the
stay-home twin. The simultaneity lines tilt toward the light cone,
showing that observers in relative motion disagree about which events
are simultaneous. The spacetime interval s^2 = t^2 - x^2 is the one
quantity every frame agrees on, and the headless engine checks it is
invariant under every boost.

The speed slider sets beta (and hence gamma, the contraction and the
dilation); the trip-distance slider sets the round-trip length and the
size of the twin age gap. Reset returns to beta = 0.8, L = 8 and Pause
freezes the animation. The readout reports beta, gamma, L/L0 and both
clock readings.

## Reference

Primary citation: Taylor and Wheeler, *Spacetime Physics* (2nd ed.),
Ch. 3-4 (`taylor-wheeler`).

## Verification

- Strong invariant: s^2 = t^2 - x^2 invariant under any boost within
  1e-10; the rod measures L0/2 and the traveller ages half at
  beta = 0.866.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
