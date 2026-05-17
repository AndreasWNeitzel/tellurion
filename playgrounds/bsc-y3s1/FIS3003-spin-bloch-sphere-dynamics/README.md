# Spin on the Bloch Sphere

A spin-1/2 (qubit) is a unit Bloch vector. A static field along z
makes it precess about the pole axis at the Larmor rate w0; a
circularly polarized RF field of strength w1 at frequency w_rf adds a
second torque. The motion is the torque equation dS/dt = Omega(t) x S,
integrated by exact rotations, so the spin always stays on the unit
sphere. The 3D scene (drawn in plain Canvas2D, no WebGL) shows the
spin vector, its trajectory, the drive axis, and the |0>, |1>, |+>,
|i> kets. Drag the sphere to orbit the camera in 3D.

What to look for: the purple curve is the spin's own predicted path
S(t); the ring on it marks the present, so the green spin arrow tip
sits there and then travels along the purple curve. In the lab frame
that path is a busy Larmor + Rabi spiral that tracks no single fixed
arrow, which is correct: the drive axis itself rotates, so there is
no static cone to follow. Switch to the rotating frame and the same
path collapses to a clean precession cone about the now-static
effective field. With the drive off it is pure precession, a fixed
cone in either frame. Set the Rabi slider above zero and the detuning to zero
(resonance) and the vector spirals from the north pole down across
the equator to the south pole and back, a Rabi flop. Hit "pi pulse"
from |0> and the qubit inverts to |1>; "pi/2 pulse" stops it on the
equator (an equal superposition). Add detuning and the inversion no
longer reaches the south pole: the deepest point is exactly
w1^2/(w1^2 + Delta^2) of the way. The |S| readout holds at 1.000000
the whole time, the numerical statement that a pure state stays pure.

Controls: drag the sphere to rotate the 3D view; Larmor w0 and Rabi
w1 set the two rates; detuning d offsets the drive from resonance;
the frame selector switches between the lab view (spiralling) and the
rotating frame (the drive axis stands still); show trail toggles the
trajectory; the pulse buttons apply instantaneous pi and pi/2
rotations; Reset returns to |0>, the default view, and Pause freezes
the evolution.

## Reference

Primary citation: Sakurai and Napolitano, *Modern Quantum Mechanics*
(3rd ed.), Sec. 2.1 (`sakurai-qm`); Griffiths, *Introduction
to Quantum Mechanics* (3rd ed.), Sec. 4.4 (`griffiths-qm`).

## Verification

- Strong invariant: exact rotation integration conserves |S| to
  better than 1e-9; the resonant pi-pulse inverts +z to -z and the
  off-resonance Sz(t) matches the closed-form generalized Rabi
  formula within 2e-3.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
