# Force and torque on a current loop

A current loop sitting in a uniform magnetic field feels no net force, because the magnetic forces on its opposite sides point opposite ways and cancel, but it does feel a torque, and that torque is the working principle of every electric motor. The loop acts like a small bar magnet with magnetic moment $\mathbf{m} = N I A\,\hat{\mathbf{n}}$, and the field twists it with $\boldsymbol{\tau} = \mathbf{m}\times\mathbf{B}$, whose size $N I A B\sin\theta$ is largest when the loop faces along the field and zero when its moment is already aligned with $\mathbf{B}$. The top panel shows the loop turning about a vertical axis, the force couple (red) on its two axis-parallel sides, the current direction (green), and the moment vector $\mathbf{m}$ (purple); the middle panel is the torque against orientation, and the bottom panel is the motion in time.

In free mode the loop is a magnetic pendulum: it swings and, with a little damping, settles with $\mathbf{m}$ pointing along $\mathbf{B}$, the stable zero of the torque curve, exactly as a compass needle lines up with the Earth's field. Watch the force couple grow as the loop turns to face the field and vanish as it aligns, which is the geometric content of the $\sin\theta$. Toggle to motor mode and a commutator reverses the current every half turn, right at the orientations where the torque would otherwise flip sign; the current and the forces reverse, the torque keeps driving the same way, and the loop spins continuously up to a terminal speed where the magnetic drive balances the load. The torque is lumpy, following $|\sin\theta|$, which is the torque ripple a single-loop motor has and that real motors smooth out by stacking many windings at different angles.

The toggle switches motor and free; the field, current, and load sliders set the drive and the resistance to motion; Reset returns to the free pendulum and Pause freezes the scene. The motion is a symplectic integration of $I_\text{m}\ddot\theta = \tau - \gamma\dot\theta$, so the undamped free pendulum conserves its energy and the motor's terminal speed matches $(2/\pi)NIAB/\gamma$.

## Reference

Griffiths, *Introduction to Electrodynamics*, 5th ed., Sec. 6.1.3 (torque on a magnetic dipole); Halliday, Resnick and Walker, *Fundamentals of Physics*, Ch. 28 (the electric motor).

## Verification

- Strong invariants: the torque equals $N I A B\sin\theta$; the undamped free pendulum conserves $\tfrac12 I_\text{m}\dot\theta^2 + U$; the motor reaches the terminal speed $(2/\pi)NIAB/\gamma$.
- Visual gate: SSIM against committed golden frames at both folds.
