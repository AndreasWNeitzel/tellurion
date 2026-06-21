# An electric dipole in a uniform field

A uniform field pulls a dipole's two charges in opposite directions with equal force, so there is no net push, only a twist. The two forces make a couple, and the torque $\boldsymbol{\tau} = \mathbf{p}\times\mathbf{E}$, of size $pE\sin\theta$, always rotates the dipole toward alignment with the field. The scene draws the field (teal), the force on each charge (gold), the dipole moment $\mathbf{p}$ (purple) along the rod, and the angle the dipole makes with the field. Drag the dipole to any orientation and let go.

Released at an angle, the dipole does not just snap into place. It swings toward the field, overshoots, and comes back, librating about the field direction exactly as a pendulum rocks about straight down, with small-oscillation period $T = 2\pi\sqrt{I/pE}$. The stored orientation energy is $U = -\mathbf{p}\cdot\mathbf{E} = -pE\cos\theta$, lowest when the dipole points along the field and highest when it points against it. The bottom panel is that energy well: the green curve is $U(\theta)$, the dashed line is the total energy, and the dipole, drawn as a ball on the curve, rocks between the two turning points where the line crosses the well, the shaded gap above it being the kinetic energy.

The field slider deepens the well and quickens the swing (the period shrinks as $1/\sqrt{E}$). The damping slider sets the losses: at zero the dipole librates forever and the total-energy line holds steady, energy conserved; turn it up and the line descends, the turning points close in, and the dipole spirals into alignment at the bottom of the well, which is why dipoles end up pointing along the field.

## Reference

Griffiths, *Introduction to Electrodynamics*, 4th ed., Sec. 4.1.3 (torque and energy of a dipole in a field); Taylor, *Classical Mechanics*, Sec. 4.4 (the rigid-pendulum libration).

## Verification

- Strong invariants: the torque $\tau = -pE\sin\theta$ is restoring and vanishes at alignment and anti-alignment; the orientation energy $U = -pE\cos\theta$ is minimum at alignment; without damping the total energy is conserved over a libration (symplectic integrator).
- Visual gate: SSIM against committed golden frames at both folds.
