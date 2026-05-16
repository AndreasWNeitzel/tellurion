# Bernoulli air-blower ball

A light ball is suspended in a turbulent air jet, the classic "ball on
a hair-dryer" demo. The ball hovers at the height where the upward
quadratic drag of the jet balances its weight. It is also laterally
stable: a finite sphere samples a higher air speed (hence lower static
pressure) on the side facing the fast jet core, so there is a net
restoring force back toward the axis. That is the everyday Bernoulli /
entrainment effect, modelled here as a pressure imbalance across the
ball.

Look for the self-centring. Drag the ball out of the jet and release
it: it slides back into the core and re-levitates. Tilt the nozzle and
the hover point follows the tilted axis, the ball riding the jet at an
angle. Push the power too low and no balance height exists, so the
ball simply falls.

Controls: blower power sets the jet speed, tilt rotates the nozzle, the
Blower button cuts the air (the ball drops), Reset re-drops the ball on
the axis, and the ball itself is draggable. Reference: Tritton,
Physical Fluid Dynamics 2e, turbulent free jet (`tritton`).

## Verification

- Strong invariants: on-axis ball settles to a bounded hover height;
  an off-axis ball converges back to the jet; blower off -> the ball
  falls; equilibrium height rises with power (7 tests).
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE (tilt swept across the five frames).
- Last verified: see `.verified`.
