# Foucault Pendulum on a Rotating Earth

Release the bob and watch its plane of oscillation slowly turn against
the floor. That turning IS the rotation of Earth made visible: the
Coriolis force in the co-rotating frame rotates the swing plane at
angular rate Omega_earth * sin(latitude).

Slide latitude from the equator (0, no precession) to the pole (90,
one full revolution per sidereal day) and the floor rosette tightens
from a straight line to a fully closed petal pattern.

Engine: rotating-frame harmonic oscillator integrated with a Boris-
style symplectic step (Coriolis term as exact 2D velocity rotation).

Reference: Foucault 1851, Comptes Rendus 32 p. 135; Goldstein,
Classical Mechanics, Ch. 4.10.
