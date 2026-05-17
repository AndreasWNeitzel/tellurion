# Action-Angle Variables

Hamilton-Jacobi theory says that for a bound system there is a change
of coordinates that makes the dynamics trivial: one variable, the
action J, is constant, and its partner, the angle, just increases
linearly in time. The action is a geometric quantity, the area the
orbit sweeps out in phase space divided by 2 pi. The left panel shows
that orbit with the area shaded; the right shows the action-angle
picture, where the harmonic oscillator becomes a circle of radius
sqrt(2J) with a hand sweeping round at constant rate.

What to look for: drag the energy and the orbit and its shaded area
grow together, J climbing with them. For the harmonic potential the
angle marker rotates at exactly the same rate no matter how big the
orbit, that is isochrony, the reason a pendulum clock keeps time only
for small swings. Switch to the pendulum and the marker visibly slows
as you raise the energy. Now tick the adiabatic box: omega0 ramps up
and down slowly, the energy readout swings with it, but the dJ/J
readout barely leaves zero. That stubbornly constant action is the
adiabatic invariant, the thing that survives slow change.

Controls: the potential selector chooses harmonic, pendulum or
quartic; energy sets the orbit size; omega0 the stiffness; the
adiabatic toggle ramps omega0 slowly; Reset and Pause.

## Reference

Primary citation: Goldstein, Poole and Safko, *Classical Mechanics*
(3rd ed.), Ch. 10 (`goldstein-mech`); Landau and Lifshitz,
*Mechanics* (3rd ed.), Sec. 49-50 (`landau-mechanics`).

## Verification

- Strong invariant: the harmonic action from the contour integral
  equals E/w0 to 0.1 percent and the oscillator is isochronous; the
  orbit is a circle of radius sqrt(2J); the angle advances in equal
  steps; the pendulum is anharmonic; and the action is adiabatically
  invariant (|dJ/J| < 2 percent while the energy changes by more
  than 40 percent under a slow ramp).
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
