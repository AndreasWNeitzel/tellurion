# Bouncing balls in a concave bowl

Six balls fall under gravity into a bowl whose profile you pick. Each
time a ball meets the surface its velocity is reflected about the local
tangent and the normal part is scaled by the restitution. The shape of
the bowl decides the character of the motion: a parabola swings the
balls almost like a mass on a spring, the V-bowl gives straight
free-flight arcs with a sharp turn at the vertex, the quartic has a
flat floor where the period stretches with amplitude, and the circular
arc behaves like a pendulum.

Watch the restitution. At e = 1 with no friction the balls bounce
forever and the energy readout stays flat. Lower e and each impact
drains energy until the balls pool at the bottom of the bowl. Change
the curvature to widen or steepen the well; switch shapes to compare
how the same drop plays out.

Controls: the shape menu, the restitution and curvature sliders, Drop
again to re-release the balls, and Pause/Play. The energy and
max-speed readouts track the dissipation. Reference: Kleppner and
Kolenkow, An Introduction to Mechanics 2e, ch. 4 (`kleppner`).

## Verification

- Strong invariants: e=1 energy conserved; e<1 dissipates without
  injection; balls never sink through the surface; parabola small
  oscillations match 2 pi / sqrt(2 a g) (5 tests).
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE (the five bowl shapes across the frames).
- Last verified: see `.verified`.
